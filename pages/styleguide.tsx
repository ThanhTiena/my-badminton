import React, { useState } from 'react';
import { Btn, Card, CardTitle, Badge, EmptyState, TruncName, Confetti } from '@/components/ui';
import { Skeleton, SkeletonCard } from '@/components/ui/SkeletonLoader';

export default function StyleGuidePage() {
  const [confettiActive, setConfettiActive] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="main-content">
        <p>Style guide only available in development.</p>
      </div>
    );
  }

  const triggerConfetti = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 100);
  };

  return (
    <div className="app-shell">
      <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title">Design System Style Guide</h1>
          <p className="page-sub">
            Complete visual reference for the Court design system tokens and components.
          </p>
        </div>

        {/* Quick Navigation */}
        <nav style={{ marginBottom: 'var(--s-8)', padding: 'var(--s-3)', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--muted)', marginBottom: 'var(--s-2)' }}>Jump to Section</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', fontSize: '13px' }}>
            <a href="#colors" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Colors</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#typography" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Typography</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#spacing" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Spacing</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#radius" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Radius</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#shadows" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Shadows</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#buttons" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Buttons</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#inputs" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Inputs</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#badges" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Badges</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#cards" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Cards</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#tabs" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Tabs</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#pills" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Pills</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#alerts" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Alerts</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#empty-states" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Empty States</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#skeleton" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Skeletons</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#confetti" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Confetti</a>
            <span style={{ color: 'var(--line-strong)' }}>|</span>
            <a href="#stress-tests" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Stress Tests</a>
          </div>
        </nav>

        {/* COLORS */}
        <section id="colors" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Colors</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Court Neutrals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <ColorSwatch name="--ink" value="#16170F" usage="Primary text, dark surfaces" />
            <ColorSwatch name="--paper" value="#F3F1EA" usage="App canvas background" />
            <ColorSwatch name="--card" value="#FFFFFF" usage="Card surfaces" />
            <ColorSwatch name="--line" value="#E0DDD0" usage="Hairline borders" />
            <ColorSwatch name="--line-strong" value="#CFCBBC" usage="Stronger dividers" />
            <ColorSwatch name="--muted" value="#74715F" usage="Secondary text (AA on paper)" />
            <ColorSwatch name="--muted-2" value="#9A9685" usage="Tertiary / mono labels on dark" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Accent + Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <ColorSwatch name="--volt" value="#CBF14A" usage="Electric lime. ACTION + LIVE only" />
            <ColorSwatch name="--court-green" value="#1C3A2A" usage="Deep surface tone (optional)" />
            <ColorSwatch name="--win" value="#2F6E3A" usage="Positive / paid / success" />
            <ColorSwatch name="--loss" value="#C24226" usage="Destructive / due / loss" />
            <ColorSwatch name="--caution" value="#A8761B" usage="Warnings only" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Legacy Aliases</h3>
          <div style={{ background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)', padding: 'var(--s-4)' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 'var(--s-2)' }}>
              These aliases point to Court tokens for backward compatibility. Migrate to Court tokens and delete these when possible.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--s-2)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <div><span style={{ color: 'var(--muted-2)' }}>--primary</span> → var(--ink)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--accent</span> → var(--volt)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--success</span> → var(--win)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--danger</span> → var(--loss)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--warn</span> → var(--caution)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--bg</span> → var(--paper)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--bg-card</span> → var(--card)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--text</span> → var(--ink)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--text2</span> → var(--muted)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--pro</span> → var(--ink)</div>
              <div><span style={{ color: 'var(--muted-2)' }}>--beg</span> → var(--muted)</div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* TYPOGRAPHY */}
        <section id="typography" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Typography</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Font Families</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <div style={{ marginBottom: 'var(--s-3)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--font-display (Archivo)</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>The quick brown fox jumps over the lazy dog</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--muted)' }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--font-mono (Space Mono)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px' }}>The quick brown fox jumps over the lazy dog</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--muted)' }}>ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Font Sizes</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <div style={{ fontSize: '52px', fontWeight: '800', marginBottom: 'var(--s-2)' }}>52px - Hero</div>
            <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: 'var(--s-2)' }}>36px - Page Title</div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: 'var(--s-2)' }}>24px - Section Heading</div>
            <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: 'var(--s-2)' }}>20px - Large Text</div>
            <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: 'var(--s-2)' }}>15px - Body (default)</div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: 'var(--s-2)' }}>14px - Small Body</div>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: 'var(--s-2)' }}>13px - UI Text</div>
            <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: 'var(--s-2)' }}>12px - Caption</div>
            <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: 'var(--s-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>11px - Label</div>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>10px - Tiny Label</div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Font Weights</h3>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 400, marginBottom: 'var(--s-1)' }}>400 - Regular</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 'var(--s-1)' }}>500 - Medium</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--s-1)' }}>600 - Semibold</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--s-1)' }}>700 - Bold</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: 'var(--s-1)' }}>800 - Extra Bold</div>
            <div style={{ fontSize: '16px', fontWeight: 900 }}>900 - Black</div>
          </div>
        </section>

        <div className="divider" />

        {/* SPACING */}
        <section id="spacing" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Spacing (8px Grid)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <SpacingBar name="--s-1" value="8px" />
            <SpacingBar name="--s-2" value="16px" />
            <SpacingBar name="--s-3" value="24px" />
            <SpacingBar name="--s-4" value="32px" />
            <SpacingBar name="--s-6" value="48px" />
            <SpacingBar name="--s-8" value="64px" />
          </div>
        </section>

        <div className="divider" />

        {/* BORDERS & RADIUS */}
        <section id="radius" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Borders &amp; Radius</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Border Radius</h3>
          <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--r-sm (2px)</div>
              <div style={{ width: '100px', height: '100px', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r-sm)' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--r (4px)</div>
              <div style={{ width: '100px', height: '100px', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)' }} />
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Border Styles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <div style={{ padding: 'var(--s-2)', background: 'var(--card)', border: 'var(--border)' }}>
              --border (1px solid var(--line))
            </div>
            <div style={{ padding: 'var(--s-2)', background: 'var(--card)', border: '1.5px solid var(--line-strong)' }}>
              1.5px solid var(--line-strong)
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SHADOWS */}
        <section id="shadows" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Shadows</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 'var(--s-4)' }}>
            Court design uses borders, not shadows. Shadow variables are minimal.
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--shadow-card (none)</div>
              <div style={{ width: '150px', height: '100px', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-card)' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-2)', marginBottom: 'var(--s-1)' }}>--shadow (subtle)</div>
              <div style={{ width: '150px', height: '100px', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)' }} />
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* BUTTONS */}
        <section id="buttons" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Buttons</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Variants</h3>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="danger">Danger</Btn>
            <Btn variant="success">Success</Btn>
            <Btn variant="orange">Orange</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="pro">Pro</Btn>
            <Btn variant="beg">Beg</Btn>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Sizes</h3>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--s-6)' }}>
            <Btn variant="primary" size="sm">Small</Btn>
            <Btn variant="primary">Default</Btn>
            <Btn variant="primary" size="lg">Large</Btn>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>States</h3>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            <Btn variant="primary">Default</Btn>
            <Btn variant="primary" disabled>Disabled</Btn>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Full Width</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <Btn variant="primary" full>Full Width Button</Btn>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <Btn variant="primary">supercalifragilisticexpialidociousverylongwordthatneverstops</Btn>
            <Btn variant="secondary">OK</Btn>
            <Btn variant="danger">X</Btn>
            <Btn variant="success">🏸 Badminton 🏆 Tournament 🎉</Btn>
            <div style={{ maxWidth: '200px' }}>
              <Btn variant="primary" full>Truncation Test Button With Very Long Text</Btn>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* INPUTS */}
        <section id="inputs" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Inputs</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Text Input</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <input className="input" type="text" placeholder="Default input" />
            <input className="input" type="text" placeholder="Disabled input" disabled />
            <input className="input" type="text" defaultValue="Input with value" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <input className="input" type="text" defaultValue="supercalifragilisticexpialidociousverylongwordthatneverstopssupercalifragilisticexpialidociousverylongwordthatneverstops" />
            <input className="input" type="text" placeholder="🏸🏆👨‍👩‍👧‍👦 Unicode stress test" />
          </div>
        </section>

        <div className="divider" />

        {/* BADGES */}
        <section id="badges" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Badges</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Variants</h3>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            <Badge group="pro" />
            <Badge group="beg" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>In Context</h3>
          <div style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>John Doe</span>
            <Badge group="pro" />
            <span style={{ color: 'var(--muted)' }}>|</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Jane Smith</span>
            <Badge group="beg" />
          </div>
        </section>

        <div className="divider" />

        {/* CARDS */}
        <section id="cards" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Cards</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Default Card</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <Card>
              <p>This is a default card with some content inside.</p>
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Card with Title</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <Card>
              <CardTitle>Card Title</CardTitle>
              <p>This card has a title and body content.</p>
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Card with Gradient Top</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <Card className="card-gradient-top">
              <CardTitle>Featured Card</CardTitle>
              <p>This card has a gradient top strip.</p>
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Empty Card</h3>
          <div style={{ marginBottom: 'var(--s-6)' }}>
            <Card>
              <EmptyState icon="📭" text="No items found" />
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Card Content Stress Test</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--s-3)' }}>
            <Card>
              <CardTitle>supercalifragilisticexpialidocious</CardTitle>
              <p>supercalifragilisticexpialidociousverylongwordthatneverstopssupercalifragilisticexpialidociousverylongwordthatneverstops</p>
            </Card>
            <Card>
              <CardTitle>Short</CardTitle>
              <p>OK</p>
            </Card>
            <Card>
              <CardTitle>Unicode Test</CardTitle>
              <p>🏸🏆👨‍👩‍👧‍👦🎉🎊🎈🎁🎀🎂🎄🎃🎆🎇✨🎈🎉</p>
            </Card>
          </div>
        </section>

        <div className="divider" />

        {/* TABS */}
        <section id="tabs" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Tabs</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>2 Tabs</h3>
          <div className="tabs" style={{ marginBottom: 'var(--s-6)' }}>
            <button className="tab active">Active</button>
            <button className="tab">Inactive</button>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>3 Tabs</h3>
          <div className="tabs" style={{ marginBottom: 'var(--s-6)' }}>
            <button className="tab">Tab 1</button>
            <button className="tab active">Tab 2</button>
            <button className="tab">Tab 3</button>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>5 Tabs</h3>
          <div className="tabs" style={{ marginBottom: 'var(--s-6)' }}>
            <button className="tab">One</button>
            <button className="tab">Two</button>
            <button className="tab active">Three</button>
            <button className="tab">Four</button>
            <button className="tab">Five</button>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div className="tabs">
            <button className="tab active">supercalifragilisticexpialidocious</button>
            <button className="tab">OK</button>
            <button className="tab">🏸 Badge</button>
          </div>
        </section>

        <div className="divider" />

        {/* PILLS */}
        <section id="pills" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Pills</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Default Pills</h3>
          <div className="pills" style={{ marginBottom: 'var(--s-6)' }}>
            <button className="pill active">Active</button>
            <button className="pill">Inactive</button>
            <button className="pill">Another</button>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Many Pills</h3>
          <div className="pills" style={{ marginBottom: 'var(--s-6)' }}>
            <button className="pill">Option 1</button>
            <button className="pill active">Option 2</button>
            <button className="pill">Option 3</button>
            <button className="pill">Option 4</button>
            <button className="pill">Option 5</button>
            <button className="pill">Option 6</button>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div className="pills">
            <button className="pill active">supercalifragilisticexpialidocious</button>
            <button className="pill">OK</button>
            <button className="pill">🏸</button>
          </div>
        </section>

        <div className="divider" />

        {/* ALERTS */}
        <section id="alerts" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Alerts</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Variants</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <div className="alert alert-info">
              <span>ℹ️</span>
              <span>This is an informational alert.</span>
            </div>
            <div className="alert alert-success">
              <span>✅</span>
              <span>Success! Your action was completed.</span>
            </div>
            <div className="alert alert-warn">
              <span>⚠️</span>
              <span>Warning: Please review this information.</span>
            </div>
            <div className="alert alert-danger">
              <span>❌</span>
              <span>Error! Something went wrong.</span>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <div className="alert alert-info">
              <span>ℹ️</span>
              <span>supercalifragilisticexpialidociousverylongwordthatneverstopssupercalifragilisticexpialidociousverylongwordthatneverstops</span>
            </div>
            <div className="alert alert-success">
              <span>✅</span>
              <span>OK</span>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* EMPTY STATES */}
        <section id="empty-states" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Empty States</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Variants</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <Card>
              <EmptyState icon="📭" text="No messages" />
            </Card>
            <Card>
              <EmptyState icon="🏸" text="No matches scheduled" />
            </Card>
            <Card>
              <EmptyState icon="🏆" text="No tournaments yet" />
            </Card>
            <Card>
              <EmptyState icon="👥" text="No players found" />
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Content Stress Test</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--s-3)' }}>
            <Card>
              <EmptyState icon="📭" text="supercalifragilisticexpialidociousverylongwordthatneverstops" />
            </Card>
            <Card>
              <EmptyState icon="🏸🏆👨‍👩‍👧‍👦" text="OK" />
            </Card>
          </div>
        </section>

        <div className="divider" />

        {/* SKELETON LOADERS */}
        <section id="skeleton" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Skeleton Loaders</h2>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Variants</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <Skeleton width="100%" height="20px" variant="rounded" />
            <Skeleton width="80%" height="20px" variant="rounded" />
            <Skeleton width="60%" height="20px" variant="rounded" />
            <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
              <Skeleton width="50px" height="50px" variant="circular" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
                <Skeleton width="100%" height="16px" variant="rounded" />
                <Skeleton width="70%" height="12px" variant="rounded" />
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Skeleton Card</h3>
          <SkeletonCard>
            <Skeleton width="40%" height="16px" variant="rounded" style={{ marginBottom: 'var(--s-2)' }} />
            <Skeleton width="100%" height="20px" variant="rounded" style={{ marginBottom: 'var(--s-1)' }} />
            <Skeleton width="90%" height="20px" variant="rounded" style={{ marginBottom: 'var(--s-1)' }} />
            <Skeleton width="80%" height="20px" variant="rounded" />
          </SkeletonCard>
        </section>

        <div className="divider" />

        {/* CONFETTI */}
        <section id="confetti" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Confetti</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 'var(--s-3)' }}>
            Celebratory confetti animation triggered on special events (e.g., tournament winner).
          </p>
          <Btn variant="primary" onClick={triggerConfetti}>
            🎉 Trigger Confetti
          </Btn>
          <Confetti active={confettiActive} />
        </section>

        <div className="divider" />

        {/* CONTENT STRESS TESTS */}
        <section id="stress-tests" style={{ marginBottom: 'var(--s-8)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: 'var(--s-4)', color: 'var(--ink)' }}>Content Stress Tests</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 'var(--s-4)' }}>
            Test all components with edge cases to find layout bugs before production.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Player Grid - 100 Items</h3>
          <div className="player-grid" style={{ marginBottom: 'var(--s-6)' }}>
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} className="player-card">
                <div className="pc-body">
                  <div className={`pc-avatar ${i % 2 === 0 ? 'pro' : 'beg'}`}>
                    {String.fromCharCode(65 + (i % 26))}
                  </div>
                  <div className="pc-info">
                    <div className="name">Player {i + 1}</div>
                    <Badge group={i % 2 === 0 ? 'pro' : 'beg'} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Long Unbroken Text</h3>
          <Card style={{ marginBottom: 'var(--s-6)' }}>
            <CardTitle>Email Address Test</CardTitle>
            <p style={{ wordBreak: 'break-all' }}>
              supercalifragilisticexpialidocious@verylongdomainnamethatneverstopsandkeepsgoingforever.com
            </p>
          </Card>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Unicode / Emoji Stress</h3>
          <Card style={{ marginBottom: 'var(--s-6)' }}>
            <CardTitle>🏸 Unicode Test 🏆</CardTitle>
            <p>🏸🏆👨‍👩‍👧‍👦🎉🎊🎈🎁🎀🎂🎄🎃🎆🎇✨🎈🎉🏸🏆👨‍👩‍👧‍👦🎉🎊🎈🎁🎀🎂🎄🎃🎆🎇✨🎈🎉</p>
          </Card>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Large Numbers</h3>
          <Card style={{ marginBottom: 'var(--s-6)' }}>
            <CardTitle>Number Formatting</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
              <div>Score: 1,234,567,890</div>
              <div>Price: $9,999,999.99</div>
              <div>Count: 999999999999999</div>
            </div>
          </Card>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>Empty vs Single vs Many Items</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
            <Card>
              <CardTitle>Empty List (0)</CardTitle>
              <EmptyState icon="📭" text="No items" />
            </Card>
            <Card>
              <CardTitle>Single Item (1)</CardTitle>
              <div className="player-select-list">
                <div className="player-select-item">
                  <div className="checkbox" />
                  <div className="select-item-name">John Doe</div>
                </div>
              </div>
            </Card>
            <Card>
              <CardTitle>Many Items (10)</CardTitle>
              <div className="player-select-list">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="player-select-item">
                    <div className="checkbox" />
                    <div className="select-item-name">Player {i + 1}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--s-3)', color: 'var(--muted)' }}>TruncName Component</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <div style={{ maxWidth: '200px', padding: 'var(--s-2)', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)' }}>
              <TruncName name="supercalifragilisticexpialidociousverylongwordthatneverstops" />
            </div>
            <div style={{ maxWidth: '100px', padding: 'var(--s-2)', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)' }}>
              <TruncName name="John Doe" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div style={{ marginTop: 'var(--s-8)', padding: 'var(--s-4)', background: 'var(--card)', border: 'var(--border)', borderRadius: 'var(--r)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Court Design System — Badminton Tournament App
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted-2)', marginTop: 'var(--s-1)' }}>
            Development mode only
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ name, value, usage }: { name: string; value: string; usage: string }) {
  return (
    <div style={{ border: 'var(--border)', borderRadius: 'var(--r)', padding: 'var(--s-2)', background: 'var(--card)' }}>
      <div
        style={{
          background: value,
          height: '80px',
          borderRadius: 'var(--r-sm)',
          marginBottom: 'var(--s-1)',
          border: '1px solid var(--line)',
        }}
      />
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--ink)' }}>
        {name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 'var(--s-1)' }}>{usage}</div>
    </div>
  );
}

function SpacingBar({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
      <div style={{ width: '80px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--ink)' }}>
        {name}
      </div>
      <div style={{ width: '60px', fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      <div
        style={{
          height: '24px',
          width: value,
          background: 'linear-gradient(90deg, var(--volt), var(--ink))',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--line)',
        }}
      />
    </div>
  );
}
