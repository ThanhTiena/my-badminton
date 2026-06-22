import { useEffect, useRef, useState } from 'react';

interface Joint3D {
  x: number;
  y: number;
  z: number;
}

type PlayerPosition = 'team1_left' | 'team1_right' | 'team2_left' | 'team2_right';

interface PlayerCharacter {
  position: PlayerPosition;
  name: string;
  joints: Record<string, Joint3D>;
  color: number; // Three.js color hex
}

interface ShuttlecockState {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

interface MatchRendererProps {
  players: PlayerCharacter[];
  shuttlecock?: ShuttlecockState;
  width?: number;
  height?: number;
}

export default function MatchRenderer({
  players,
  shuttlecock,
  width = 800,
  height = 600,
}: MatchRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const courtGroupRef = useRef<any>(null);
  const playersGroupRef = useRef<any>(null);
  const shuttlecockRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  // Load Three.js from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).THREE) {
      setThreeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.async = true;
    script.onload = () => setThreeLoaded(true);
    script.onerror = () => setError('Failed to load Three.js');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!threeLoaded || !containerRef.current) return;

    const THREE = (window as any).THREE;
    if (!THREE) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      sceneRef.current = scene;

      // Create camera - overhead view
      const camera = new THREE.PerspectiveCamera(
        60,
        width / height,
        0.1,
        1000
      );
      camera.position.set(0, 15, 0); // High overhead view
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 10);
      scene.add(directionalLight);

      // Add badminton court
      const courtGroup = new THREE.Group();

      // Court floor (green surface)
      const courtGeometry = new THREE.PlaneGeometry(6.1, 13.4);
      const courtMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d6b3f,
        side: THREE.DoubleSide,
      });
      const courtFloor = new THREE.Mesh(courtGeometry, courtMaterial);
      courtFloor.rotation.x = -Math.PI / 2;
      courtFloor.position.y = -5;
      courtGroup.add(courtFloor);

      // White court lines
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

      // Outer boundary
      const outerBoundary = new THREE.EdgesGeometry(courtGeometry);
      const outerLines = new THREE.LineSegments(
        outerBoundary,
        new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
      );
      outerLines.rotation.x = -Math.PI / 2;
      outerLines.position.y = -4.99;
      courtGroup.add(outerLines);

      // Center line
      const centerLineGeometry = new THREE.PlaneGeometry(0.05, 13.4);
      const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.y = -4.98;
      courtGroup.add(centerLine);

      // Service lines
      const serviceLineGeometry = new THREE.PlaneGeometry(6.1, 0.05);
      const serviceLine1 = new THREE.Mesh(serviceLineGeometry, lineMaterial);
      serviceLine1.rotation.x = -Math.PI / 2;
      serviceLine1.position.set(0, -4.98, -1.98);
      courtGroup.add(serviceLine1);

      const serviceLine2 = new THREE.Mesh(serviceLineGeometry, lineMaterial);
      serviceLine2.rotation.x = -Math.PI / 2;
      serviceLine2.position.set(0, -4.98, 1.98);
      courtGroup.add(serviceLine2);

      // Net
      const netGeometry = new THREE.PlaneGeometry(6.1, 1.55);
      const netMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const net = new THREE.Mesh(netGeometry, netMaterial);
      net.position.set(0, -4.23, 0);
      courtGroup.add(net);

      scene.add(courtGroup);
      courtGroupRef.current = courtGroup;

      // Create players group
      const playersGroup = new THREE.Group();
      scene.add(playersGroup);
      playersGroupRef.current = playersGroup;

      // Create shuttlecock
      const shuttlecockGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const shuttlecockMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffff00,
        emissiveIntensity: 0.3,
      });
      const shuttlecockMesh = new THREE.Mesh(shuttlecockGeometry, shuttlecockMaterial);
      shuttlecockMesh.visible = false;
      scene.add(shuttlecockMesh);
      shuttlecockRef.current = shuttlecockMesh;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        renderer.render(scene, camera);
      };
      animate();

      // Load OrbitControls
      const controlsScript = document.createElement('script');
      controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js';
      controlsScript.async = true;
      controlsScript.onload = () => {
        if ((window as any).THREE?.OrbitControls) {
          const OrbitControls = (window as any).THREE.OrbitControls;
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controlsRef.current = controls;
        }
      };
      document.head.appendChild(controlsScript);

      // Cleanup
      return () => {
        if (containerRef.current && renderer.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        if (document.head.contains(controlsScript)) {
          document.head.removeChild(controlsScript);
        }
      };
    } catch (err) {
      setError('Failed to initialize 3D renderer: ' + (err as Error).message);
    }
  }, [threeLoaded, width, height]);

  // Update players when data changes
  useEffect(() => {
    if (!threeLoaded || !playersGroupRef.current) return;

    const THREE = (window as any).THREE;
    if (!THREE) return;

    // Clear existing players
    while (playersGroupRef.current.children.length > 0) {
      playersGroupRef.current.remove(playersGroupRef.current.children[0]);
    }

    // Position mapping for doubles court positions
    const positionOffsets: Record<PlayerPosition, { x: number; z: number }> = {
      team1_left:  { x: -2, z: -5 },  // Team 1 back left
      team1_right: { x:  2, z: -5 },  // Team 1 back right
      team2_left:  { x: -2, z:  5 },  // Team 2 back left
      team2_right: { x:  2, z:  5 },  // Team 2 back right
    };

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

    // Convert 2D canvas coordinates to 3D space with player offset
    const canvasTo3D = (canvasX: number, canvasY: number, canvasZ: number, offsetX: number, offsetZ: number) => {
      const x = (canvasX - 300) / 50 + offsetX;
      const y = -(canvasY - 250) / 50;
      const z = canvasZ / 50 + offsetZ;
      return { x, y, z };
    };

    // Render each player
    players.forEach(player => {
      const offset = positionOffsets[player.position];
      const playerGroup = new THREE.Group();

      // Draw bones
      bones.forEach(([startId, endId]) => {
        const startJoint = player.joints[startId];
        const endJoint = player.joints[endId];
        if (!startJoint || !endJoint) return;

        const start3D = canvasTo3D(startJoint.x, startJoint.y, startJoint.z, offset.x, offset.z);
        const end3D = canvasTo3D(endJoint.x, endJoint.y, endJoint.z, offset.x, offset.z);

        const direction = new THREE.Vector3(
          end3D.x - start3D.x,
          end3D.y - start3D.y,
          end3D.z - start3D.z
        );
        const length = direction.length();
        const midpoint = new THREE.Vector3(
          (start3D.x + end3D.x) / 2,
          (start3D.y + end3D.y) / 2,
          (start3D.z + end3D.z) / 2
        );

        const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        const material = new THREE.MeshPhongMaterial({ color: player.color });
        const cylinder = new THREE.Mesh(geometry, material);

        cylinder.position.copy(midpoint);
        cylinder.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.normalize()
        );

        playerGroup.add(cylinder);
      });

      // Draw joints
      Object.entries(player.joints).forEach(([id, joint]) => {
        const pos3D = canvasTo3D(joint.x, joint.y, joint.z, offset.x, offset.z);

        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color: player.color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pos3D.x, pos3D.y, pos3D.z);

        playerGroup.add(sphere);
      });

      playersGroupRef.current.add(playerGroup);
    });

  }, [players, threeLoaded]);

  // Update shuttlecock position
  useEffect(() => {
    if (!threeLoaded || !shuttlecockRef.current || !shuttlecock) return;

    shuttlecockRef.current.visible = shuttlecock.visible;
    shuttlecockRef.current.position.set(
      shuttlecock.x,
      shuttlecock.y,
      shuttlecock.z
    );
  }, [shuttlecock, threeLoaded]);

  if (error) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(59,130,246,.1) 0%, rgba(124,58,237,.1) 100%)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!threeLoaded) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(59,130,246,.1) 0%, rgba(124,58,237,.1) 100%)',
        borderRadius: 12,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>
            Loading Match Renderer...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'grab',
      }}
    />
  );
}
