mod checkin;
mod pms;

use axum::{extract::{Query, State}, http::StatusCode, routing::{get, post}, Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{env, sync::Arc};

#[derive(Clone)]
struct AppState { pms: Arc<dyn pms::Pms>, db: sqlx::PgPool }

type Res = Result<Json<Value>, (StatusCode, Json<Value>)>;
fn err(c: StatusCode, m: impl ToString) -> (StatusCode, Json<Value>) { (c, Json(json!({"error": m.to_string()}))) }

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let db = sqlx::PgPool::connect(&env::var("DATABASE_URL").expect("DATABASE_URL")).await.expect("db");
    sqlx::migrate!().run(&db).await.expect("migrate");
    let state = AppState { pms: Arc::new(pms::MockPms::seeded()), db };
    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/token", get(token))
        .route("/bookings", get(find_booking))
        .route("/checkin", post(check_in))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(state);
    let addr = format!("0.0.0.0:{}", env::var("PORT").unwrap_or("8080".into()));
    axum::serve(tokio::net::TcpListener::bind(&addr).await.unwrap(), app).await.unwrap();
}

#[derive(Deserialize)]
struct TokenQ { identity: String, room: String }

async fn token(Query(q): Query<TokenQ>) -> Res {
    let (key, secret) = (env::var("LIVEKIT_API_KEY").unwrap_or_default(), env::var("LIVEKIT_API_SECRET").unwrap_or_default());
    let now = chrono::Utc::now().timestamp();
    let claims = json!({"iss": key, "sub": q.identity, "nbf": now, "exp": now + 3600,
        "video": {"roomJoin": true, "room": q.room, "canPublish": true, "canSubscribe": true}});
    let t = jsonwebtoken::encode(&Default::default(), &claims, &jsonwebtoken::EncodingKey::from_secret(secret.as_bytes()))
        .map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(json!({"token": t, "url": env::var("LIVEKIT_URL").unwrap_or_default()})))
}

#[derive(Deserialize)]
struct FindQ { reference: Option<String>, last_name: Option<String> }

async fn find_booking(State(s): State<AppState>, Query(q): Query<FindQ>) -> Res {
    s.pms.find_booking(q.reference.as_deref(), q.last_name.as_deref()).await
        .map(|b| Json(json!(b))).ok_or(err(StatusCode::NOT_FOUND, "booking not found"))
}

#[derive(Deserialize)]
struct CheckInReq { reference: String }

async fn check_in(State(s): State<AppState>, Json(r): Json<CheckInReq>) -> Res {
    let b = s.pms.find_booking(Some(&r.reference), None).await.ok_or(err(StatusCode::NOT_FOUND, "booking not found"))?;
    let room = checkin::assign_room(&b, &s.pms.rooms().await, chrono::Utc::now().date_naive())
        .map_err(|e| err(StatusCode::CONFLICT, e))?;
    s.pms.mark_checked_in(&b.reference, &room).await.map_err(|e| err(StatusCode::BAD_GATEWAY, e))?;
    sqlx::query("INSERT INTO check_ins (id, booking_ref, guest_name, room_number) VALUES ($1,$2,$3,$4)")
        .bind(uuid::Uuid::new_v4()).bind(&b.reference).bind(&b.guest_name).bind(&room)
        .execute(&s.db).await.map_err(|e| err(StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(json!({"guest_name": b.guest_name, "room_number": room})))
}
