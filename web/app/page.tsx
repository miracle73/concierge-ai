"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, useTrackVolume, useVoiceAssistant, VoiceAssistantControlBar } from "@livekit/components-react";

const Avatar = dynamic(() => import("./Avatar"), { ssr: false });
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const HELLOS = ["Hello", "Bawo", "Ndewo", "Sannu", "Bonjour"];
const STEPS = ["Hi", "Your booking", "All good?", "Key"];
const MOOD: Record<string, string> = { listening: "Go ahead, I'm listening", thinking: "Hang on, checking…", speaking: "Ava's talking", connecting: "Waking Ava up…" };

function useNow() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => { setT(new Date()); const i = setInterval(() => setT(new Date()), 20000); return () => clearInterval(i); }, []);
  return t;
}

function Hello() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % HELLOS.length), 2200); return () => clearInterval(t); }, []);
  return <span key={i} className="rise inline-block italic text-[#e8b08a]">{HELLOS[i]}</span>;
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <p className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
    <span className="h-2 w-2 animate-pulse rounded-full bg-[#7ee0a3]" />{children}</p>
);

function Live() {
  const va = useVoiceAssistant();
  const volume = useTrackVolume(va.audioTrack);
  const last = va.agentTranscriptions?.at(-1)?.text;
  return (
    <>
      <div className="absolute inset-0 grid place-items-center"><Avatar volume={volume} /></div>
      <Pill>{MOOD[va.state] ?? "Here when you're ready"}</Pill>
      {last && (
        <div key={last} className="rise absolute bottom-6 left-6 z-10 max-w-md rounded-2xl rounded-bl-sm bg-white px-6 py-4 shadow-lg">
          <p className="text-[11px] font-bold tracking-widest text-clay">AVA</p>
          <p className="mt-1 text-lg font-medium leading-snug">{last}</p>
        </div>
      )}
      <div className="absolute bottom-6 right-6 z-10"><VoiceAssistantControlBar /></div>
    </>
  );
}

function Row({ k }: { k: string }) {
  return <div className="flex justify-between border-b border-[#e9e3da] pb-3 text-[15px]"><span className="text-[#6b645b]">{k}</span>
    <span className="mt-3 w-20 border-b border-dashed border-[#c9c1b5]" /></div>;
}

export default function Page() {
  const now = useNow();
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    const id = `guest-${crypto.randomUUID().slice(0, 8)}`;
    try { setConn(await (await fetch(`${API}/token?identity=${id}&room=lobby-${id}`)).json()); }
    catch { alert("Ava's on a break. The desk team can sort you out!"); }
    finally { setBusy(false); }
  };
  const step = conn ? 1 : 0;
  const hour = now?.getHours() ?? 12;

  const body = (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-14 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-pine font-serif text-lg italic text-stone">L</span>
          <div><p className="font-serif text-2xl leading-none text-pine">The Larkfield</p><p className="text-xs text-[#6b645b]">Lobby · desk 2</p></div>
        </div>
        <div className="flex items-baseline gap-5">
          <span className="hidden text-sm text-[#6b645b] sm:inline">{hour < 12 ? "Morning!" : hour < 18 ? "Afternoon!" : "Evening!"} Lagos, 29°</span>
          <span className="font-serif text-4xl text-pine">{now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-md bg-gradient-to-b from-[#2c5240] to-[#14271d] lg:min-h-0">
          <div className="sway absolute right-8 top-10 z-10 hidden w-52 rounded-sm bg-[#f7e7a8] px-5 py-4 shadow-[0_8px_20px_rgba(0,0,0,.25)] sm:block">
            <p className="font-serif text-xl leading-tight text-[#3a3220]">Checking out late?<br />1pm is fine :)</p>
            <p className="mt-1 text-[11px] font-medium text-[#6b5a2e]">— Ada</p>
          </div>
          {conn ? <Live /> : (
            <div className="absolute inset-0 flex flex-col items-start justify-end gap-6 p-8 text-white sm:p-12">
              <h1 className="font-serif text-6xl leading-[.95] sm:text-8xl"><Hello />,<br />you made it.</h1>
              <p className="max-w-sm text-white/70">Long trip? Let's get you upstairs. Tap below, tell Ava your name, and she'll handle the rest.</p>
              <button onClick={start} disabled={busy}
                className="rounded-full bg-clay px-8 py-4 font-semibold text-white shadow-lg transition hover:-rotate-1 hover:scale-105 disabled:opacity-60">
                {busy ? "Waking Ava up…" : "Tap to talk to Ava"}</button>
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col gap-5 rounded-md bg-white p-8 lg:w-[420px]">
          <p className="text-xs font-semibold tracking-[.15em] text-[#6b645b]">YOUR STAY</p>
          <p className="font-serif text-4xl text-pine">{conn ? "Nice to meet you" : "And you are…?"}</p>
          <p className="-mt-3 text-sm text-[#8a8278]">This fills itself in while you two chat.</p>
          <Row k="Ref" /><Row k="In" /><Row k="Out" /><Row k="Room" />
          <div className="relative rounded-sm border border-dashed border-clay/50 bg-[#f3e6d6] px-6 py-5">
            <p className="text-xs font-semibold tracking-[.15em] text-clay">ROOM</p>
            <p className="font-serif text-7xl leading-none text-pine/25">???</p>
            <p className="mt-2 text-sm text-[#6b645b]">Your number shows up here. No peeking.</p>
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
          </div>
          <p className="mt-auto text-sm text-[#8a8278]">Rather talk to a person? Wave at us, we're right here.</p>
        </aside>
      </section>

      <ol className="grid grid-cols-4 gap-3 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={`pt-3 font-semibold ${i === step ? "border-t-[3px] border-pine text-pine" : i < step ? "border-t border-pine text-[#6b645b]" : "border-t border-[#c9c1b5] text-[#a39b90]"}`}>
            <span className="mr-2 text-clay">0{i + 1}</span>{s}</li>
        ))}
      </ol>
    </main>
  );

  return conn ? (
    <LiveKitRoom serverUrl={conn.url} token={conn.token} connect audio onDisconnected={() => setConn(null)}>{body}<RoomAudioRenderer /></LiveKitRoom>
  ) : body;
}
