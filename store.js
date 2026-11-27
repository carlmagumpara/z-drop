/**
 * Ephemeral, process-local state.
 *
 * This replaces the Redis dependency: nothing here is persisted or shared
 * between function instances. On a cold start / redeploy all state is empty.
 */

const MAX_MESSAGES_PER_ROOM = 500;
const PASSWORD_GRANT_TTL_MS = 60 * 60 * 60 * 1000; // same 60*60*60s as the old Redis key

const rooms = new Map();
const messagesByRoom = new Map();
const passwordGrants = new Map();
const knownUsers = new Set();
let filesCounter = 0;

const grantKey = (userId, roomId) => `${userId}::${roomId}`;

export function createRoom(data) {
  const room_id = String(data?.room_id ?? '').trim();
  if (!room_id) throw new Error('room_id is required');

  // A recreated room must not inherit password grants from the previous one.
  for (const key of passwordGrants.keys()) {
    if (key.endsWith(`::${room_id}`)) passwordGrants.delete(key);
  }

  const room = { ...data, room_id, created_at: Date.now() };
  rooms.set(room_id, room);
  if (!messagesByRoom.has(room_id)) messagesByRoom.set(room_id, []);

  return room;
}

export function getRoom(room_id) {
  return rooms.get(room_id);
}

export function getMessages(room_id) {
  return [...(messagesByRoom.get(room_id) ?? [])];
}

export function addMessage(room_id, message) {
  const messages = messagesByRoom.get(room_id) ?? [];
  messages.push(message);

  if (messages.length > MAX_MESSAGES_PER_ROOM) {
    messages.splice(0, messages.length - MAX_MESSAGES_PER_ROOM);
  }

  messagesByRoom.set(room_id, messages);
  return message;
}

export function updateMessage(room_id, message_id, updater) {
  const messages = messagesByRoom.get(room_id);
  if (!messages) return null;

  const index = messages.findIndex(message => message?.id === message_id);
  if (index === -1) return null;

  messages[index] = updater(messages[index]);
  return messages[index];
}

export function incrementFiles() {
  filesCounter += 1;
  return filesCounter;
}

export function getFilesCount() {
  return filesCounter;
}

export function markUserOnline(userId) {
  if (userId) knownUsers.add(userId);
}

export function getUserCount() {
  return knownUsers.size;
}

export function grantRoomAccess(userId, roomId) {
  passwordGrants.set(grantKey(userId, roomId), Date.now() + PASSWORD_GRANT_TTL_MS);
}

export function hasRoomAccess(userId, roomId) {
  const key = grantKey(userId, roomId);
  const expiresAt = passwordGrants.get(key);

  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    passwordGrants.delete(key);
    return false;
  }

  return true;
}

export function getStats() {
  return {
    rooms: rooms.size,
    messages: [...messagesByRoom.values()].reduce((total, list) => total + list.length, 0),
    users: knownUsers.size,
    files: filesCounter,
  };
}
