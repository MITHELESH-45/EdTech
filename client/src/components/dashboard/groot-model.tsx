import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function GrootModel() {
  const { scene } = useGLTF("/groot.glb");

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    return c;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      scale={2.8}
position={[0, -1.6, 0]}

      rotation={[0, Math.PI / 6, 0]}
    />
  );
}

useGLTF.preload("/groot.glb");

export function GrootModelViewer() {
  return (
    <div className="h-screen w-full">
      <Canvas
        camera={{ position: [0, 1.8, 7], fov: 45 }}

        gl={{ physicallyCorrectLights: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />

        <Suspense fallback={null}>
          <GrootModel />
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
