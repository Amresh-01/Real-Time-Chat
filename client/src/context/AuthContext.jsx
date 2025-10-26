import { createContext, useContext, useState } from "react";

// Create AuthContext with default values
const AuthContext = createContext({
  token: null,
  setToken: () => {},
});

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
