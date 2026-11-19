"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, naira, type Room } from "./lib";
import { Header } from "./Header";

const GREET = "Hi, welcome! I'm Ava. Have a look around — tap any room to walk through it, and I'll help you book.";

function speak(t: string) {
  try { const u = new SpeechSynthesisUtterance(t); u.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<Room[]>("/rooms").then(setRooms).catch(() => setErr("Couldn't load rooms. Give it a sec and refresh."));
    const once = () => { speak(GREET); window.removeEventListener("pointerdown", once); };
    window.addEventListener("pointerdown", once);
    return () => window.removeEventListener("pointerdown", once);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Header />
      <section className="mt-8 flex flex-col gap-6 rounded-md bg-gradient-to-br from-[#2c5240] to-[#14271d] p-8 text-white sm:flex-row sm:items-end sm:p-12">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#e8b08a] font-serif text-4xl italic text-pine">A</div>
        <div className="flex-1">
          <p className="text-[11px] font-bold tracking-widest text-[#e8b08a]">AVA · RECEPTION</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-6xl">Hi, welcome in.<br /><em className="text-[#e8b08a]">Pick a room, any room.</em></h1>
          <p className="mt-3 max-w-lg text-white/70">Tap a room to walk through it in 3D. See something you like? Book it right there.</p>
        </div>
        <button onClick={() => speak(GREET)} className="self-start rounded-full bg-clay px-6 py-3 text-sm font-semibold transition hover:-rotate-1 sm:self-end">Hear Ava 🔊</button>
      </section>

      <h2 className="mt-12 font-serif text-3xl text-pine">Rooms tonight</h2>
      {err && <p className="mt-4 text-clay">{err}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((r) => (
          <Link key={r.id} href={`/rooms/${r.id}`} className="group rounded-md bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-xs font-semibold tracking-[.15em] text-[#6b645b]">{r.hotel.toUpperCase()}</p>
            <p className="mt-2 font-serif text-3xl text-pine">{r.name}</p>
            <p className="mt-1 text-sm text-[#6b645b]">{r.size_m2} m² · sleeps {r.guests}</p>
            <p className="mt-3 line-clamp-2 text-sm">{r.description}</p>
            <div className="mt-5 flex items-end justify-between">
              <p><span className="font-serif text-2xl">{naira(r.price)}</span><span className="text-xs text-[#6b645b]"> / night</span></p>
              <span className="text-sm font-semibold text-clay group-hover:underline">Walk through →</span>
            </div>
          </Link>
        )) ?? (!err && <p className="text-[#6b645b]">Fetching rooms…</p>)}
      </div>
    </main>
  );
}
