use crate::checkin::{Booking, Room, Status};
use async_trait::async_trait;
use chrono::{Duration, Utc};
use std::sync::Mutex;

#[async_trait]
pub trait Pms: Send + Sync {
    async fn find_booking(&self, reference: Option<&str>, last_name: Option<&str>) -> Option<Booking>;
    async fn rooms(&self) -> Vec<Room>;
    async fn mark_checked_in(&self, reference: &str, room: &str) -> anyhow_like::Result;
}

pub mod anyhow_like { pub type Result = std::result::Result<(), String>; }

pub struct MockPms { bookings: Mutex<Vec<Booking>>, rooms: Mutex<Vec<Room>> }

impl MockPms {
    pub fn seeded() -> Self {
        let t = Utc::now().date_naive();
        let b = |r: &str, n: &str, ty: &str| Booking { reference: r.into(), guest_name: n.into(), arrival: t,
            departure: t + Duration::days(2), room_type: ty.into(), status: Status::Confirmed, room_number: None };
        let r = |n: &str, ty: &str| Room { number: n.into(), room_type: ty.into(), clean: true, occupied: false };
        Self {
            bookings: Mutex::new(vec![b("ABC123", "John Smith", "king"), b("XYZ789", "Maria Garcia", "queen")]),
            rooms: Mutex::new(vec![r("101", "king"), r("102", "queen"), r("201", "king")]),
        }
    }
}

#[async_trait]
impl Pms for MockPms {
    async fn find_booking(&self, reference: Option<&str>, last_name: Option<&str>) -> Option<Booking> {
        self.bookings.lock().unwrap().iter().find(|b| {
            reference.map_or(false, |r| b.reference.eq_ignore_ascii_case(r))
                || last_name.map_or(false, |l| b.guest_name.to_lowercase().ends_with(&l.to_lowercase()))
        }).cloned()
    }
    async fn rooms(&self) -> Vec<Room> { self.rooms.lock().unwrap().clone() }
    async fn mark_checked_in(&self, reference: &str, room: &str) -> anyhow_like::Result {
        let mut bs = self.bookings.lock().unwrap();
        let b = bs.iter_mut().find(|b| b.reference == reference).ok_or("not found")?;
        b.status = Status::CheckedIn;
        b.room_number = Some(room.into());
        if let Some(r) = self.rooms.lock().unwrap().iter_mut().find(|r| r.number == room) { r.occupied = true; }
        Ok(())
    }
}
