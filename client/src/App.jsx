import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./components/Register.jsx";
import Login from "./components/Login.jsx";
import Rooms from "./components/Rooms.jsx";
import Chat from "./components/Chat.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/chat/:roomId" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
