"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../Header";
import { api, naira, type Booking } from "../../lib";

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<Booking | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<Booking>(`/reservations/${id}`).then(setB).catch(() => setErr("Couldn't find that receipt.")); }, [id]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="print:hidden"><Header /></div>
      {err && <p className="mt-8 text-clay">{err}</p>}
      {b && (
        <section className="relative mx-auto mt-10 max-w-md rounded-sm border border-dashed border-clay/50 bg-white p-8">
          <p className="text-xs font-semibold tracking-[.15em] text-clay">PAID · RECEIPT</p>
          <h1 className="mt-1 font-serif text-4xl text-pine">You're all set, {b.guest_name.split(" ")[0]}.</h1>
          <dl className="mt-6 space-y-3 text-sm">
            {[["Receipt", b.id], ["Hotel", b.hotel], ["Room", b.room_name], ["Nights", b.nights], ["Email", b.email], ["Paid", new Date(b.paid_at).toLocaleString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-[#e9e3da] pb-2"><dt className="text-[#6b645b]">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
          </dl>
          <p className="mt-6 flex items-baseline justify-between"><span className="text-[#6b645b]">Total</span><span className="font-serif text-4xl text-pine">{naira(b.total)}</span></p>
          <button onClick={() => print()} className="mt-6 w-full rounded-sm bg-pine py-3 font-semibold text-white print:hidden">Save / print receipt</button>
          <span className="absolute -left-3 top-1/2 h-6 w-6 rounded-full bg-stone" /><span className="absolute -right-3 top-1/2 h-6 w-6 rounded-full bg-stone" />
        </section>
      )}
    </main>
  );
}
