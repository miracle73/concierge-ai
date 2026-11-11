"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, useTrackVolume, useVoiceAssistant, VoiceAssistantControlBar } from "@livekit/components-react";

const Avatar = dynamic(() => import("./Avatar"), { ssr: false });
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const POINTS = ["Tell us your name or booking code", "We confirm your stay details", "Get your room number instantly"];
const LABEL: Record<string, string> = { listening: "Listening", thinking: "Looking that up", speaking: "Speaking", connecting: "Connecting" };

const Check = () => <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/15 text-[11px]">✓</span>;

function Left() {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-navy via-[#13286a] to-deep p-8 text-white sm:p-12">
      <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/[.06]" />
      <div className="absolute -left-20 top-1/3 h-56 w-56 rounded-full bg-white/[.05]" />
      <div className="relative flex items-center gap-2 font-semibold"><span className="grid h-7 w-7 place-items-center rounded-md bg-white text-xs text-navy">C</span>Concierge</div>
      <div className="relative my-12 max-w-md">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Skip the queue. Check in by just talking.</h1>
        <p className="mt-4 text-white/70">Ava, our front desk assistant, finds your booking and hands you your room in under a minute.</p>
        <ul className="mt-8 space-y-3 text-sm">{POINTS.map((p) => <li key={p} className="flex items-center gap-3"><Check />{p}</li>)}</ul>
        <div className="mt-10 flex flex-wrap gap-3 text-xs font-semibold">
          <span className="rounded-full bg-white px-4 py-2 text-deep">Room 204 is ready</span>
          <span className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">Checked in · 38 sec</span>
        </div>
      </div>
      <p className="relative text-xs text-white/50">© 2026 Concierge</p>
    </aside>
  );
}

function Stage() {
  const va = useVoiceAssistant();
  const volume = useTrackVolume(va.audioTrack);
  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200"><Avatar volume={volume} /></div>
      <p className="flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{LABEL[va.state] ?? "Ready"}</p>
      <VoiceAssistantControlBar />
    </>
  );
}

export default function Page() {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    const id = `guest-${crypto.randomUUID().slice(0, 8)}`;
    try { setConn(await (await fetch(`${API}/token?identity=${id}&room=lobby-${id}`)).json()); } finally { setBusy(false); }
  };
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <Left />
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
          {conn ? (
            <LiveKitRoom serverUrl={conn.url} token={conn.token} connect audio onDisconnected={() => setConn(null)} className="flex w-full flex-col items-center gap-5">
              <Stage /><RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <>
              <div className="w-full text-left">
                <h2 className="text-2xl font-bold">Welcome in</h2>
                <p className="text-sm text-slate-500">Tap start and say hello. We'll take it from there.</p>
              </div>
              <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-navy/10 text-3xl">🎙️</div>
              </div>
              <button onClick={start} disabled={busy} className="w-full rounded-lg bg-gradient-to-b from-navy to-deep py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? "Connecting…" : "Start check-in"}</button>
              <p className="text-sm text-slate-500">Prefer a person? <span className="font-semibold text-navy">Ask the front desk</span></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
