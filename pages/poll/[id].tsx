// Public poll page - RSVP for session attendance
// Accessible without login
// Mobile-first design with 1-tap RSVP

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface PollData {
  _id: string;
  sessionDate: string;
  sessionTime?: string;
  venueId?: string;
  venueName?: string;
  pollTitle: string;
  pollDescription?: string;
  rsvpDeadline: string;
  maxPlayers?: number;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  yesCount: number;
  maybeCount: number;
  noCount: number;
  guestCount: number;
  responseCount: number;
}

interface Player {
  _id: string;
  name: string;
  group: 'pro' | 'beg';
}

export default function PollPage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState<PollData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RSVP form state
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [response, setResponse] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [guestCount, setGuestCount] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch poll data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [pollRes, playersRes] = await Promise.all([
          fetch(`/api/polls/${id}`),
          fetch('/api/players'),
        ]);

        if (!pollRes.ok) {
          throw new Error('Poll not found');
        }

        const pollData = await pollRes.json();
        const playersData = await playersRes.json();

        setPoll(pollData);
        setPlayers(playersData.players || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle RSVP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/polls/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer,
          response,
          guestCount: response === 'yes' ? guestCount : 0,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit RSVP');
      }

      setSubmitSuccess(true);

      // Refresh poll data to show updated counts
      const pollRes = await fetch(`/api/polls/${id}`);
      if (pollRes.ok) {
        const updatedPoll = await pollRes.json();
        setPoll(updatedPoll);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading poll...</p>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Poll Not Found</h1>
        <p>{error || 'This poll does not exist or has been removed.'}</p>
      </div>
    );
  }

  const isDeadlinePassed = new Date(poll.rsvpDeadline) < new Date();
  const isClosed = poll.status !== 'open';
  const canRespond = !isDeadlinePassed && !isClosed;

  const totalAttending = poll.yesCount + poll.guestCount;
  const totalPossible = totalAttending + Math.ceil(poll.maybeCount * 0.5);

  return (
    <>
      <Head>
        <title>{poll.pollTitle} - SmashTour</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.75rem', color: '#1f2937' }}>
              {poll.pollTitle}
            </h1>

            {poll.pollDescription && (
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                {poll.pollDescription}
              </p>
            )}

            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <strong>Date:</strong>
                <span>{new Date(poll.sessionDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>

              {poll.sessionTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>⏰</span>
                  <strong>Time:</strong>
                  <span>{poll.sessionTime}</span>
                </div>
              )}

              {poll.venueName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📍</span>
                  <strong>Venue:</strong>
                  <span>{poll.venueName}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⏳</span>
                <strong>RSVP by:</strong>
                <span>{new Date(poll.rsvpDeadline).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Response Counts */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
              Current Responses
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {totalAttending}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Attending
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  ({poll.yesCount} + {poll.guestCount} guests)
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {poll.maybeCount}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Maybe
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {poll.noCount}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Can't Make It
                </div>
              </div>
            </div>

            {poll.maxPlayers && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                <strong>Capacity:</strong> {poll.yesCount} / {poll.maxPlayers} players
              </div>
            )}
          </div>

          {/* RSVP Form */}
          {submitSuccess ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>RSVP Submitted!</h2>
              <p style={{ color: '#6b7280' }}>Thank you for responding. See you there!</p>
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                {canRespond ? 'Submit Your RSVP' : 'RSVP Closed'}
              </h2>

              {!canRespond && (
                <div style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  marginBottom: '1rem',
                }}>
                  {isDeadlinePassed ? 'The RSVP deadline has passed.' : 'This poll is no longer accepting responses.'}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Your Name
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    disabled={!canRespond || submitting}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select your name...</option>
                    {players.map((player) => (
                      <option key={player._id} value={player._id}>
                        {player.name} ({player.group.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Your Response
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {(['yes', 'maybe', 'no'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setResponse(opt)}
                        disabled={!canRespond || submitting}
                        style={{
                          padding: '1rem',
                          border: response === opt ? '2px solid #7c3aed' : '1px solid #d1d5db',
                          borderRadius: '8px',
                          background: response === opt ? '#ede9fe' : 'white',
                          color: response === opt ? '#7c3aed' : '#374151',
                          fontWeight: response === opt ? '600' : '400',
                          cursor: canRespond && !submitting ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                        }}
                      >
                        {opt === 'yes' && '✅ Yes'}
                        {opt === 'maybe' && '🤔 Maybe'}
                        {opt === 'no' && '❌ No'}
                      </button>
                    ))}
                  </div>
                </div>

                {response === 'yes' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Bringing Guests? (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      disabled={!canRespond || submitting}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={!canRespond || submitting}
                    placeholder="Any comments or questions?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {submitError && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    marginBottom: '1rem',
                  }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canRespond || submitting || !selectedPlayer}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: canRespond && selectedPlayer ? '#7c3aed' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: canRespond && selectedPlayer && !submitting ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit RSVP'}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '2rem', color: 'white', opacity: 0.8 }}>
            <p>SmashTour - Badminton Session Management</p>
          </div>
        </div>
      </div>
    </>
  );
}
