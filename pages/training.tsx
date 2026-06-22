import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import type { TechniqueDoc } from '@/lib/models';

/* ════════════════════════════════════════════════════
   TYPES & CONSTANTS
════════════════════════════════════════════════════ */

interface Joint {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number; // For 3D depth
  locked?: boolean;
}

interface Pose {
  name: string;
  description: string;
  durationMs?: number;
  joints: Record<string, { x: number; y: number; z: number }>;
}

interface Technique {
  _id?: string;
  id: string;
  techniqueId?: string;
  name: string;
  category: 'offensive' | 'defensive' | 'serve' | 'footwork' | 'net_play' | 'specialty';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  keyPoints: string[];
  poses: Pose[];
  tags?: string[];
  viewCount?: number;
}

const TECHNIQUES: Technique[] = [
  {
    id: 'smash',
    name: 'Power Smash',
    category: 'offensive',
    difficulty: 'intermediate',
    description: 'An aggressive overhead shot to finish the point',
    keyPoints: [
      'Rotate shoulders 90° back during preparation',
      'Jump off dominant foot for maximum power',
      'Contact shuttle at highest point',
      'Snap wrist downward on contact',
      'Follow through across body',
    ],
    poses: [
      {
        name: 'Ready Position',
        description: 'Balanced stance, racket up',
        joints: {
          head: { x: 200, y: 80, z: 0 },
          neck: { x: 200, y: 110, z: 0 },
          torso: { x: 200, y: 200, z: 0 },
          hips: { x: 200, y: 290, z: 0 },
          leftShoulder: { x: 160, y: 130, z: -10 },
          leftElbow: { x: 140, y: 180, z: -5 },
          leftHand: { x: 130, y: 230, z: 0 },
          rightShoulder: { x: 240, y: 130, z: 10 },
          rightElbow: { x: 260, y: 170, z: 15 },
          rightHand: { x: 270, y: 120, z: 20 },
          racket: { x: 290, y: 80, z: 25 },
          leftHip: { x: 180, y: 290, z: -5 },
          leftKnee: { x: 175, y: 370, z: -8 },
          leftFoot: { x: 170, y: 450, z: -10 },
          rightHip: { x: 220, y: 290, z: 5 },
          rightKnee: { x: 225, y: 370, z: 8 },
          rightFoot: { x: 230, y: 450, z: 10 },
        },
      },
      {
        name: 'Wind-Up',
        description: 'Rotate back, racket behind head',
        joints: {
          head: { x: 200, y: 80, z: 0 },
          neck: { x: 200, y: 110, z: 0 },
          torso: { x: 200, y: 200, z: 0 },
          hips: { x: 200, y: 290, z: 0 },
          leftShoulder: { x: 160, y: 130, z: -10 },
          leftElbow: { x: 120, y: 170, z: -15 },
          leftHand: { x: 100, y: 220, z: -20 },
          rightShoulder: { x: 240, y: 130, z: 10 },
          rightElbow: { x: 280, y: 100, z: 30 },
          rightHand: { x: 220, y: 50, z: 40 },
          racket: { x: 200, y: 30, z: 50 },
          leftHip: { x: 180, y: 290, z: -5 },
          leftKnee: { x: 175, y: 360, z: -8 },
          leftFoot: { x: 170, y: 450, z: -10 },
          rightHip: { x: 220, y: 290, z: 5 },
          rightKnee: { x: 235, y: 355, z: 10 },
          rightFoot: { x: 250, y: 440, z: 15 },
        },
      },
      {
        name: 'Contact Point',
        description: 'Full extension, wrist snap',
        joints: {
          head: { x: 200, y: 70, z: 0 },
          neck: { x: 200, y: 100, z: 0 },
          torso: { x: 200, y: 190, z: 0 },
          hips: { x: 200, y: 280, z: 0 },
          leftShoulder: { x: 160, y: 120, z: -10 },
          leftElbow: { x: 130, y: 170, z: -15 },
          leftHand: { x: 110, y: 230, z: -20 },
          rightShoulder: { x: 240, y: 120, z: 10 },
          rightElbow: { x: 270, y: 80, z: 20 },
          rightHand: { x: 280, y: 40, z: 30 },
          racket: { x: 290, y: 10, z: 35 },
          leftHip: { x: 180, y: 280, z: -5 },
          leftKnee: { x: 170, y: 360, z: -10 },
          leftFoot: { x: 160, y: 450, z: -15 },
          rightHip: { x: 220, y: 280, z: 5 },
          rightKnee: { x: 240, y: 340, z: 15 },
          rightFoot: { x: 260, y: 420, z: 20 },
        },
      },
    ],
  },
  {
    id: 'drop-shot',
    name: 'Deceptive Drop Shot',
    category: 'offensive',
    difficulty: 'advanced',
    description: 'A soft shot that barely clears the net, disguised as a smash',
    keyPoints: [
      'Use identical wind-up as smash',
      'Slow down racket head at contact',
      'Use wrist to guide, not power',
      'Contact shuttle at front of racket',
      'Minimal follow-through',
    ],
    poses: [
      {
        name: 'Preparation',
        description: 'Looks identical to smash prep',
        joints: {
          head: { x: 200, y: 80, z: 0 },
          neck: { x: 200, y: 110, z: 0 },
          torso: { x: 200, y: 200, z: 0 },
          hips: { x: 200, y: 290, z: 0 },
          leftShoulder: { x: 160, y: 130, z: -10 },
          leftElbow: { x: 120, y: 170, z: -15 },
          leftHand: { x: 100, y: 220, z: -20 },
          rightShoulder: { x: 240, y: 130, z: 10 },
          rightElbow: { x: 280, y: 100, z: 30 },
          rightHand: { x: 220, y: 50, z: 40 },
          racket: { x: 200, y: 30, z: 50 },
          leftHip: { x: 180, y: 290, z: -5 },
          leftKnee: { x: 175, y: 360, z: -8 },
          leftFoot: { x: 170, y: 450, z: -10 },
          rightHip: { x: 220, y: 290, z: 5 },
          rightKnee: { x: 235, y: 355, z: 10 },
          rightFoot: { x: 250, y: 440, z: 15 },
        },
      },
      {
        name: 'Soft Contact',
        description: 'Gentle touch, racket slows down',
        joints: {
          head: { x: 200, y: 75, z: 0 },
          neck: { x: 200, y: 105, z: 0 },
          torso: { x: 200, y: 195, z: 0 },
          hips: { x: 200, y: 285, z: 0 },
          leftShoulder: { x: 160, y: 125, z: -10 },
          leftElbow: { x: 135, y: 175, z: -12 },
          leftHand: { x: 120, y: 225, z: -15 },
          rightShoulder: { x: 240, y: 125, z: 10 },
          rightElbow: { x: 265, y: 90, z: 18 },
          rightHand: { x: 275, y: 60, z: 22 },
          racket: { x: 285, y: 40, z: 25 },
          leftHip: { x: 180, y: 285, z: -5 },
          leftKnee: { x: 172, y: 365, z: -8 },
          leftFoot: { x: 165, y: 450, z: -12 },
          rightHip: { x: 220, y: 285, z: 5 },
          rightKnee: { x: 235, y: 350, z: 12 },
          rightFoot: { x: 250, y: 435, z: 18 },
        },
      },
    ],
  },
];

/* ════════════════════════════════════════════════════
   TRAINING PAGE COMPONENT
════════════════════════════════════════════════════ */

export default function TrainingPage() {
  const [techniques, setTechniques] = useState<Technique[]>(TECHNIQUES);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(TECHNIQUES[0]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [customJoints, setCustomJoints] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Fetch techniques from API on mount
  useEffect(() => {
    fetchTechniques();
  }, []);

  const fetchTechniques = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/techniques?published=true');
      if (res.ok) {
        const data = await res.json();
        if (data.techniques && data.techniques.length > 0) {
          // Transform API techniques to match local format
          const apiTechniques = data.techniques.map((t: TechniqueDoc) => ({
            _id: t._id?.toString(),
            id: t.techniqueId,
            techniqueId: t.techniqueId,
            name: t.name,
            category: t.category,
            difficulty: t.difficulty,
            description: t.description,
            keyPoints: t.keyPoints,
            poses: t.poses,
            tags: t.tags,
            viewCount: t.viewCount,
          }));
          setTechniques(apiTechniques);
          setSelectedTechnique(apiTechniques[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch techniques:', error);
      // Fallback to local techniques
    } finally {
      setLoading(false);
    }
  };

  const currentJoints = editMode && Object.keys(customJoints).length > 0
    ? customJoints
    : selectedTechnique?.poses[currentPoseIndex]?.joints || {};

  useEffect(() => {
    if (selectedTechnique && !editMode) {
      setCustomJoints(selectedTechnique.poses[0].joints);
    }
  }, [selectedTechnique, editMode]);

  useEffect(() => {
    drawCharacter();
  }, [currentJoints, selectedJoint]);

  const drawCharacter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw shadows (for 3D effect)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    Object.entries(currentJoints).forEach(([id, joint]) => {
      const shadowOffset = joint.z * 0.3;
      ctx.beginPath();
      ctx.arc(joint.x + shadowOffset, joint.y + 50 + shadowOffset * 0.5, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw bones (limbs)
    const bones = [
      ['head', 'neck'],
      ['neck', 'torso'],
      ['torso', 'hips'],
      ['neck', 'leftShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftHand'],
      ['neck', 'rightShoulder'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightHand'],
      ['rightHand', 'racket'],
      ['hips', 'leftHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftFoot'],
      ['hips', 'rightHip'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightFoot'],
    ];

    bones.forEach(([start, end]) => {
      const startJoint = currentJoints[start];
      const endJoint = currentJoints[end];
      if (!startJoint || !endJoint) return;

      const zAvg = (startJoint.z + endJoint.z) / 2;
      const depth = Math.max(0, Math.min(1, (zAvg + 30) / 60));
      const lineWidth = 3 + depth * 5;
      const alpha = 0.5 + depth * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = end === 'racket' ? '#7c3aed' : '#3b82f6';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startJoint.x, startJoint.y);
      ctx.lineTo(endJoint.x, endJoint.y);
      ctx.stroke();
      ctx.restore();
    });

    // Draw racket head
    const racketJoint = currentJoints['racket'];
    const handJoint = currentJoints['rightHand'];
    if (racketJoint && handJoint) {
      const angle = Math.atan2(racketJoint.y - handJoint.y, racketJoint.x - handJoint.x);
      ctx.save();
      ctx.translate(racketJoint.x, racketJoint.y);
      ctx.rotate(angle + Math.PI / 2);

      // Racket head (ellipse)
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Strings pattern
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 0.5;
      for (let i = -20; i <= 20; i += 5) {
        ctx.beginPath();
        ctx.moveTo(i, -25);
        ctx.lineTo(i, 25);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw joints (circles)
    Object.entries(currentJoints).forEach(([id, joint]) => {
      const isSelected = selectedJoint === id;
      const zDepth = (joint.z + 30) / 60;
      const radius = isSelected ? 10 : 6 + zDepth * 4;
      const alpha = 0.6 + zDepth * 0.4;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Joint circle
      ctx.fillStyle = isSelected ? '#f59e0b' : id === 'racket' ? '#7c3aed' : '#60a5fa';
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label for selected joint
      if (isSelected && editMode) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(id, joint.x, joint.y - 15);
      }

      ctx.restore();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked joint
    let clickedJoint: string | null = null;
    let minDist = Infinity;

    Object.entries(currentJoints).forEach(([id, joint]) => {
      const dist = Math.sqrt((joint.x - x) ** 2 + (joint.y - y) ** 2);
      if (dist < 15 && dist < minDist) {
        minDist = dist;
        clickedJoint = id;
      }
    });

    setSelectedJoint(clickedJoint);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !selectedJoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCustomJoints(prev => ({
      ...prev,
      [selectedJoint]: {
        ...prev[selectedJoint],
        x,
        y,
      },
    }));
  };

  const adjustJointDepth = (delta: number) => {
    if (!selectedJoint) return;

    setCustomJoints(prev => ({
      ...prev,
      [selectedJoint]: {
        ...prev[selectedJoint],
        z: Math.max(-30, Math.min(30, prev[selectedJoint].z + delta)),
      },
    }));
  };

  const playAnimation = () => {
    if (!selectedTechnique) return;

    setIsPlaying(true);
    let frame = 0;
    const totalPoses = selectedTechnique.poses.length;

    const animate = () => {
      frame++;
      const poseIndex = Math.floor(frame / 60) % totalPoses;
      setCurrentPoseIndex(poseIndex);

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetPose = () => {
    if (selectedTechnique) {
      setCustomJoints(selectedTechnique.poses[currentPoseIndex].joints);
    }
  };

  return (
    <>
      <Head>
        <title>3D Training Lab - SmashTour</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        padding: '20px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            🏸 3D Training Lab
          </h1>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,.7)',
            textAlign: 'center',
            marginBottom: 32,
          }}>
            Learn perfect technique with interactive 3D demonstrations
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr 320px',
            gap: 20,
          }}>
            {/* LEFT: Technique Library */}
            <div>
              <div style={{
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.1)',
                padding: 20,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                  📚 Techniques {loading && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Loading...</span>}
                </h2>

                {/* Category Filter */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {['all', 'offensive', 'defensive', 'serve', 'footwork', 'net_play'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        background: selectedCategory === cat ? '#7c3aed' : 'rgba(255,255,255,.1)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#fff',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                  {techniques
                    .filter(tech => selectedCategory === 'all' || tech.category === selectedCategory)
                    .map((tech) => (
                    <button
                      key={tech.id || tech.techniqueId}
                      onClick={() => {
                        setSelectedTechnique(tech);
                        setCurrentPoseIndex(0);
                        setEditMode(false);
                        stopAnimation();
                      }}
                      style={{
                        background: selectedTechnique?.id === tech.id || selectedTechnique?.techniqueId === tech.techniqueId
                          ? 'rgba(124,58,237,.3)'
                          : 'rgba(255,255,255,.05)',
                        border: selectedTechnique?.id === tech.id || selectedTechnique?.techniqueId === tech.techniqueId
                          ? '2px solid #7c3aed'
                          : '1px solid rgba(255,255,255,.1)',
                        borderRadius: 12,
                        padding: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {tech.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                        {tech.category.replace('_', ' ')} • {tech.difficulty}
                      </div>
                      {tech.viewCount !== undefined && (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                          👁 {tech.viewCount} views
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER: 3D Character Display */}
            <div>
              <div style={{
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.1)',
                padding: 20,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {selectedTechnique?.poses[currentPoseIndex]?.name || 'Select a Technique'}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      style={{
                        background: editMode ? '#f59e0b' : 'rgba(255,255,255,.1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {editMode ? '✏️ Editing' : '👁️ View'}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 16 }}>
                  {selectedTechnique?.poses[currentPoseIndex]?.description}
                </p>

                {/* Canvas */}
                <div style={{ position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={500}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={() => setSelectedJoint(null)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(180deg, rgba(59,130,246,.1) 0%, rgba(124,58,237,.1) 100%)',
                      borderRadius: 12,
                      cursor: editMode ? 'crosshair' : 'default',
                    }}
                  />

                  {editMode && selectedJoint && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,.8)',
                      borderRadius: 8,
                      padding: 12,
                    }}>
                      <div style={{ fontSize: 11, color: '#fff', marginBottom: 8 }}>
                        Adjust Depth (Z)
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => adjustJointDepth(-5)}
                          style={{
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => adjustJointDepth(5)}
                          style={{
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Forward →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Animation Controls */}
                <div style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 16,
                  flexWrap: 'wrap',
                }}>
                  {!editMode && (
                    <>
                      {selectedTechnique && selectedTechnique.poses.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPoseIndex(idx)}
                          style={{
                            background: currentPoseIndex === idx
                              ? '#7c3aed'
                              : 'rgba(255,255,255,.1)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Pose {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={isPlaying ? stopAnimation : playAnimation}
                        style={{
                          background: isPlaying ? '#ef4444' : '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '10px 20px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isPlaying ? '⏸️ Stop' : '▶️ Play'}
                      </button>
                    </>
                  )}
                  {editMode && (
                    <button
                      onClick={resetPose}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 20px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🔄 Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Instructions & Key Points */}
            <div>
              <div style={{
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.1)',
                padding: 20,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                  💡 Key Points
                </h2>

                {selectedTechnique ? (
                  <>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 16, lineHeight: 1.6 }}>
                      {selectedTechnique.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedTechnique.keyPoints.map((point, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255,255,255,.05)',
                            borderLeft: '3px solid #7c3aed',
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', lineHeight: 1.5 }}>
                            {idx + 1}. {point}
                          </div>
                        </div>
                      ))}
                    </div>

                    {editMode && (
                      <div style={{
                        marginTop: 20,
                        padding: 16,
                        background: 'rgba(245,158,11,.2)',
                        borderRadius: 12,
                        border: '1px solid rgba(245,158,11,.4)',
                      }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 12 }}>
                          ✏️ Edit Mode Active
                        </h3>
                        <ul style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', lineHeight: 1.6, paddingLeft: 20 }}>
                          <li>Click a joint to select it</li>
                          <li>Drag to move in X/Y plane</li>
                          <li>Use depth buttons for Z-axis</li>
                          <li>Create your own technique!</li>
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textAlign: 'center', padding: 40 }}>
                    Select a technique to see details
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
