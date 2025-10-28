import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../api/api.js";
import axios from "axios";

export default function Rooms() {
  const [rooms, setRooms] = useState([]); 
  const [RoomName, setRoomName] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchRooms();
  }, [token]);

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/rooms/getRooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedRooms = Array.isArray(res.data.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setRooms(fetchedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      if (error.response?.status === 401) alert("Unauthorized - login again");
    }
  };

  // Create new room
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!RoomName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/rooms/createRoom`,
        { RoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoomName("");
      await fetchRooms();
    } catch (error) {
      console.error("Error creating room:", error);
      if (error.response?.status === 401) alert("Unauthorized - login again");
    }
  };

  // Navigate to chat room
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  
  const handleDelete = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/rooms/deleteRoom/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRooms(); // refresh list after delete
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Chat Rooms</h1>

      <div className="w-full max-w-md flex mb-6 space-x-2">
        <input
          value={RoomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter new room name"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-200"
        >
          Create
        </button>
      </div>

      <ul className="w-full max-w-md space-y-2">
        {Array.isArray(rooms) && rooms.length > 0 ? (
          rooms.map((room) => (
            <li
              key={room._id}
              className="p-4 bg-white rounded-md shadow flex justify-between items-center hover:bg-blue-50 transition-colors duration-200"
            >
              <span
                className="text-gray-800 font-medium cursor-pointer"
                onClick={() => handleRoomClick(room._id)}
              >
                {room.RoomName}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(room._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                >
                  Delete
                </button>
                <span
                  className="text-gray-400 text-sm cursor-pointer"
                  onClick={() => handleRoomClick(room._id)}
                >
                  Enter →
                </span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center text-gray-500 py-4 bg-white rounded-md shadow-sm">
            No rooms yet. Create one!
          </li>
        )}
      </ul>
    </div>
  );
}
