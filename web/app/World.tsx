"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useRef, type MutableRefObject } from "react";
import { K, layout } from "./RoomScene";
import { naira, type Room } from "./lib";

export type Keys = Record<string, boolean>;
const L = 5.5, SPEED = 3.2, TURN = 1.8;
type Rect = [number, number, number, number]; // xmin xmax zmin zmax

export const slot = (i: number) => {
  const side = i % 2 === 0 ? 1 : -1, z = -6 - Math.floor(i / 2) * 7;
  return { side, z, cx: side * (2.3 + L / 2) };
};
const inR = (x: number, z: number, [a, b, c, d]: Rect) => x >= a && x <= b && z >= c && z <= d;
const span = (s: number, a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);

function areas(n: number) {
  const lastZ = n ? slot(n - 1).z : -6;
  const walk: Rect[] = [[-6.5, 6.5, -1.6, 9], [-1.7, 1.7, lastZ - 3, -1.4]];
  const rooms: Rect[] = [];
  for (let i = 0; i < n; i++) {
    const { side, z } = slot(i);
    walk.push([...span(side, 1.5, 2.6), z - 0.55, z + 0.55]);
    const r: Rect = [...span(side, 2.5, 2.3 + L - 0.2), z - L / 2 + 0.2, z + L / 2 - 0.2];
    rooms.push(r); walk.push(r);
  }
  return { walk, rooms };
}

function Player({ keys, rooms, onZone }: { keys: MutableRefObject<Keys>; rooms: Room[]; onZone: (z: string) => void }) {
  const { camera } = useThree();
  const p = useRef({ x: 0, z: 7, yaw: 0 }), zone = useRef("");
  const a = areas(rooms.length);
  useFrame((_, dt) => {
    const k = keys.current, s = p.current;
    if (k.ArrowLeft || k.a) s.yaw += TURN * dt;
    if (k.ArrowRight || k.d) s.yaw -= TURN * dt;
    const f = (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
    const nx = s.x - Math.sin(s.yaw) * f * SPEED * dt, nz = s.z - Math.cos(s.yaw) * f * SPEED * dt;
    if (a.walk.some((r) => inR(nx, nz, r)) && !inR(nx, nz, [-2.2, 2.2, -0.6, 1.7])) { s.x = nx; s.z = nz; }
    camera.position.set(s.x, 1.6, s.z);
    camera.rotation.set(0, s.yaw, 0);
    const ri = a.rooms.findIndex((r) => inR(s.x, s.z, r));
    const z = Math.hypot(s.x, s.z - 1) < 2.8 ? "desk" : ri >= 0 ? `room:${ri}` : "";
    if (z !== zone.current) { zone.current = z; onZone(z); }
  });
  return null;
}

const Box = ({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) => (
  <mesh position={p}><boxGeometry args={s} /><meshStandardMaterial color={c} /></mesh>
);

function RoomCell({ room, i }: { room: Room; i: number }) {
  const { side, z, cx } = slot(i), wx = side * 2.3, H = 2.8, wall = "#efe9e1";
  const seg = (L - 1.2) / 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.01, z]}><planeGeometry args={[L, L]} /><meshStandardMaterial color="#c9b79c" /></mesh>
      <Box p={[cx + side * L / 2, H / 2, z]} s={[0.1, H, L]} c={wall} />
      <Box p={[cx, H / 2, z - L / 2]} s={[L, H, 0.1]} c="#e6ddd0" />
      <Box p={[cx, H / 2, z + L / 2]} s={[L, H, 0.1]} c="#e6ddd0" />
      <Box p={[wx, H / 2, z - 0.6 - seg / 2]} s={[0.1, H, seg]} c={wall} />
      <Box p={[wx, H / 2, z + 0.6 + seg / 2]} s={[0.1, H, seg]} c={wall} />
      <Box p={[wx, H - 0.3, z]} s={[0.1, 0.6, 1.2]} c={wall} />
      <Html position={[wx - side * 0.1, 2.35, z]} center className="pointer-events-none whitespace-nowrap rounded-sm bg-pine px-2 py-1 text-center text-[11px] text-white">
        <b className="font-serif text-sm">{room.name}</b><br />{naira(room.price)}/night
      </Html>
      <group position={[cx, 0, z]} rotation-y={-side * Math.PI / 2}>
        {layout(room.items, L).map((o, j) => {
          const [w, h, d, c] = K[o.kind] ?? [0.5, 0.5, 0.5, "#999"];
          return <mesh key={j} position={o.pos} rotation-y={o.rot}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={c} /></mesh>;
        })}
      </group>
    </group>
  );
}

function Lobby({ depth }: { depth: number }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 3.5]}><planeGeometry args={[14, 11]} /><meshStandardMaterial color="#d8c8ae" /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (-2 + depth) / 2]}><planeGeometry args={[4, -2 - depth]} /><meshStandardMaterial color="#b8a486" /></mesh>
      <Box p={[-4.5, 1.6, -2]} s={[5, 3.2, 0.1]} c="#1f3b2d" />
      <Box p={[4.5, 1.6, -2]} s={[5, 3.2, 0.1]} c="#1f3b2d" />
      <Box p={[-7, 1.6, 3.5]} s={[0.1, 3.2, 11]} c="#efe9e1" />
      <Box p={[7, 1.6, 3.5]} s={[0.1, 3.2, 11]} c="#efe9e1" />
      <Box p={[0, 0.55, 1]} s={[3.6, 1.1, 0.8]} c="#8a6a4a" />
      <Box p={[0, 1.12, 1]} s={[3.8, 0.06, 1]} c="#2b2620" />
      <Box p={[-5.5, 0.5, 6]} s={[1.8, 0.8, 0.8]} c="#b8643a" />
      <mesh position={[5.5, 0.6, 6]}><cylinderGeometry args={[0.3, 0.25, 1.2]} /><meshStandardMaterial color="#3f7d4a" /></mesh>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.28, 0.9]} /><meshStandardMaterial color="#1f3b2d" /></mesh>
        <mesh position={[0, 1.75, 0]}><sphereGeometry args={[0.2]} /><meshStandardMaterial color="#c98a5e" /></mesh>
        <Html position={[0, 2.15, 0]} center className="pointer-events-none rounded-full bg-clay px-2 py-0.5 text-[11px] font-semibold text-white">Ava · Reception</Html>
      </group>
      <Html position={[0, 2.8, -2]} center className="pointer-events-none whitespace-nowrap font-serif text-lg text-white">Rooms →</Html>
    </group>
  );
}

export default function World({ rooms, keys, onZone }: { rooms: Room[]; keys: MutableRefObject<Keys>; onZone: (z: string) => void }) {
  useEffect(() => {
    const set = (v: boolean) => (e: KeyboardEvent) => { keys.current[e.key.length === 1 ? e.key.toLowerCase() : e.key] = v; };
    const dn = set(true), up = set(false);
    addEventListener("keydown", dn); addEventListener("keyup", up);
    return () => { removeEventListener("keydown", dn); removeEventListener("keyup", up); };
  }, [keys]);
  const depth = rooms.length ? slot(rooms.length - 1).z - 3 : -6;
  return (
    <Canvas camera={{ fov: 70, position: [0, 1.6, 7] }} className="!h-full !w-full">
      <color attach="background" args={["#efe9e1"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 6]} intensity={1} />
      <Lobby depth={depth} />
      {rooms.map((r, i) => <RoomCell key={r.id} room={r} i={i} />)}
      <Player keys={keys} rooms={rooms} onZone={onZone} />
    </Canvas>
  );
}
