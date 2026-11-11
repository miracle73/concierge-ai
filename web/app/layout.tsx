import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
const j = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
export const metadata = { title: "The Concierge" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={j.variable}><body className="font-sans antialiased">{children}</body></html>;
}
