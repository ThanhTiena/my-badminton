import { useEffect, useRef, useState } from 'react';

interface Joint3D {
  x: number;
  y: number;
  z: number;
}

interface ThreeRendererProps {
  joints: Record<string, Joint3D>;
  editMode?: boolean;
  selectedJoint?: string | null;
  onJointSelect?: (jointId: string | null) => void;
  onJointMove?: (jointId: string, position: Joint3D) => void;
  width?: number;
  height?: number;
}

export default function ThreeRenderer({
  joints,
  editMode = false,
  selectedJoint = null,
  onJointSelect,
  onJointMove,
  width = 800,
  height = 600,
}: ThreeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const jointsGroupRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  // Load Three.js from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if ((window as any).THREE) {
      setThreeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.async = true;
    script.onload = () => {
      setThreeLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Three.js. Please check your internet connection.');
    };
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

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      );
      camera.position.set(0, 0, 10);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // Add grid helper
      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);

      // Create joints group
      const jointsGroup = new THREE.Group();
      scene.add(jointsGroup);
      jointsGroupRef.current = jointsGroup;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        renderer.render(scene, camera);
      };
      animate();

      // Load OrbitControls (optional, for camera control)
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

  // Update joints when data changes
  useEffect(() => {
    if (!threeLoaded || !jointsGroupRef.current) return;

    const THREE = (window as any).THREE;
    if (!THREE) return;

    // Clear existing joints
    while (jointsGroupRef.current.children.length > 0) {
      jointsGroupRef.current.remove(jointsGroupRef.current.children[0]);
    }

    // Bone connections (same as Canvas version)
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

    // Convert 2D canvas coordinates to 3D space
    const canvasTo3D = (canvasX: number, canvasY: number, canvasZ: number) => {
      // Canvas: (0,0) top-left, (600,500) bottom-right
      // 3D: center at (0,0,0), scale appropriately
      const x = (canvasX - 300) / 50;  // Center X
      const y = -(canvasY - 250) / 50; // Invert Y (canvas Y goes down, 3D Y goes up)
      const z = canvasZ / 50;          // Scale Z
      return { x, y, z };
    };

    // Draw bones (cylinders)
    bones.forEach(([startId, endId]) => {
      const startJoint = joints[startId];
      const endJoint = joints[endId];
      if (!startJoint || !endJoint) return;

      const start3D = canvasTo3D(startJoint.x, startJoint.y, startJoint.z);
      const end3D = canvasTo3D(endJoint.x, endJoint.y, endJoint.z);

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
      const material = new THREE.MeshPhongMaterial({
        color: endId === 'racket' ? 0x7c3aed : 0x3b82f6,
      });
      const cylinder = new THREE.Mesh(geometry, material);

      // Position and rotate cylinder
      cylinder.position.copy(midpoint);
      cylinder.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );

      jointsGroupRef.current.add(cylinder);
    });

    // Draw joints (spheres)
    Object.entries(joints).forEach(([id, joint]) => {
      const pos3D = canvasTo3D(joint.x, joint.y, joint.z);

      const geometry = new THREE.SphereGeometry(
        id === selectedJoint ? 0.15 : 0.1,
        16,
        16
      );
      const material = new THREE.MeshPhongMaterial({
        color: id === selectedJoint
          ? 0xf59e0b
          : id === 'racket'
          ? 0x7c3aed
          : 0x60a5fa,
        emissive: id === selectedJoint ? 0xf59e0b : 0x000000,
        emissiveIntensity: id === selectedJoint ? 0.3 : 0,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pos3D.x, pos3D.y, pos3D.z);
      sphere.userData = { jointId: id };

      jointsGroupRef.current.add(sphere);
    });

    // Draw racket head (torus)
    const racketJoint = joints['racket'];
    const handJoint = joints['rightHand'];
    if (racketJoint && handJoint) {
      const racket3D = canvasTo3D(racketJoint.x, racketJoint.y, racketJoint.z);

      const geometry = new THREE.TorusGeometry(0.3, 0.02, 8, 16);
      const material = new THREE.MeshPhongMaterial({ color: 0x7c3aed });
      const racketHead = new THREE.Mesh(geometry, material);
      racketHead.position.set(racket3D.x, racket3D.y, racket3D.z);

      jointsGroupRef.current.add(racketHead);
    }

  }, [joints, selectedJoint, threeLoaded]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(59,130,246,.1) 0%, rgba(124,58,237,.1) 100%)',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!threeLoaded) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(59,130,246,.1) 0%, rgba(124,58,237,.1) 100%)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>
            Loading 3D Renderer...
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
        cursor: editMode ? 'crosshair' : 'grab',
      }}
    />
  );
}
