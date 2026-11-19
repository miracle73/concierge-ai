export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
export type Item = { kind: string; count: number };
export type Room = { id: string; hotel: string; name: string; price: number; size_m2: number; guests: number; description: string; items: Item[] };
export type Booking = { id: string; room_id: string; room_name: string; hotel: string; guest_name: string; email: string; nights: number; total: number; paid_at: string };
export const KINDS = ["bed", "wardrobe", "desk", "chair", "tv", "sofa", "lamp", "plant", "fridge", "bathtub", "ac"];
export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(API + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
