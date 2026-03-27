import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { TournamentHistoryDoc } from '@/lib/models';

const DB = 'smashtour';
const COL = 'tournament_history';
const PLAYERS_COL = 'players';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = client.db(DB);
  const col = db.collection<TournamentHistoryDoc>(COL);

  if (req.method === 'GET') {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const skip = Number(req.query.skip ?? 0);
    const history = await col.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await col.countDocuments();
    return res.status(200).json({ history, total });
  }

  if (req.method === 'POST') {
    const body = req.body as TournamentHistoryDoc;
    const doc: TournamentHistoryDoc = {
      ...body,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    const result = await col.insertOne(doc);

    // Update participant career stats
    const playerCol = db.collection(PLAYERS_COL);
    for (const p of body.participants) {
      const isChampion = body.champion.split(' & ').some(n => n.trim() === p.name);
      await playerCol.updateOne(
        { name: { $regex: `^${p.name}$`, $options: 'i' } },
        {
          $inc: {
            'stats.tournamentsPlayed': 1,
            'stats.titles': isChampion ? 1 : 0,
          },
        }
      );
    }

    // Update win/loss stats from match history
    const playerWins: Record<string, number> = {};
    const playerLosses: Record<string, number> = {};
    for (const m of body.matches) {
      for (const name of m.winner.split(' & ')) {
        playerWins[name.trim()] = (playerWins[name.trim()] ?? 0) + 1;
      }
      const loser = m.winner === m.teamA ? m.teamB : m.teamA;
      for (const name of loser.split(' & ')) {
        playerLosses[name.trim()] = (playerLosses[name.trim()] ?? 0) + 1;
      }
    }
    for (const [name, wins] of Object.entries(playerWins)) {
      await playerCol.updateOne(
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { $inc: { 'stats.wins': wins } }
      );
    }
    for (const [name, losses] of Object.entries(playerLosses)) {
      await playerCol.updateOne(
        { name: { $regex: `^${name}$`, $options: 'i' } },
        { $inc: { 'stats.losses': losses } }
      );
    }

    return res.status(201).json({ _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
