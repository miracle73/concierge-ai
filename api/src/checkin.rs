use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum Status { Confirmed, CheckedIn, Cancelled }

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Booking {
    pub reference: String,
    pub guest_name: String,
    pub arrival: NaiveDate,
    pub departure: NaiveDate,
    pub room_type: String,
    pub status: Status,
    pub room_number: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Room { pub number: String, pub room_type: String, pub clean: bool, pub occupied: bool }

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum CheckInError {
    #[error("booking not found")] NotFound,
    #[error("booking already checked in")] AlreadyCheckedIn,
    #[error("booking cancelled")] Cancelled,
    #[error("check-in not allowed on this date")] WrongDate,
    #[error("no room available")] NoRoom,
}

/// Validate booking and pick a room. Pure logic, no IO.
pub fn assign_room(b: &Booking, rooms: &[Room], today: NaiveDate) -> Result<String, CheckInError> {
    match b.status {
        Status::CheckedIn => return Err(CheckInError::AlreadyCheckedIn),
        Status::Cancelled => return Err(CheckInError::Cancelled),
        Status::Confirmed => {}
    }
    if today < b.arrival || today >= b.departure { return Err(CheckInError::WrongDate); }
    rooms.iter()
        .find(|r| r.room_type == b.room_type && r.clean && !r.occupied)
        .map(|r| r.number.clone())
        .ok_or(CheckInError::NoRoom)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn d(s: &str) -> NaiveDate { s.parse().unwrap() }
    fn booking(st: Status) -> Booking {
        Booking { reference: "ABC".into(), guest_name: "Ann".into(), arrival: d("2026-11-11"),
            departure: d("2026-11-13"), room_type: "king".into(), status: st, room_number: None }
    }
    fn room(n: &str, t: &str, clean: bool, occ: bool) -> Room {
        Room { number: n.into(), room_type: t.into(), clean, occupied: occ }
    }

    #[test] fn assigns_clean_free_matching_room() {
        let rooms = [room("101","king",false,false), room("102","queen",true,false), room("103","king",true,false)];
        assert_eq!(assign_room(&booking(Status::Confirmed), &rooms, d("2026-11-11")), Ok("103".into()));
    }
    #[test] fn rejects_already_checked_in() {
        assert_eq!(assign_room(&booking(Status::CheckedIn), &[], d("2026-11-11")), Err(CheckInError::AlreadyCheckedIn));
    }
    #[test] fn rejects_cancelled() {
        assert_eq!(assign_room(&booking(Status::Cancelled), &[], d("2026-11-11")), Err(CheckInError::Cancelled));
    }
    #[test] fn rejects_early_or_after_departure() {
        let b = booking(Status::Confirmed);
        assert_eq!(assign_room(&b, &[], d("2026-11-10")), Err(CheckInError::WrongDate));
        assert_eq!(assign_room(&b, &[], d("2026-11-13")), Err(CheckInError::WrongDate));
    }
    #[test] fn no_room() {
        let rooms = [room("101","king",true,true)];
        assert_eq!(assign_room(&booking(Status::Confirmed), &rooms, d("2026-11-11")), Err(CheckInError::NoRoom));
    }
}
