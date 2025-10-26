import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../api/api.js";
import axios from "axios";

export default function Rooms() {
  const [rooms, setRooms] = useState([]); // ✅ always initialize as array
  const [RoomName, setRoomName] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchRooms();
  }, [token]);

  // ✅ Fetch all rooms safely
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/rooms/getRooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Rooms API response:", res.data);

      // ✅ handle both response shapes
      const fetchedRooms = Array.isArray(res.data.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setRooms(fetchedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      if (error.response?.status === 401) {
        alert("Unauthorized - login again");
      }
    }
  };

  // ✅ Create new room
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
      await fetchRooms(); // refresh list
    } catch (error) {
      console.error("Error creating room:", error);
      if (error.response?.status === 401) alert("Unauthorized - login again");
    }
  };

  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
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
              onClick={() => handleRoomClick(room._id)}
              className="cursor-pointer p-4 bg-white rounded-md shadow hover:bg-blue-50 transition-colors duration-200 flex justify-between items-center"
            >
              <span className="text-gray-800 font-medium">{room.RoomName}</span>
              <span className="text-gray-400 text-sm">Enter →</span>
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
