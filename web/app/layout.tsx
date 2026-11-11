import "./globals.css";
import { Inter, Instrument_Serif } from "next/font/google";
const i = Inter({ subsets: ["latin"], variable: "--font-inter" });
const s = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });
export const metadata = { title: "The Larkfield · Check-in" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${i.variable} ${s.variable}`}><body className="paper font-sans antialiased">{children}</body></html>;
}
