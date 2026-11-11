"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const URL = process.env.NEXT_PUBLIC_AVATAR_URL ?? "/avatar.glb";
const MOUTH = ["viseme_aa", "mouthOpen", "jawOpen"];

function Model({ volume }: { volume: number }) {
  const { scene } = useGLTF(URL);
  const meshes = useMemo(() => {
    const m: THREE.Mesh[] = [];
    scene.traverse((o) => { const x = o as THREE.Mesh; if (x.morphTargetDictionary) m.push(x); });
    return m;
  }, [scene]);
  const blink = useRef(0);
  useFrame((_, dt) => {
    blink.current = (blink.current + dt) % 4;
    const eye = blink.current > 3.85 ? 1 : 0;
    for (const m of meshes) {
      const d = m.morphTargetDictionary!, inf = m.morphTargetInfluences!;
      for (const k of MOUTH) if (d[k] !== undefined) inf[d[k]] = THREE.MathUtils.lerp(inf[d[k]], Math.min(volume * 2.5, 1), 0.4);
      for (const k of ["eyeBlinkLeft", "eyeBlinkRight", "eyesClosed"]) if (d[k] !== undefined) inf[d[k]] = eye;
    }
  });
  return <primitive object={scene} position={[0, -1.6, 0]} />;
}

export default function Avatar({ volume }: { volume: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 1.1], fov: 30 }} className="!h-[60vh] !w-full max-w-xl">
      <ambientLight intensity={0.6} />
      <Environment preset="apartment" />
      <Model volume={volume} />
    </Canvas>
  );
}
