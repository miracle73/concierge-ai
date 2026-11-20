"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, KINDS, naira, type Room } from "../lib";

const RoomScene = dynamic(() => import("../RoomScene"), { ssr: false });
const NAV = ["Overview", "Add room"] as const;

function Stat({ label, value, note, dark }: { label: string; value: string; note: string; dark?: boolean }) {
  return (
    <div className={`flex-1 rounded-xl p-5 ${dark ? "bg-pine text-white" : "card"}`}>
      <p className={`text-xs font-medium ${dark ? "text-[#b9c9bf]" : "text-mute"}`}>{label}</p>
      <p className="mt-1.5 text-[26px] font-bold leading-none">{value}</p>
      <p className={`mt-2 text-[11px] ${dark ? "text-[#b9c9bf]" : "text-mute"}`}>{note}</p>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<(typeof NAV)[number]>("Overview");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [r, setR] = useState({ hotel: "Larkfield", name: "", price: 50000, size_m2: 25, guests: 2, description: "" });
  const [items, setItems] = useState<Record<string, number>>({ bed: 1 });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const load = () => api<Room[]>("/rooms").then(setRooms).catch(() => setErr("Couldn't reach the server."));
  useEffect(() => { load(); }, []);

  const list = Object.entries(items).filter(([, c]) => c > 0).map(([kind, count]) => ({ kind, count }));
  const set = (k: keyof typeof r, n?: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => setR({ ...r, [k]: n ? +e.target.value : e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk("");
    try { const s = await api<Room>("/rooms", { ...r, items: list }); setOk(s.name); setR({ ...r, name: "", description: "" }); setItems({ bed: 1 }); load(); }
    catch (x) { setErr((x as Error).message); }
  };
  const avg = rooms.length ? Math.round(rooms.reduce((a, b) => a + b.price, 0) / rooms.length) : 0;
  const beds = rooms.reduce((a, b) => a + b.guests, 0);
  const hour = new Date().getHours();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 bg-night p-4 text-white lg:min-h-dvh lg:w-[248px] lg:p-5">
        <Link href="/" className="mb-4 flex items-center gap-2.5 px-1.5 lg:mb-6"><span className="h-[30px] w-[30px] rounded-lg bg-clay" /><b className="text-[17px]">Larkfield</b></Link>
        <p className="hidden px-3 text-[11px] font-medium text-[#8fa397] lg:block">Front office</p>
        <nav className="flex gap-1 lg:flex-col">
          {NAV.map((n) => (
            <button key={n} onClick={() => setTab(n)} className={`rounded-lg px-3 py-2.5 text-left text-sm ${tab === n ? "bg-pine font-semibold" : "font-medium text-[#c7d2cb] hover:text-white"}`}>{n}</button>
          ))}
          <Link href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#c7d2cb] hover:text-white">Guest view ↗</Link>
        </nav>
        <div className="mt-auto hidden rounded-[10px] bg-white/[.06] p-3.5 lg:block">
          <p className="text-[13px] font-semibold">Payments</p>
          <p className="mt-0.5 text-xs text-[#8fa397]">Bookings and payouts are in your Paystack dashboard.</p>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold">{hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}</h1>
            <p className="text-[13px] text-mute">{rooms.length} rooms listed · guests can walk through every one in 3D</p>
          </div>
          {tab === "Overview" && <button onClick={() => setTab("Add room")} className="rounded-lg bg-pine px-4 py-2.5 text-[13px] font-semibold text-white">+ Add room</button>}
        </div>
        {err && <p className="mt-4 text-sm text-clay">{err}</p>}

        {tab === "Overview" && (
          <>
            <div className="mt-6 flex flex-col gap-3.5 sm:flex-row">
              <Stat dark label="Rooms listed" value={String(rooms.length)} note="Visible in the guest walkthrough" />
              <Stat label="Average nightly rate" value={naira(avg)} note="Across all rooms" />
              <Stat label="Guests you can host" value={String(beds)} note="If every room is booked" />
            </div>
            <section className="card mt-5 overflow-x-auto p-5">
              <h2 className="mb-3.5 text-base font-bold">Your rooms</h2>
              <table className="w-full min-w-[640px] whitespace-nowrap text-left text-[13px]">
                <thead><tr className="text-[11px] text-mute">{["Room", "Size", "Sleeps", "Rate", "In the room", ""].map((h) => <th key={h} className="bg-stone px-3 py-2.5 font-medium first:rounded-l-md last:rounded-r-md">{h}</th>)}</tr></thead>
                <tbody>
                  {rooms.map((x) => (
                    <tr key={x.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3.5 font-semibold">{x.name}</td><td className="px-3">{x.size_m2} m²</td><td className="px-3">{x.guests}</td>
                      <td className="px-3">{naira(x.price)}</td>
                      <td className="px-3 capitalize text-mute">{x.items.map((i) => (i.count > 1 ? `${i.count} ${i.kind}s` : i.kind)).join(", ")}</td>
                      <td className="px-3 text-right"><span className="rounded-full bg-[#e3efe7] px-2 py-0.5 text-[11px] font-semibold text-pine">Live</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {tab === "Add room" && (
          <section className="mt-6 grid gap-5 xl:grid-cols-[400px_1fr]">
            <form onSubmit={save} className="card flex flex-col gap-3 p-5">
              <h2 className="text-base font-bold">Room details</h2>
              <input required placeholder="Hotel or Airbnb name" value={r.hotel} onChange={set("hotel")} className="inp" />
              <input required placeholder="Room name, e.g. Garden King 204" value={r.name} onChange={set("name")} className="inp" />
              <input placeholder="One line about the room" value={r.description} onChange={set("description")} className="inp" />
              <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-mute">
                <label>₦ per night<input type="number" min={1} value={r.price} onChange={set("price", true)} className="inp mt-1 w-full text-ink" /></label>
                <label>Size (m²)<input type="number" min={8} value={r.size_m2} onChange={set("size_m2", true)} className="inp mt-1 w-full text-ink" /></label>
                <label>Sleeps<input type="number" min={1} value={r.guests} onChange={set("guests", true)} className="inp mt-1 w-full text-ink" /></label>
              </div>
              <h3 className="mt-1 text-[13px] font-semibold">What&apos;s in the room</h3>
              <div className="grid grid-cols-2 gap-2">
                {KINDS.map((k) => (
                  <label key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5 text-[13px] capitalize">{k}
                    <input type="number" min={0} max={6} value={items[k] ?? 0} onChange={(e) => setItems({ ...items, [k]: +e.target.value })} className="w-12 rounded-md bg-stone px-2 py-1 text-right" /></label>
                ))}
              </div>
              <button className="mt-1 rounded-lg bg-pine py-3 text-sm font-semibold text-white">Publish room</button>
              {ok && <p className="rounded-lg bg-[#e3efe7] px-3 py-2 text-[13px] text-pine"><b>{ok}</b> is live. Guests can walk into it now.</p>}
            </form>
            <div className="card flex min-h-[420px] flex-col overflow-hidden">
              <p className="border-b border-line px-5 py-3 text-[13px] font-semibold">Live preview <span className="font-normal text-mute">· drag to look around</span></p>
              <div className="flex-1 bg-[#e9e2d6]"><RoomScene items={list} size={r.size_m2} /></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
