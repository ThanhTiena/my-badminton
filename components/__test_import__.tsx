/**
 * Test file to verify component imports work correctly.
 * This file should compile without errors.
 * Delete after verification if needed.
 */

import React from 'react';

// Test barrel export
import { Button, Badge, PlayerTile, StatCard } from './index';

// Test type exports
import type { ButtonProps, BadgeProps, PlayerTileProps, StatCardProps } from './index';

// Test individual imports
import { Button as ButtonDirect } from './Button';
import { Badge as BadgeDirect } from './Badge';
import { PlayerTile as PlayerTileDirect } from './PlayerTile';
import { StatCard as StatCardDirect } from './StatCard';

export function ComponentImportTest() {
  const buttonProps: ButtonProps = {
    variant: 'primary',
    size: 'md',
    full: true,
  };

  const badgeProps: BadgeProps = {
    group: 'pro',
  };

  const playerProps: PlayerTileProps = {
    name: 'Test Player',
    group: 'pro',
    record: '10W · 5L',
  };

  const statProps: StatCardProps = {
    label: 'Test Stat',
    value: 100,
    dark: true,
  };

  return (
    <div>
      <h1>Component Import Test</h1>

      <section>
        <h2>Barrel Exports</h2>
        <Button {...buttonProps}>Barrel Button</Button>
        <Badge {...badgeProps} />
        <PlayerTile {...playerProps} />
        <StatCard {...statProps} />
      </section>

      <section>
        <h2>Direct Imports</h2>
        <ButtonDirect variant="volt">Direct Button</ButtonDirect>
        <BadgeDirect group="beg" />
        <PlayerTileDirect name="Direct Import" group="beg" />
        <StatCardDirect label="Direct" value={42} />
      </section>

      <section>
        <h2>All Button Variants</h2>
        <Button variant="primary">Primary</Button>
        <Button variant="volt">Volt</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </section>

      <section>
        <h2>All Button Sizes</h2>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </section>

      <section>
        <h2>Button States</h2>
        <Button disabled>Disabled</Button>
        <Button full>Full Width</Button>
      </section>

      <section>
        <h2>Both Badge Groups</h2>
        <Badge group="pro" />
        <Badge group="beg" />
      </section>

      <section>
        <h2>PlayerTile Variations</h2>
        <PlayerTile name="Pro Player" group="pro" record="20W · 5L" />
        <PlayerTile name="Beginner Player" group="beg" />
        <PlayerTile
          name="Clickable Player"
          group="pro"
          onClick={() => console.log('clicked')}
        />
      </section>

      <section>
        <h2>StatCard Variations</h2>
        <StatCard label="Simple" value={42} />
        <StatCard label="With Subtitle" value="$1,234" sub="Monthly revenue" />
        <StatCard label="Dark Variant" value={99} dark />
        <StatCard label="Complex Value" value={<span>Custom JSX</span>} />
      </section>
    </div>
  );
}

export default ComponentImportTest;
