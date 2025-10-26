import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { roomId } = useParams();
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    if (!token) return;

    const getCurrentUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/getCurrentUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    getCurrentUser();
  }, [token]);

  // Fetch initial messages for the room
  useEffect(() => {
    if (!roomId || !token) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.data.reverse() || []); // reverse to show oldest first
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId, token]);

  // Socket.IO connection
  useEffect(() => {
    if (!roomId || !user || !token) return;

    const SOCKET_URL = API_BASE_URL.replace("/api", "");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Join room
    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
      socket.emit("join_room", roomId);
    });

    // Receive message
    socket.on("receive_message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    // System messages
    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { message: msg, system: true }]);
    });
    socket.on("user_joined", (data) => {
      setMessages((prev) => [...prev, { message: data.message, system: true }]);
    });
    socket.on("user_left", (data) => {
      setMessages((prev) => [...prev, { message: data.message, system: true }]);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
    };
  }, [roomId, user, token]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current?.connected) return;

    // Emit to backend with correct field names
    socketRef.current.emit("send_message", {
      roomId,
      message: message.trim(),
    });

    // Optimistically add your own message
    setMessages((prev) => [
      ...prev,
      {
        message: message.trim(),
        sender: { _id: user._id, username: "You" },
        createdAt: new Date(),
      },
    ]);

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-gray-600">Loading messages...</div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Chat Room: {roomId}
        </h2>
        <span className="text-gray-600">User: {user?.username}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.system) {
              return (
                <div key={idx} className="text-center text-gray-400 italic">
                  {msg.message}
                </div>
              );
            }
            const isOwnMessage = msg.sender?._id === user?._id;
            return (
              <div
                key={idx}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 flex items-center gap-2 border-t border-gray-300">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
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
