/**
 * Court Design System — Component Demo
 *
 * This file demonstrates how to use the Court primitive components.
 * It showcases all variants, sizes, and props for each component.
 *
 * Usage:
 * 1. Import components: import { Button, Badge, PlayerTile, StatCard } from '@/components';
 * 2. Use them in your React components
 * 3. Customize with props
 *
 * Migration from old components:
 * - Old: <Btn variant="primary" full>Click me</Btn>
 * - New: <Button variant="primary" full>Click me</Button>
 */

import React from 'react';
import { Button, Badge, PlayerTile, StatCard } from './index';

export function CourtComponentsDemo() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Archivo', fontSize: 48, fontWeight: 800, marginBottom: 40 }}>
        Court Design System Components
      </h1>

      {/* Button Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Button Component
        </h2>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Variants</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary">Primary (Ink)</Button>
            <Button variant="volt">Volt (Hero)</Button>
            <Button variant="ghost">Ghost (Outline)</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Sizes</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>States</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
            <Button full>Full Width</Button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Interactive Example</h3>
          <Button variant="volt" size="lg" onClick={() => alert('Volt button clicked!')}>
            Start Tournament
          </Button>
        </div>
      </section>

      {/* Badge Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Badge Component
        </h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Badge group="pro" />
          <Badge group="beg" />
        </div>

        <p style={{ marginTop: 12, color: '#74715F' }}>
          PRO: ink fill with volt text | BEG: ink outline
        </p>
      </section>

      {/* PlayerTile Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          PlayerTile Component
        </h2>

        <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
          <PlayerTile
            name="Alex Nguyen"
            group="pro"
            record="18W · 7L · 3 titles"
            onClick={() => console.log('Alex clicked')}
          />

          <PlayerTile
            name="Sarah Chen"
            group="beg"
            record="5W · 12L"
            onClick={() => console.log('Sarah clicked')}
          />

          <PlayerTile
            name="Michael Kim"
            group="pro"
          />
        </div>

        <p style={{ marginTop: 12, color: '#74715F' }}>
          Hover over tiles to see the border highlight effect (when onClick is provided)
        </p>
      </section>

      {/* StatCard Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          StatCard Component
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <StatCard
            label="Total Revenue"
            value="$48,240"
            sub="Up 12% from last month"
            dark
          />

          <StatCard
            label="Active Players"
            value={127}
          />

          <StatCard
            label="Win Rate"
            value="68.3%"
            sub="Pro division"
          />

          <StatCard
            label="Tournaments"
            value={42}
            sub="This season"
          />
        </div>

        <p style={{ marginTop: 12, color: '#74715F' }}>
          Use dark=true for the primary headline metric on a screen
        </p>
      </section>

      {/* Migration Guide */}
      <section style={{ marginBottom: 60, padding: 24, background: '#F3F1EA', borderRadius: 4 }}>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Migration Guide
        </h2>

        <div style={{ fontFamily: 'Space Mono', fontSize: 13 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#74715F', marginBottom: 4 }}>OLD (Class-based):</div>
            <code style={{ background: '#fff', padding: '8px 12px', display: 'block', borderRadius: 2 }}>
              {`<button className="btn btn-primary btn-lg btn-full">Click</button>`}
            </code>
          </div>

          <div>
            <div style={{ color: '#74715F', marginBottom: 4 }}>NEW (Court Components):</div>
            <code style={{ background: '#fff', padding: '8px 12px', display: 'block', borderRadius: 2 }}>
              {`<Button variant="primary" size="lg" full>Click</Button>`}
            </code>
          </div>
        </div>
      </section>

      {/* Design Tokens Reference */}
      <section>
        <h2 style={{ fontFamily: 'Archivo', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Court Design Tokens
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { name: '--ink', color: '#16170F', text: '#fff' },
            { name: '--volt', color: '#CBF14A', text: '#16170F' },
            { name: '--paper', color: '#F3F1EA', text: '#16170F' },
            { name: '--card', color: '#FFFFFF', text: '#16170F' },
            { name: '--muted', color: '#74715F', text: '#fff' },
            { name: '--win', color: '#2D7A4D', text: '#fff' },
            { name: '--loss', color: '#C24226', text: '#fff' },
          ].map(token => (
            <div
              key={token.name}
              style={{
                background: token.color,
                color: token.text,
                padding: 16,
                borderRadius: 4,
                textAlign: 'center',
                fontFamily: 'Space Mono',
                fontSize: 11,
              }}
            >
              <div style={{ fontWeight: 700 }}>{token.name}</div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>{token.color}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CourtComponentsDemo;
