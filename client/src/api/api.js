import axios from "axios";

export const API_BASE_URL = "http://localhost:8080/api";

// Signup
export const signup = (data) => {
  return axios.post(`${API_BASE_URL}/auth/register`, data, {
    withCredentials: true,
  });
};

// Login
export const login = (data) => {
  return axios.post(`${API_BASE_URL}/auth/login`, data, {
    withCredentials: true,
  });
};

// Create Room
export const createRoom = (data, token) => {
  return axios.post(`${API_BASE_URL}/rooms/createRoom`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get Rooms
export const getRooms = (token) => {
  return axios.get(`${API_BASE_URL}/rooms/getRooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
