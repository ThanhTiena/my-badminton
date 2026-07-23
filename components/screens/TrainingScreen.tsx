import React from 'react';
import { Btn, Card, CardTitle } from '@/components/ui';

interface TrainingScreenProps {
  onBack: () => void;
}

export const TrainingScreen: React.FC<TrainingScreenProps> = ({ onBack }) => {
  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        ← Back
      </button>
      <p className="page-title">🏸 3D Training Lab</p>
      <p className="page-sub">Learn professional techniques with interactive 3D demonstrations</p>
      <Card style={{ marginTop: 20 }}>
        <CardTitle>Opening Training Lab...</CardTitle>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          The 3D Training Lab is loading in a new window with full-screen interactive experience.
        </p>
        <Btn
          variant="primary"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open('/training', '_blank');
            }
          }}
        >
          🚀 Open Training Lab
        </Btn>
      </Card>
    </div>
  );
};

export default TrainingScreen;
