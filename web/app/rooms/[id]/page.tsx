"use client";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../Header";
import { api, naira, type Booking, type Room } from "../../lib";

const RoomScene = dynamic(() => import("../../RoomScene"), { ssr: false, loading: () => <p className="p-6 text-white/60">Setting up the room…</p> });

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [f, setF] = useState({ guest_name: "", email: "", nights: 1 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { api<Room>(`/rooms/${id}`).then(setRoom).catch(() => setErr("That room's gone missing.")); }, [id]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const b = await api<Booking>("/reservations", { ...f, room_id: id }); router.push(`/receipt/${b.id}`); }
    catch (x) { setErr(String((x as Error).message)); setBusy(false); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Header />
      {err && !room && <p className="mt-8 text-clay">{err}</p>}
      {room && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[60vh] overflow-hidden rounded-md bg-gradient-to-b from-[#2c5240] to-[#14271d]">
            <RoomScene items={room.items} size={room.size_m2} />
          </div>
          <aside className="flex flex-col gap-4 rounded-md bg-white p-6">
            <p className="text-xs font-semibold tracking-[.15em] text-[#6b645b]">{room.hotel.toUpperCase()}</p>
            <h1 className="-mt-2 font-serif text-4xl text-pine">{room.name}</h1>
            <p className="text-sm text-[#6b645b]">{room.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {[["Size", `${room.size_m2} m²`], ["Sleeps", room.guests], ["Night", naira(room.price)]].map(([k, v]) => (
                <div key={k} className="rounded-sm bg-stone p-2"><p className="text-[11px] text-[#6b645b]">{k}</p><p className="font-semibold">{v}</p></div>))}
            </div>
            <p className="text-xs font-semibold tracking-[.15em] text-[#6b645b]">IN THE ROOM</p>
            <ul className="-mt-2 flex flex-wrap gap-2 text-sm">{room.items.map((i) => <li key={i.kind} className="rounded-full border border-[#e9e3da] px-3 py-1 capitalize">{i.count > 1 ? `${i.count}× ` : ""}{i.kind}</li>)}</ul>
            <p className="text-xs text-[#8a8278]">Drag to look around, scroll to zoom.</p>

            <form onSubmit={pay} className="mt-2 flex flex-col gap-3 border-t border-[#e9e3da] pt-4">
              <input required placeholder="Your name" value={f.guest_name} onChange={(e) => setF({ ...f, guest_name: e.target.value })} className="rounded-sm border border-[#e9e3da] px-3 py-2" />
              <input required type="email" placeholder="Email for the receipt" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="rounded-sm border border-[#e9e3da] px-3 py-2" />
              <label className="flex items-center justify-between text-sm">Nights
                <input type="number" min={1} max={30} value={f.nights} onChange={(e) => setF({ ...f, nights: +e.target.value })} className="w-20 rounded-sm border border-[#e9e3da] px-3 py-2" /></label>
              {err && <p className="text-sm text-clay">{err}</p>}
              <button disabled={busy} className="rounded-sm bg-pine py-3 font-semibold text-white disabled:opacity-60">
                {busy ? "Paying…" : `Pay ${naira(room.price * (f.nights || 0))}`}</button>
              <p className="text-center text-[11px] text-[#8a8278]">Demo payment. No card is charged.</p>
            </form>
          </aside>
        </section>
      )}
    </main>
  );
}
