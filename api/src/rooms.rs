use axum::{extract::{Path, State}, http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Clone, Serialize, Deserialize)]
pub struct Item { pub kind: String, pub count: u32 }

#[derive(Clone, Serialize, Deserialize)]
pub struct Room {
    #[serde(default)] pub id: String,
    pub hotel: String, pub name: String, pub price: u32, pub size_m2: u32, pub guests: u32,
    #[serde(default)] pub description: String,
    pub items: Vec<Item>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Booking {
    #[serde(default)] pub id: String,
    pub room_id: String, pub guest_name: String, pub email: String, pub nights: u32,
    #[serde(default)] pub room_name: String,
    #[serde(default)] pub hotel: String,
    #[serde(default)] pub total: u32,
    #[serde(default)] pub paid_at: String,
    #[serde(default)] pub pay_url: String,
}

/// Total price for a stay. Pure logic, tested.
pub fn quote(price: u32, nights: u32) -> Result<u32, &'static str> {
    if !(1..=30).contains(&nights) { return Err("nights must be between 1 and 30"); }
    price.checked_mul(nights).ok_or("total too large")
}

pub struct Store { rooms: Mutex<Vec<Room>>, bookings: Mutex<Vec<Booking>> }

fn it(k: &str, c: u32) -> Item { Item { kind: k.into(), count: c } }
fn seed() -> Vec<Room> {
    let r = |id: &str, name: &str, price, size, guests, desc: &str, items| Room {
        id: id.into(), hotel: "The Larkfield".into(), name: name.into(), price, size_m2: size, guests, description: desc.into(), items };
    vec![
        r("r1", "Garden King", 65000, 28, 2, "Quiet king room facing the garden.", vec![it("bed",1), it("wardrobe",1), it("desk",1), it("chair",1), it("tv",1), it("lamp",2), it("plant",1), it("ac",1)]),
        r("r2", "City Twin", 48000, 22, 2, "Two single beds, street view, great for friends.", vec![it("bed",2), it("tv",1), it("chair",1), it("wardrobe",1), it("ac",1)]),
        r("r3", "Lagoon Suite", 120000, 45, 3, "Big suite with a lounge and a bathtub.", vec![it("bed",1), it("sofa",1), it("tv",1), it("bathtub",1), it("fridge",1), it("desk",1), it("chair",2), it("plant",2), it("ac",1)]),
    ]
}

type S = State<Arc<Store>>;
type E = (StatusCode, String);
fn bad(m: &str) -> E { (StatusCode::BAD_REQUEST, m.into()) }

async fn list(State(s): S) -> Json<Vec<Room>> { Json(s.rooms.lock().unwrap().clone()) }
async fn get_room(State(s): S, Path(id): Path<String>) -> Result<Json<Room>, E> {
    s.rooms.lock().unwrap().iter().find(|r| r.id == id).cloned().map(Json).ok_or((StatusCode::NOT_FOUND, "room not found".into()))
}
async fn add_room(State(s): S, Json(mut r): Json<Room>) -> Result<Json<Room>, E> {
    if r.name.trim().is_empty() || r.hotel.trim().is_empty() || r.price == 0 { return Err(bad("hotel, name and price are required")); }
    r.id = uuid::Uuid::new_v4().to_string()[..8].to_string();
    s.rooms.lock().unwrap().push(r.clone());
    Ok(Json(r))
}
/// Demo payment: books and marks paid in one step. Swap for Paystack/Stripe later.
async fn book(State(s): S, Json(mut b): Json<Booking>) -> Result<Json<Booking>, E> {
    let room = s.rooms.lock().unwrap().iter().find(|r| r.id == b.room_id).cloned().ok_or(bad("room not found"))?;
    if b.guest_name.trim().is_empty() || !b.email.contains('@') { return Err(bad("name and a valid email are required")); }
    b.total = quote(room.price, b.nights).map_err(bad)?;
    b.id = format!("RCPT-{}", &uuid::Uuid::new_v4().simple().to_string()[..8]).to_uppercase();
    b.room_name = room.name;
    b.hotel = room.hotel;
    if let Some(key) = ps_key() {
        let web = std::env::var("WEB_URL").unwrap_or("http://localhost:3100".into());
        let body = serde_json::json!({"email": b.email, "amount": b.total as u64 * 100, "currency": "NGN", "reference": b.id,
            "callback_url": format!("{web}/receipt/{}", b.id), "metadata": b});
        let res: serde_json::Value = reqwest::Client::new().post("https://api.paystack.co/transaction/initialize")
            .bearer_auth(key).json(&body).send().await.map_err(gw)?.json().await.map_err(gw)?;
        b.pay_url = res["data"]["authorization_url"].as_str().ok_or_else(|| gw(res["message"].to_string()))?.into();
    } else {
        b.paid_at = chrono::Utc::now().to_rfc3339(); // demo mode, no Paystack key
    }
    s.bookings.lock().unwrap().push(b.clone());
    Ok(Json(b))
}
fn ps_key() -> Option<String> { std::env::var("PAYSTACK_SECRET_KEY").ok().filter(|k| !k.is_empty()) }
fn gw(e: impl ToString) -> E { (StatusCode::BAD_GATEWAY, e.to_string()) }

/// With Paystack, the receipt is rebuilt from the verified transaction, so it works on any Lambda instance.
async fn get_booking(State(s): S, Path(id): Path<String>) -> Result<Json<Booking>, E> {
    if let Some(key) = ps_key() {
        let res: serde_json::Value = reqwest::Client::new().get(format!("https://api.paystack.co/transaction/verify/{id}"))
            .bearer_auth(key).send().await.map_err(gw)?.json().await.map_err(gw)?;
        let d = &res["data"];
        if !d.is_object() { return Err((StatusCode::NOT_FOUND, "receipt not found".into())); }
        let mut b: Booking = serde_json::from_value(d["metadata"].clone()).map_err(gw)?;
        b.paid_at = if d["status"] == "success" { d["paid_at"].as_str().unwrap_or_default().into() } else { String::new() };
        return Ok(Json(b));
    }
    s.bookings.lock().unwrap().iter().find(|b| b.id == id).cloned().map(Json).ok_or((StatusCode::NOT_FOUND, "receipt not found".into()))
}

pub fn router() -> Router {
    let store = Arc::new(Store { rooms: Mutex::new(seed()), bookings: Mutex::new(vec![]) });
    Router::new()
        .route("/rooms", get(list).post(add_room))
        .route("/rooms/:id", get(get_room))
        .route("/reservations", axum::routing::post(book))
        .route("/reservations/:id", get(get_booking))
        .with_state(store)
}

#[cfg(test)]
mod tests {
    use super::quote;
    #[test] fn quotes_total() { assert_eq!(quote(65000, 2), Ok(130000)); }
    #[test] fn rejects_bad_nights() { assert!(quote(65000, 0).is_err()); assert!(quote(65000, 31).is_err()); }
    #[test] fn rejects_overflow() { assert!(quote(u32::MAX, 2).is_err()); }
}
