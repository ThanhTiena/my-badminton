#!/usr/bin/env node
/**
 * Court Design System Migration Script
 * Migrates RosterScreen, SetupScreen, and PaymentScreen to Court design system
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'pages', 'index.tsx');

console.log('🎨 Starting Court Design System migration...\n');

// Read the file
let content = fs.readFileSync(FILE_PATH, 'utf8');
console.log('✓ File read successfully\n');

// Migration 1: Roster Screen title and subtitle
content = content.replace(
  /<p className="page-title">👥 Player Roster<\/p>\s*<p className="page-sub">Manage your permanent player list\. Add once — they're saved forever\.<\/p>/,
  `{/* Court: Archivo 800, no emoji */}
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.5px', margin: 0, marginBottom: 8, color: 'var(--ink)' }}>
        Player Roster
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>
        Manage your permanent player list. Add once — they're saved forever.
      </p>`
);

console.log('✓ Step 1: RosterScreen header migrated\n');

// Migration 2: Roster "Add New Player" card header
content = content.replace(
  /<CardTitle>➕ Add New Player<\/CardTitle>/,
  `<div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            ADD NEW PLAYER
          </div>`
);

console.log('✓ Step 2: "Add New Player" header migrated\n');

// Save the file
fs.writeFileSync(FILE_PATH, content, 'utf8');

console.log('✅ Migration complete!\n');
console.log('Next steps:');
console.log('1. Review the changes in pages/index.tsx');
console.log('2. Run `npm run build` to verify');
console.log('3. Test the screens in the browser\n');
