## Summary
<!-- Brief description of what this PR does (1–3 sentences) -->

## Story
**As a** [Host/Player]
**I want** [feature]
**So that** [benefit]

## Changes
- Screen/component added:
- Files modified:
- New dependencies: (or "None")

## Design Spec
<!-- Link to documents/design_handoff_court/<feature>/README.md or Figma -->

## Screenshots

### Before
<!-- Screenshot of current state (if applicable) -->

### After (Desktop)
<!-- Screenshot of new implementation at 1440px+ -->

### After (Mobile)
<!-- Screenshot of new implementation at <768px -->

## Testing

- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing complete (see QA checklist below)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Visual regression tests pass

## QA Checklist

### Functional Testing
- [ ] All acceptance criteria met
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] User interactions work (clicks, hovers, keyboard)
- [ ] No console errors/warnings
- [ ] Existing features still work (regression)

### Visual Testing
- [ ] Matches design spec/prototype exactly
- [ ] Court colors correct (ink/paper/volt, no purple)
- [ ] Typography correct (Archivo/Space Mono)
- [ ] Spacing follows 8px grid
- [ ] Sharp corners (2–4px radius)
- [ ] Responsive (desktop 1440px+, tablet 768–1439px, mobile <768px)
- [ ] Cross-browser tested (Chrome, Safari, Firefox)

### Accessibility
- [ ] Keyboard navigation works (all elements focusable, tab order logical)
- [ ] Focus states visible (2px ink outline)
- [ ] WCAG AA contrast ratios met (ink on paper ≥7:1, muted ≥4.5:1)
- [ ] Touch targets ≥44×44px on mobile
- [ ] ARIA labels present where needed
- [ ] Screen reader tested

### Performance
- [ ] Lighthouse Performance score ≥90
- [ ] Lighthouse Accessibility score 100
- [ ] No bundle size regressions (>10KB without justification)

## Code Quality Checklist

- [ ] TypeScript compiles (`npm run type-check`) — 0 errors
- [ ] Linting passes (`npm run lint`) — 0 warnings
- [ ] Build succeeds (`npm run build`)
- [ ] Design matches prototype exactly
- [ ] Domain logic (`lib/`) unchanged or tests updated
- [ ] No hardcoded colors (uses Court tokens only)
- [ ] Components extracted to `/components` if reusable
- [ ] Tests cover edge cases (≥80% coverage for new code)
- [ ] Documentation/comments for complex logic

## Deployment Notes
<!-- Any special deployment steps, database migrations, environment variables, etc. -->

---

**Ready for review:** [ ] Yes / [ ] No (draft)

**Reviewers needed:**
- [ ] Code review (solution architect / senior dev)
- [ ] QA review (QA engineer)
- [ ] Design review (UX/UI designer)
