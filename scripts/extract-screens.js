#!/usr/bin/env node
/**
 * Script to extract screen components from monolithic pages/index.tsx
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../pages/index.tsx');
const SCREENS_DIR = path.join(__dirname, '../components/screens');

// Ensure screens directory exists
if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

// Read the entire index.tsx file
const content = fs.readFileSync(INDEX_PATH, 'utf-8');
const lines = content.split('\n');

// Screen definitions with their line ranges (from grep output)
const screens = [
  { name: 'SetupScreen', start: 310, end: 509 },
  { name: 'ChampionScreen', start: 1301, end: 1325 },
  { name: 'HistoryScreen', start: 1325, end: 1530 },
  { name: 'RankingsScreen', start: 1743, end: 1964 },
  { name: 'PaymentScreen', start: 2608, end: 4872 },
  { name: 'BetsScreen', start: 4872, end: 4999 }, // BetHistoryScreen
  { name: 'AttendanceScreen', start: 4999, end: 5400 }, // Estimated
];

// Extract helper components and types
function extractImports() {
  return `import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PlayerDoc, TournamentHistoryDoc, CourtSessionDoc, PaymentConfigDoc, ImportRow, BetDoc, SessionPollDoc, PollResponseDoc, VenueDoc } from '@/lib/models';
import type { Player, Team, Match, Round, RRStats, GameType, TourneyFormat, TournamentState } from '@/lib/tournament';
import { Btn, Card, CardTitle, EmptyState, TruncName, Badge } from '@/components/ui';
import { formatVND, formatDate, formatDateTime } from '@/lib/utils/formatters';
import { parseImportText } from '@/lib/payment';
import Scoreboard from '@/components/Scoreboard';
`;
}

// Function to find the end of a function (simple heuristic)
function findFunctionEnd(lines, startIdx) {
  let braceCount = 0;
  let inFunction = false;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Count braces
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          return i;
        }
      }
    }
  }

  return startIdx + 100; // fallback
}

console.log('Extracting screen components from pages/index.tsx...\n');

// Process each screen
for (const screen of screens) {
  console.log(`Extracting ${screen.name}...`);

  const startLine = screen.start - 1; // Convert to 0-indexed
  let endLine = screen.end || findFunctionEnd(lines, startLine);

  // Extract the function code
  const functionLines = lines.slice(startLine, endLine + 1);
  const functionCode = functionLines.join('\n');

  // Generate the screen component file
  const componentCode = `${extractImports()}
${functionCode}

export default ${screen.name};
`;

  // Write to file
  const filePath = path.join(SCREENS_DIR, `${screen.name}.tsx`);
  fs.writeFileSync(filePath, componentCode);

  console.log(`  ✓ Created ${screen.name}.tsx`);
}

console.log('\n✅ All screens extracted successfully!');
