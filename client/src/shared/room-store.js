// Rooms live in server memory only, so remember their details locally. This
// lets the server recreate a room after a cold start or on another instance.
const key = room_id => `zdrop:room:${room_id}`;

export function saveRoom(room) {
  if (!room?.room_id) return;

  try {
    localStorage.setItem(key(room.room_id), JSON.stringify(room));
  } catch {
    // Storage can be unavailable (private mode / quota) — the room still works.
  }
}

export function getRoom(room_id) {
  if (!room_id) return null;

  try {
    return JSON.parse(localStorage.getItem(key(room_id)) ?? 'null');
  } catch {
    return null;
  }
}
