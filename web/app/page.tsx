"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, naira, type Booking, type Room } from "./lib";
import type { Keys } from "./World";

const World = dynamic(() => import("./World"), { ssr: false, loading: () => <p className="grid h-full place-items-center text-sm text-mute">Opening the doors…</p> });

const HI = "Hi, welcome to Larkfield. I'm Ava. The rooms are down the corridor behind me. Have a look, and come back when one feels right.";
const say = (t: string) => { try { const u = new SpeechSynthesisUtterance(t); speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} };

const Chip = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <span className={`rounded-[10px] px-3 py-2 text-[13px] font-semibold ${dark ? "bg-pine text-white" : "bg-white text-ink"}`}>{children}</span>
);
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="card rise pointer-events-auto w-full max-w-[380px] p-5 shadow-[0_8px_24px_rgba(0,0,0,.08)]">{children}</div>
);
const Ava = ({ sub = "Front desk" }: { sub?: string }) => (
  <div className="flex items-center gap-2.5"><span className="h-8 w-8 rounded-full bg-[#c98a5e]" />
    <div><p className="text-sm font-bold leading-tight">Ava</p><p className="text-[11px] text-mute">{sub}</p></div></div>
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

  useEffect(() => { api<Room[]>("/rooms").then(setRooms).catch(() => setErr("Couldn't load rooms. Refresh in a moment.")); }, []);
  const payLine = picked ? `${picked.name}, good pick. That's ${naira(picked.price)} a night. How many nights, and where should the receipt go?` : "";
  useEffect(() => {
    if (zone !== "desk") return;
    if (picked) say(payLine); else if (!greeted.current) { greeted.current = true; say(HI); }
  }, [zone, picked, payLine]);

  const here = zone.startsWith("room:") ? rooms[+zone.slice(5)] : null;
  const pay = async (e: React.FormEvent) => {
    e.preventDefault(); if (!picked) return; setBusy(true); setErr("");
    try { const b = await api<Booking>("/reservations", { ...f, room_id: picked.id }); window.location.href = b.pay_url || `/receipt/${b.id}`; }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  const nights = (d: number) => setF({ ...f, nights: Math.min(30, Math.max(1, f.nights + d)) });
  const hold = (k: string) => ({ onPointerDown: () => { keys.current[k] = true; }, onPointerUp: () => { keys.current[k] = false; }, onPointerLeave: () => { keys.current[k] = false; } });
  const where = zone === "desk" ? "Front desk" : here ? here.name : "Lobby";

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <World rooms={rooms} keys={keys} onZone={setZone} />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4 sm:p-6">
        <span className="flex items-center gap-2.5 rounded-[10px] bg-white py-2 pl-2.5 pr-3.5"><span className="h-6 w-6 rounded-md bg-clay" /><b className="text-sm">Larkfield, Lekki</b></span>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <Chip>{where} · {rooms.length} rooms</Chip>
          {picked && <Chip dark>Picked: {picked.name}</Chip>}
          <Link href="/dashboard" className="hidden rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold text-mute hover:text-ink sm:block">For hotels</Link>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 sm:items-start sm:p-7">
        {err && <Panel><p className="text-sm text-clay">{err}</p></Panel>}
        {zone === "desk" && !picked && <Panel><Ava /><p className="mt-3 text-sm font-medium leading-relaxed">{HI}</p></Panel>}
        {zone === "desk" && picked && (
          <Panel>
            <Ava />
            <p className="mt-3 text-sm font-medium leading-relaxed">{payLine}</p>
            <form onSubmit={pay} className="mt-3 flex flex-col gap-2">
              <input required placeholder="Full name" value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} className="inp" />
              <input required type="email" placeholder="Email for the receipt" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="inp" />
              <div className="flex items-center justify-between text-sm font-medium">Nights
                <span className="flex items-center rounded-lg border border-line">
                  <button type="button" onClick={() => nights(-1)} className="px-3 py-1.5">−</button><b className="w-6 text-center">{f.nights}</b>
                  <button type="button" onClick={() => nights(1)} className="px-3 py-1.5">+</button></span></div>
              <button disabled={busy} className="mt-1 rounded-lg bg-pine py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Opening Paystack…" : `Pay ${naira(picked.price * f.nights)}`}</button>
              <p className="flex justify-between text-[11px] text-mute">Paystack · card, transfer or USSD
                <button type="button" onClick={() => setPicked(null)} className="underline">Pick another room</button></p>
            </form>
          </Panel>
        )}
        {here && (
          <Panel>
            <div className="flex items-start justify-between">
              <div><p className="text-[11px] font-medium text-mute">You&apos;re in</p><p className="text-lg font-bold">{here.name}</p></div>
              <p className="text-right"><b>{naira(here.price)}</b><span className="block text-[11px] text-mute">per night</span></p>
            </div>
            <p className="mt-1 text-[13px] text-mute">{here.size_m2} m² · sleeps {here.guests}</p>
            <p className="mt-2 text-[13px] capitalize">{here.items.map((i) => (i.count > 1 ? `${i.count} ${i.kind}s` : i.kind)).join(", ")}</p>
            {picked?.id === here.id
              ? <p className="mt-3 rounded-lg bg-[#e3efe7] px-3 py-2 text-[13px] font-semibold text-pine">Saved. Head back to Ava at the front desk to pay.</p>
              : <button onClick={() => setPicked(here)} className="mt-3 w-full rounded-lg bg-pine py-2.5 text-sm font-semibold text-white">I&apos;ll take this room</button>}
          </Panel>
        )}
      </div>

      <div className="absolute bottom-7 right-7 hidden items-center gap-4 rounded-[10px] bg-white/90 px-3.5 py-2.5 text-xs font-semibold sm:flex">
        <span>W walk</span><span>A / D turn</span><span className="text-mute">{picked ? "Pay at the front desk" : "Say hi to Ava"}</span>
      </div>
      <div className="absolute bottom-4 right-4 grid select-none grid-cols-3 gap-1 sm:hidden">
        <span /><button {...hold("w")} className="h-12 w-12 rounded-xl bg-white text-ink shadow">▲</button><span />
        <button {...hold("a")} className="h-12 w-12 rounded-xl bg-white text-ink shadow">◀</button>
        <button {...hold("s")} className="h-12 w-12 rounded-xl bg-white text-ink shadow">▼</button>
        <button {...hold("d")} className="h-12 w-12 rounded-xl bg-white text-ink shadow">▶</button>
      </div>
    </main>
  );
}
