"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { Item } from "./lib";

// [width, height, depth, color, lift off floor]
export const K: Record<string, [number, number, number, string, number]> = {
  bed: [1.6, 0.5, 2, "#e8e2d6", 0], wardrobe: [1.2, 2, 0.6, "#8a6a4a", 0], desk: [1.2, 0.75, 0.6, "#a07850", 0],
  chair: [0.5, 0.9, 0.5, "#4a4a4a", 0], tv: [1.2, 0.7, 0.08, "#111111", 1.1], sofa: [1.8, 0.8, 0.8, "#1f3b2d", 0],
  lamp: [0.3, 1.5, 0.3, "#f0c070", 0], plant: [0.4, 1, 0.4, "#3f7d4a", 0], fridge: [0.6, 1.6, 0.6, "#dddddd", 0],
  bathtub: [1.6, 0.6, 0.8, "#f5f5f5", 0], ac: [0.9, 0.3, 0.25, "#f0f0f0", 2.1],
};

export function layout(items: Item[], L: number) {
  const out: { kind: string; pos: [number, number, number]; rot: number }[] = [];
  let x = -L / 2 + 0.2, wall = 0;
  for (const it of items) for (let i = 0; i < it.count; i++) {
    const [w, h, d, , lift] = K[it.kind] ?? [0.5, 0.5, 0.5, "#999", 0];
    if (x + w > L / 2 - 0.2) { wall++; x = -L / 2 + 0.2; }
    const c = x + w / 2, y = lift + h / 2, e = L / 2 - d / 2;
    const [pos, rot]: [[number, number, number], number] =
      wall === 0 ? [[c, y, -e], 0] : wall === 1 ? [[-e, y, c], Math.PI / 2] : wall === 2 ? [[e, y, c], -Math.PI / 2] : [[c, y, 0], 0];
    out.push({ kind: it.kind, pos, rot });
    x += w + 0.3;
  }
  return out;
}

export default function RoomScene({ items, size }: { items: Item[]; size: number }) {
  const L = Math.max(3.5, Math.sqrt(size));
  return (
    <Canvas shadows camera={{ position: [L * 0.9, L * 0.8, L * 1.1], fov: 45 }} className="!h-full !w-full">
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.2} castShadow />
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[L, L]} /><meshStandardMaterial color="#c9b79c" /></mesh>
      <mesh position={[0, 1.4, -L / 2]}><boxGeometry args={[L, 2.8, 0.05]} /><meshStandardMaterial color="#efe9e1" /></mesh>
      <mesh position={[-L / 2, 1.4, 0]}><boxGeometry args={[0.05, 2.8, L]} /><meshStandardMaterial color="#e6ddd0" /></mesh>
      {layout(items, L).map((o, i) => {
        const [w, h, d, color] = K[o.kind] ?? [0.5, 0.5, 0.5, "#999"];
        return (
          <group key={i} position={o.pos} rotation-y={o.rot}>
            <mesh castShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} /></mesh>
            {o.kind === "bed" && <mesh position={[0, 0.35, -d / 2 + 0.05]}><boxGeometry args={[w, 0.7, 0.1]} /><meshStandardMaterial color="#6b4f36" /></mesh>}
            <Html position={[0, h / 2 + 0.15, 0]} center className="pointer-events-none rounded bg-white/90 px-1.5 text-[10px] capitalize text-ink">{o.kind}</Html>
          </group>
        );
      })}
      <OrbitControls maxPolarAngle={Math.PI / 2.1} target={[0, 0.8, 0]} />
    </Canvas>
  );
}
