import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { roomId } = useParams();
  const { token } = useAuth();
  console.log(" Token in Chat:", token);

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 
  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/getCurrentUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.data);
      } catch (err) {
        console.error(
          "❌ Failed to fetch user:",
          err.response?.data || err.message
        );
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [token]);

  
  useEffect(() => {
    if (!roomId || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.data.reverse());
      } catch (err) {
        console.error(" Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [roomId, token]);

 
  useEffect(() => {
    if (!roomId || !token) return;

    const socket = io("http://localhost:8080", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to backend:", socket.id);
      socket.emit("join_room", roomId);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { message: msg, system: true }]);
    });

    socket.on("user_joined", (data) => {
      setMessages((prev) => [...prev, { message: data.message, system: true }]);
    });

    socket.on("user_left", (data) => {
      setMessages((prev) => [...prev, { message: data.message, system: true }]);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
    };
  }, [roomId, token]);

  // ✅ Send message
  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { roomId, message });
    setMessage("");
  };

  // ✅ Handle enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ✅ Show loading states
  if (loadingUser || loadingMessages)
    return (
      <div className="text-center mt-20 text-gray-600">
        Loading chat data...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Room: {roomId}</h2>
        <span className="text-gray-700">
          👤 {user ? user.username : "Fetching user..."}
        </span>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center italic mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) =>
            msg.system ? (
              <div key={idx} className="text-center text-gray-500 italic">
                {msg.message}
              </div>
            ) : (
              <div
                key={idx}
                className={`max-w-xs p-3 rounded-lg ${
                  msg.sender?._id === user?._id
                    ? "bg-blue-500 text-white self-end ml-auto"
                    : "bg-gray-200 text-gray-800 self-start"
                }`}
              >
                <div>{msg.message}</div>
              </div>
            )
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="bg-white p-4 flex gap-2 border-t">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-full"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim()}
          className={`px-6 py-2 rounded-full text-white font-semibold ${
            message.trim()
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
