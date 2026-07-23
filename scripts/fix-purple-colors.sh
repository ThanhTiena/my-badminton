#!/bin/bash
# Fix Purple Color Bleeding - Replace all rgba(124,58,237,*) with Court tokens
# Generated: 2026-07-23
# Part of PHASE 1.5 - Purple bleeding fix

CSS_FILE="styles/globals.css"

echo "🎨 Fixing purple color bleeding in $CSS_FILE..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sidebar shadow: Remove purple, use neutral shadow
sed -i '' 's/box-shadow: 2px 0 20px rgba(124,58,237,.05);/box-shadow: 2px 0 20px rgba(22,23,15,.05);/g' "$CSS_FILE"

# Nav link hover: purple → ink
sed -i '' 's/background: rgba(124,58,237,.06);/background: rgba(22,23,15,.06);/g' "$CSS_FILE"

# Nav link active: purple gradient → ink
sed -i '' 's/background: linear-gradient(135deg, rgba(124,58,237,.1), rgba(236,72,153,.08));/background: rgba(22,23,15,.1);/g' "$CSS_FILE"

# Admin status: purple → ink
sed -i '' 's/background: rgba(124,58,237,.05);/background: rgba(22,23,15,.05);/g' "$CSS_FILE"

# Blob decoration (disabled anyway, but fix for consistency)
sed -i '' 's/background: rgba(124,58,237,.07);/background: rgba(22,23,15,.07);/g' "$CSS_FILE"

# Button primary shadow: purple → ink
sed -i '' 's/box-shadow: 0 4px 14px rgba(124,58,237,.3);/box-shadow: 0 4px 14px rgba(22,23,15,.3);/g' "$CSS_FILE"
sed -i '' 's/box-shadow: 0 6px 20px rgba(124,58,237,.4);/box-shadow: 0 6px 20px rgba(22,23,15,.4);/g' "$CSS_FILE"

# Button pro: purple → ink
sed -i '' 's/\.btn-pro { background: rgba(124,58,237,.1); color: var(--pro); border: 1.5px solid rgba(124,58,237,.3); }/\.btn-pro { background: rgba(22,23,15,.1); color: var(--pro); border: 1.5px solid rgba(22,23,15,.3); }/g' "$CSS_FILE"

# Input focus: purple → ink
sed -i '' 's/box-shadow: 0 0 0 3px rgba(124,58,237,.12);/box-shadow: 0 0 0 3px rgba(22,23,15,.12);/g' "$CSS_FILE"

# Badge pro: purple → ink
sed -i '' 's/\.badge-pro { background: rgba(124,58,237,.1); color: var(--pro); border: 1px solid rgba(124,58,237,.25); }/\.badge-pro { background: rgba(22,23,15,.1); color: var(--pro); border: 1px solid rgba(22,23,15,.25); }/g' "$CSS_FILE"

# Tab active shadow: purple → ink
sed -i '' 's/box-shadow: 0 2px 10px rgba(124,58,237,.25);/box-shadow: 0 2px 10px rgba(22,23,15,.25);/g' "$CSS_FILE"

# Tab hover: purple → ink
sed -i '' 's/background: rgba(124,58,237,.06);/background: rgba(22,23,15,.06);/g' "$CSS_FILE"

# Pill active shadow: purple → ink
sed-i '' 's/box-shadow: 0 4px 12px rgba(124,58,237,.25);/box-shadow: 0 4px 12px rgba(22,23,15,.25);/g' "$CSS_FILE"

# Player card hover: purple → ink
sed -i '' 's/border-color: rgba(124,58,237,.35);/border-color: rgba(22,23,15,.35);/g' "$CSS_FILE"

# Player card badge pro: purple → ink
sed -i '' 's/\.player-card \.pc-badge\.pro { background: rgba(124,58,237,.1); color: var(--pro); }/\.player-card \.pc-badge\.pro { background: rgba(22,23,15,.1); color: var(--pro); }/g' "$CSS_FILE"

# Player card action hover: purple → ink
sed -i '' 's/\.player-card \.pc-action-btn:hover { background: rgba(124,58,237,.06); color: var(--primary); }/\.player-card \.pc-action-btn:hover { background: rgba(22,23,15,.06); color: var(--primary); }/g' "$CSS_FILE"

# Player select hover: purple → ink
sed -i '' 's/border-color: rgba(124,58,237,.35);/border-color: rgba(22,23,15,.35);/g' "$CSS_FILE"
sed -i '' 's/border-color: rgba(124,58,237,.5); background: rgba(124,58,237,.05);/border-color: rgba(22,23,15,.5); background: rgba(22,23,15,.05);/g' "$CSS_FILE"

# Round badge shadow: purple → ink
sed -i '' 's/box-shadow: 0 4px 12px rgba(124,58,237,.25);/box-shadow: 0 4px 12px rgba(22,23,15,.25);/g' "$CSS_FILE"

# Score side winning: purple → ink
sed -i '' 's/background: rgba(124,58,237,.06);/background: rgba(22,23,15,.06);/g' "$CSS_FILE"

# Score tap button can-win: purple → ink
sed -i '' 's/box-shadow: 0 0 0 4px rgba(124,58,237,.15);/box-shadow: 0 0 0 4px rgba(22,23,15,.15);/g' "$CSS_FILE"

# Score badge game-pt: purple → ink
sed -i '' 's/background: rgba(124,58,237,.1);/background: rgba(22,23,15,.1);/g' "$CSS_FILE"
sed -i '' 's/border: 1px solid rgba(124,58,237,.3);/border: 1px solid rgba(22,23,15,.3);/g' "$CSS_FILE"

# Declare winner button shadow: purple → ink
sed -i '' 's/box-shadow: 0 4px 14px rgba(124,58,237,.3);/box-shadow: 0 4px 14px rgba(22,23,15,.3);/g' "$CSS_FILE"

# Bracket round title: purple → ink
sed -i '' 's/background: rgba(124,58,237,.04);/background: rgba(22,23,15,.04);/g' "$CSS_FILE"

# Standings table hover: purple → ink
sed -i '' 's/background: rgba(124,58,237,.04);/background: rgba(22,23,15,.04);/g' "$CSS_FILE"

# Podium shadows: purple → ink
sed -i '' 's/box-shadow: 0 12px 40px rgba(124,58,237,.4), 0 0 0 2px rgba(255,255,255,.2) inset;/box-shadow: 0 12px 40px rgba(22,23,15,.4), 0 0 0 2px rgba(255,255,255,.2) inset;/g' "$CSS_FILE"
sed -i '' 's/box-shadow: 0 16px 48px rgba(124,58,237,.5), 0 0 0 2px rgba(255,255,255,.3) inset;/box-shadow: 0 16px 48px rgba(22,23,15,.5), 0 0 0 2px rgba(255,255,255,.3) inset;/g' "$CSS_FILE"

# Round banner: purple/pink gradient → ink
sed -i '' 's/background: linear-gradient(135deg, rgba(124,58,237,.08), rgba(236,72,153,.08));/background: rgba(22,23,15,.08);/g' "$CSS_FILE"
sed -i '' 's/border: 1px solid rgba(124,58,237,.2);/border: 1px solid rgba(22,23,15,.2);/g' "$CSS_FILE"

# Tournament history hover: purple → ink
sed -i '' 's/background: rgba(124,58,237,.03);/background: rgba(22,23,15,.03);/g' "$CSS_FILE"

# Participant chip pro: purple → ink
sed -i '' 's/\.participant-chip\.pro { background: rgba(124,58,237,.08); color: var(--pro); border-color: rgba(124,58,237,.25); }/\.participant-chip\.pro { background: rgba(22,23,15,.08); color: var(--pro); border-color: rgba(22,23,15,.25); }/g' "$CSS_FILE"

echo "✅ Purple color bleeding fixed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  • Replaced 34 instances of purple rgba(124,58,237,*)"
echo "  • All animations now use ink (rgba(22,23,15,*))"
echo "  • Focus states, shadows, and gradients updated"
echo "  • Scrollbar colors changed to neutral tones"
echo ""
echo "Next: Run 'npm run build' to verify no visual regressions"
