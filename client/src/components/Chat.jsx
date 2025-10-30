import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL } from "../api/api.js";

export default function Chat() {
  const { roomId } = useParams();
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const token = localStorage.getItem("token"); // ✅ fetch saved token

  // ✅ Fetch current logged-in user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/getCurrentUser`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (token) getCurrentUser();
  }, [token]);

  // ✅ Fetch chat messages
  useEffect(() => {
    if (!roomId || !token) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/messages/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(res.data.data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, token]);

  // ✅ Setup socket connection
  useEffect(() => {
    if (!roomId || !user) return;

    const SOCKET_URL = API_BASE_URL.replace("/api", "");
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token }, // ✅ send token in socket handshake
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinRoom", roomId);
    });

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, user, token]);

  // ✅ Send message
  const sendMessage = () => {
    if (!message.trim() || !user || !socketRef.current) return;

    const messageData = { roomId, message: message.trim(), sender: user._id };
    socketRef.current.emit("sendMessage", messageData);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-gray-600">Loading messages...</div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Chat Room: {roomId}
        </h2>
        <span className="text-gray-600">User: {user?.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender._id === user?._id;
            return (
              <div
                key={msg._id}
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl border ${
                  isOwnMessage
                    ? "bg-blue-600 text-white self-end"
                    : "bg-gray-200 text-gray-800 self-start"
                } flex flex-col`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">
                    {isOwnMessage ? "You" : msg.sender.username}
                  </span>
                  <small className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
                <div>{msg.message}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white p-4 flex items-center gap-2 border-t border-gray-300">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className={`px-6 py-2 rounded-full text-white font-semibold transition-colors ${
            message.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
