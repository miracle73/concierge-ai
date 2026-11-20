"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, naira, type Booking, type Room } from "./lib";
import type { Keys } from "./World";

const World = dynamic(() => import("./World"), { ssr: false, loading: () => <p className="grid h-full place-items-center text-[#6b645b]">Opening the doors…</p> });

const HI = "Hi, welcome to The Larkfield! I'm Ava. The rooms are down the corridor behind me. Walk in, look around, and come back to me when one feels right.";
const PAY = "Lovely choice! Pop your details in and I'll take payment.";

function speak(t: string) {
  try { const u = new SpeechSynthesisUtterance(t); speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rise pointer-events-auto w-full max-w-sm rounded-md bg-white/95 p-5 shadow-xl backdrop-blur">{children}</div>
);

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [zone, setZone] = useState("");
  const [picked, setPicked] = useState<Room | null>(null);
  const [f, setF] = useState({ guest_name: "", email: "", nights: 1 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const keys = useRef<Keys>({});
  const greeted = useRef(false);

  useEffect(() => { api<Room[]>("/rooms").then(setRooms).catch(() => setErr("Couldn't load rooms. Refresh in a sec.")); }, []);
  useEffect(() => {
    if (zone !== "desk") return;
    if (picked) speak(PAY); else if (!greeted.current) { greeted.current = true; speak(HI); }
  }, [zone, picked]);

  const here = zone.startsWith("room:") ? rooms[+zone.slice(5)] : null;
  const pay = async (e: React.FormEvent) => {
    e.preventDefault(); if (!picked) return; setBusy(true); setErr("");
    try {
      const b = await api<Booking>("/reservations", { ...f, room_id: picked.id });
      window.location.href = b.pay_url || `/receipt/${b.id}`;
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  const hold = (k: string) => ({
    onPointerDown: () => { keys.current[k] = true; }, onPointerUp: () => { keys.current[k] = false; }, onPointerLeave: () => { keys.current[k] = false; },
  });
  const inp = "rounded-sm border border-[#e9e3da] px-3 py-2 text-sm";

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <World rooms={rooms} keys={keys} onZone={setZone} />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-pine font-serif text-lg italic text-stone">L</span>
          <span className="font-serif text-2xl text-pine">The Larkfield</span></div>
        <div className="pointer-events-auto flex items-center gap-3">
          {picked && <span className="rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white">Picked: {picked.name}</span>}
          <Link href="/dashboard" className="text-sm font-semibold text-pine hover:underline">For hotels →</Link>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 sm:items-start sm:p-6">
        {err && <Card><p className="text-sm text-clay">{err}</p></Card>}
        {zone === "desk" && !picked && (
          <Card><p className="text-[11px] font-bold tracking-widest text-clay">AVA</p>
            <p className="mt-1 font-medium leading-snug">{HI}</p></Card>
        )}
        {zone === "desk" && picked && (
          <Card>
            <p className="text-[11px] font-bold tracking-widest text-clay">AVA</p>
            <p className="mt-1 font-medium">{PAY}</p>
            <p className="mt-2 font-serif text-2xl text-pine">{picked.name} · {naira(picked.price)}<span className="text-sm">/night</span></p>
            <form onSubmit={pay} className="mt-3 flex flex-col gap-2">
              <input required placeholder="Your name" value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} className={inp} />
              <input required type="email" placeholder="Email for the receipt" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
              <label className="flex items-center justify-between text-sm">Nights
                <input type="number" min={1} max={30} value={f.nights} onChange={(e) => setF({ ...f, nights: +e.target.value })} className={inp + " w-20"} /></label>
              <button disabled={busy} className="rounded-sm bg-pine py-3 font-semibold text-white disabled:opacity-60">{busy ? "Opening Paystack…" : `Pay ${naira(picked.price * (f.nights || 0))}`}</button>
              <button type="button" onClick={() => setPicked(null)} className="text-xs text-[#6b645b] underline">Actually, let me look again</button>
            </form>
          </Card>
        )}
        {here && (
          <Card>
            <p className="text-xs font-semibold tracking-[.15em] text-[#6b645b]">YOU&apos;RE IN</p>
            <p className="font-serif text-3xl text-pine">{here.name}</p>
            <p className="text-sm text-[#6b645b]">{here.size_m2} m² · sleeps {here.guests} · {naira(here.price)}/night</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">{here.items.map((i) => <li key={i.kind} className="rounded-full border border-[#e9e3da] px-2 py-0.5 capitalize">{i.count > 1 ? `${i.count}× ` : ""}{i.kind}</li>)}</ul>
            {picked?.id === here.id
              ? <p className="mt-3 text-sm font-semibold text-pine">Nice. Head back to Ava at the desk to pay.</p>
              : <button onClick={() => setPicked(here)} className="mt-3 w-full rounded-sm bg-clay py-2.5 font-semibold text-white">I&apos;ll take this one</button>}
          </Card>
        )}
        {!zone && <p className="rounded-full bg-white/80 px-4 py-2 text-xs text-[#6b645b]">{picked ? "Walk back to Ava at the desk to pay." : "W / ↑ to walk · A D / ← → to turn. Say hi to Ava at the desk."}</p>}
      </div>

      <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 select-none sm:hidden">
        <span /><button {...hold("w")} className="h-12 w-12 rounded-full bg-pine/80 text-white">▲</button><span />
        <button {...hold("a")} className="h-12 w-12 rounded-full bg-pine/80 text-white">◀</button>
        <button {...hold("s")} className="h-12 w-12 rounded-full bg-pine/80 text-white">▼</button>
        <button {...hold("d")} className="h-12 w-12 rounded-full bg-pine/80 text-white">▶</button>
      </div>
    </main>
  );
}
