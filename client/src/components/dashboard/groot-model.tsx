import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface GrootModelProps {
  scrollProgress: number;
  onClick?: () => void;
}

function GrootModel({ scrollProgress, onClick }: GrootModelProps) {
  const { scene } = useGLTF("/groot.glb");
  const groupRef = useRef<THREE.Group>(null);
  const eyeMeshesRef = useRef<THREE.Mesh[]>([]);
  const lastScrollProgressRef = useRef(0);
  const isScrollingRef = useRef(false);
  const blinkStateRef = useRef({ isBlinking: false, blinkProgress: 0 });

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    eyeMeshesRef.current = [];
    
    c.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        
        // Find eye meshes - try multiple naming patterns
        const name = obj.name.toLowerCase();
        const materialName = obj.material?.name?.toLowerCase() || "";
        
        // Check if it's an eye by name or material
        if (name.includes("eye") || 
            name.includes("pupil") || 
            name.includes("iris") ||
            name.includes("eyeball") ||
            materialName.includes("eye") ||
            materialName.includes("pupil")) {
          eyeMeshesRef.current.push(obj);
          // Store original scale
          if (!obj.userData.originalScale) {
            obj.userData.originalScale = obj.scale.clone();
          }
        }
      }
    });
    
    // If no eyes found by name, try to find by position (eyes are usually in upper part of head)
    if (eyeMeshesRef.current.length === 0) {
      const allMeshes: THREE.Mesh[] = [];
      c.traverse((obj: any) => {
        if (obj.isMesh) {
          allMeshes.push(obj);
        }
      });
      
      // Find meshes in upper region (potential eyes)
      const upperMeshes = allMeshes.filter(mesh => {
        const pos = mesh.position;
        return pos.y > 0.5 && Math.abs(pos.x) < 0.3 && pos.z > 0;
      });
      
      // Take first 2-4 small meshes as potential eyes
      if (upperMeshes.length > 0) {
        eyeMeshesRef.current = upperMeshes.slice(0, 4);
        upperMeshes.forEach(mesh => {
          if (!mesh.userData.originalScale) {
            mesh.userData.originalScale = mesh.scale.clone();
          }
        });
      }
    }
    
    return c;
  }, [scene]);

  // Detect scrolling - trigger blink on any scroll change
  useEffect(() => {
    const scrollDelta = Math.abs(scrollProgress - lastScrollProgressRef.current);
    
    if (scrollDelta > 0.0001) { // Very small threshold to detect any scroll
      isScrollingRef.current = true;
      
      // Trigger blink when scrolling starts (only if not already blinking)
      if (!blinkStateRef.current.isBlinking) {
        blinkStateRef.current.isBlinking = true;
        blinkStateRef.current.blinkProgress = 0;
      }
      
      lastScrollProgressRef.current = scrollProgress;
      
      // Reset scrolling state after a delay
      const timeout = setTimeout(() => {
        isScrollingRef.current = false;
      }, 200);
      
      return () => clearTimeout(timeout);
    }
  }, [scrollProgress]);

  // Animate blinking
  useFrame((state, delta) => {
    if (eyeMeshesRef.current.length === 0) return;

    const blinkState = blinkStateRef.current;
    
    if (blinkState.isBlinking) {
      blinkState.blinkProgress += delta * 10; // Blink speed
      
      if (blinkState.blinkProgress >= 1) {
        blinkState.isBlinking = false;
        blinkState.blinkProgress = 0;
      }
      
      // Blink animation: close eyes (scale Y down) then open
      let eyeScaleY = 1;
      if (blinkState.blinkProgress < 0.2) {
        // Closing (0 to 0.2) - fast close
        eyeScaleY = 1 - (blinkState.blinkProgress / 0.2) * 0.95; // Scale down to 0.05
      } else if (blinkState.blinkProgress < 0.6) {
        // Closed (0.2 to 0.6)
        eyeScaleY = 0.05;
      } else {
        // Opening (0.6 to 1.0) - fast open
        eyeScaleY = 0.05 + ((blinkState.blinkProgress - 0.6) / 0.4) * 0.95; // Scale back up
      }
      
      // Apply scale to eyes - preserve original scale X and Z
      eyeMeshesRef.current.forEach((eye) => {
        if (eye.scale && eye.userData.originalScale) {
          eye.scale.y = eye.userData.originalScale.y * eyeScaleY;
        }
      });
    } else {
      // Reset eyes to normal when not blinking
      eyeMeshesRef.current.forEach((eye) => {
        if (eye.scale && eye.userData.originalScale) {
          eye.scale.y = THREE.MathUtils.lerp(eye.scale.y, eye.userData.originalScale.y, 0.15);
        }
      });
    }
  });

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive
        object={cloned}
        scale={2.8}
        position={[0, -1.6, 0]}
        rotation={[0, -1, 0]}
      />
    </group>
  );
}

useGLTF.preload("/groot.glb");

interface GrootModelViewerProps {
  scrollProgress: number;
}

export function GrootModelViewer({ scrollProgress }: GrootModelViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Initialize audio element once
    if (!audioRef.current) {
      audioRef.current = new Audio("/grootvoice.mp3");
    }
  }, []);

  const handleGrootClick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // Ignore play errors (e.g., autoplay restrictions)
    }
  };

  return (
    <div className="h-screen w-full">
      <Canvas
        camera={{ position: [0, 1.8, 6], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.6} />
        <pointLight position={[0, 5, 5]} intensity={0.8} />

        <Suspense fallback={null}>
          <GrootModel scrollProgress={scrollProgress} onClick={handleGrootClick} />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
