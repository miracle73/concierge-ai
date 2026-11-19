"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../Header";
import { api, KINDS, type Room } from "../lib";

const RoomScene = dynamic(() => import("../RoomScene"), { ssr: false });

export default function Dashboard() {
  const [r, setR] = useState({ hotel: "", name: "", price: 50000, size_m2: 25, guests: 2, description: "" });
  const [items, setItems] = useState<Record<string, number>>({ bed: 1 });
  const [saved, setSaved] = useState<Room | null>(null);
  const [err, setErr] = useState("");
  const list = Object.entries(items).filter(([, c]) => c > 0).map(([kind, count]) => ({ kind, count }));
  const num = (k: keyof typeof r) => (e: React.ChangeEvent<HTMLInputElement>) => setR({ ...r, [k]: +e.target.value });
  const txt = (k: keyof typeof r) => (e: React.ChangeEvent<HTMLInputElement>) => setR({ ...r, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try { setSaved(await api<Room>("/rooms", { ...r, items: list })); } catch (x) { setErr((x as Error).message); }
  };
  const inp = "rounded-sm border border-[#e9e3da] px-3 py-2";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Header />
      <h1 className="mt-8 font-serif text-4xl text-pine">Add a room</h1>
      <p className="text-sm text-[#6b645b]">Fill in the room and what's in it. Guests see it in 3D as you build it.</p>
      <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={save} className="flex flex-col gap-3 rounded-md bg-white p-6">
          <input required placeholder="Hotel or Airbnb name" value={r.hotel} onChange={txt("hotel")} className={inp} />
          <input required placeholder="Room name, e.g. Garden King" value={r.name} onChange={txt("name")} className={inp} />
          <input placeholder="Short description" value={r.description} onChange={txt("description")} className={inp} />
          <div className="grid grid-cols-3 gap-2 text-xs text-[#6b645b]">
            <label>₦ / night<input type="number" min={1} value={r.price} onChange={num("price")} className={inp + " mt-1 w-full"} /></label>
            <label>Size m²<input type="number" min={8} value={r.size_m2} onChange={num("size_m2")} className={inp + " mt-1 w-full"} /></label>
            <label>Sleeps<input type="number" min={1} value={r.guests} onChange={num("guests")} className={inp + " mt-1 w-full"} /></label>
          </div>
          <p className="mt-2 text-xs font-semibold tracking-[.15em] text-[#6b645b]">ITEMS IN THE ROOM</p>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <label key={k} className="flex items-center justify-between rounded-sm bg-stone px-3 py-2 text-sm capitalize">{k}
                <input type="number" min={0} max={6} value={items[k] ?? 0} onChange={(e) => setItems({ ...items, [k]: +e.target.value })} className="w-14 rounded-sm border border-[#e9e3da] bg-white px-2 py-1" /></label>))}
          </div>
          {err && <p className="text-sm text-clay">{err}</p>}
          <button className="mt-2 rounded-sm bg-pine py-3 font-semibold text-white">Publish room</button>
          {saved && <p className="text-sm text-pine">Live! <Link href={`/rooms/${saved.id}`} className="font-semibold underline">See it as a guest →</Link></p>}
        </form>
        <div className="h-[70vh] overflow-hidden rounded-md bg-gradient-to-b from-[#2c5240] to-[#14271d]">
          <RoomScene items={list} size={r.size_m2} />
        </div>
      </section>
    </main>
  );
}
