const API_URL = "/api/auth";

//  Login User
export async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please fill all fields");

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      //  Store token + username (you return both from backend)
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("username", data.user?.username || data.username);

      // Redirect to chat page
      window.location.href = "chat.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Error connecting to server");
  }
}

// Register User
export async function registerUser(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !email || !password) return alert("Please fill all fields");

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(" Registration successful! Please login now.");
      window.location.href = "index.html";
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error("Register error:", err);
    alert("Error connecting to server");
  }
}

//  Logout User
export async function logoutUser() {
  const token = getToken();
  if (!token) return;

  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Clear session storage and redirect
    sessionStorage.clear();
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
  }
}

//  Helpers
export function getToken() {
  return sessionStorage.getItem("token");
}

export function getUsername() {
  return sessionStorage.getItem("username");
}
