import Link from "next/link";

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-pine font-serif text-lg italic text-stone">L</span>
        <span className="font-serif text-2xl text-pine">The Larkfield</span>
      </Link>
      <Link href="/dashboard" className="text-sm font-semibold text-pine hover:underline">For hotels →</Link>
    </header>
  );
}
