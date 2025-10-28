import { getToken } from "./auth.js";
import { initSocket, joinRoom as socketJoinRoom, socket } from "./socket.js";

const API_URL = "http://localhost:8080/api"; // ✅ base API URL
export let currentRoomId = null;
export let joinedRoom = false;

// ✅ Initialize chat page
export async function initChatPage() {
  initSocket();
  await loadRooms();
}

// ✅ Load all rooms for logged-in user
export async function loadRooms() {
  const token = getToken();
  const res = await fetch(`${API_URL}/rooms/getRooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Failed to load rooms");
    return;
  }

  const rooms = data.data || []; // depending on your controller’s response
  const roomsList = document.getElementById("roomsList");
  roomsList.innerHTML = "";

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.textContent = room.RoomName;
    li.dataset.id = room._id;

    // ✅ Delete button for the room
    const delBtn = document.createElement("button");
    delBtn.classList.add("delete-btn");
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete room "${room.RoomName}"?`)) return;
      await deleteRoom(room._id);
    };

    li.appendChild(delBtn);

    li.onclick = () => {
      joinRoom(room._id);
      document.getElementById("currentRoom").textContent = room.RoomName;
    };

    roomsList.appendChild(li);
  });
}

// ✅ Create a new room
export async function createRoom() {
  const name = document.getElementById("newRoom").value.trim();
  if (!name) return alert("Enter a room name");

  const token = getToken();
  const res = await fetch(`${API_URL}/rooms/createRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ RoomName: name }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Room created successfully!");
    document.getElementById("newRoom").value = "";
    await loadRooms();
  } else {
    alert(data.message || "Failed to create room");
  }
}

// ✅ Delete a room
export async function deleteRoom(roomId) {
  const token = getToken();

  const res = await fetch(`${API_URL}/rooms/deleteRoom/${roomId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (res.ok) {
    alert("Room deleted successfully!");
    await loadRooms();
  } else {
    alert(data.message || "Failed to delete room");
  }
}

// ✅ Join a room
export function joinRoom(roomId) {
  currentRoomId = roomId;
  joinedRoom = false;

  document.getElementById("messages").innerHTML = "";
  const btn = document.getElementById("joinLeaveBtn");
  btn.disabled = false;
  btn.textContent = "Join";
}

// ✅ Handle Join / Leave button
document.getElementById("joinLeaveBtn").addEventListener("click", async () => {
  if (!currentRoomId) return alert("Select a room first");

  if (!joinedRoom) {
    socket.emit("join_room", currentRoomId);
    joinedRoom = true;
    document.getElementById("joinLeaveBtn").textContent = "Leave";
    await loadRoomMessages(currentRoomId);
  } else {
    socket.emit("leave_room", currentRoomId);
    joinedRoom = false;
    document.getElementById("joinLeaveBtn").textContent = "Join";
    document.getElementById("messages").innerHTML = "";
  }
});

// ✅ Load all messages for a room
export async function loadRoomMessages(roomId) {
  const token = getToken();

  const res = await fetch(`${API_URL}/messages/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Failed to load messages");
    return;
  }

  const messages = data.data || [];
  const messagesUL = document.getElementById("messages");
  messagesUL.innerHTML = "";

  messages.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = `${msg.sender.username}: ${msg.message}`;
    messagesUL.appendChild(li);
  });

  messagesUL.scrollTop = messagesUL.scrollHeight;
}

// ✅ For button onclick in HTML
window.createRoom = createRoom;
