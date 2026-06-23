/**
 * Court Design System Demo Page
 * Route: /court-demo
 *
 * View this page to see all Court primitive components in action.
 */

import React from 'react';
import { Button, Badge, PlayerTile, StatCard } from '@/components';

export default function CourtDemoPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', background: 'var(--paper)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, marginBottom: 40, color: 'var(--ink)' }}>
        Court Design System
      </h1>

      {/* Button Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
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

        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>States</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button full>Full Width Button</Button>
          </div>
        </div>
      </section>

      {/* Badge Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Badge Component
        </h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Badge group="pro" />
          <Badge group="beg" />
        </div>
      </section>

      {/* PlayerTile Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          PlayerTile Component
        </h2>

        <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
          <PlayerTile
            name="Alex Nguyen"
            group="pro"
            record="18W · 7L · 3 titles"
            onClick={() => alert('Alex clicked')}
          />

          <PlayerTile
            name="Sarah Chen"
            group="beg"
            record="5W · 12L"
            onClick={() => alert('Sarah clicked')}
          />

          <PlayerTile
            name="Michael Kim"
            group="pro"
          />
        </div>
      </section>

      {/* StatCard Examples */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
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
      </section>
    </div>
  );
}
