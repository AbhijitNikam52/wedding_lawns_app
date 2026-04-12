import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect to Socket.io server when user logs in
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("🔌 Socket connected:", newSocket.id);
      });

      setSocket(newSocket);

      // Disconnect when user logs out
      return () => {
        newSocket.disconnect();
        console.log("❌ Socket disconnected");
      };
    } else {
      // Not authenticated — make sure socket is null
      setSocket(null);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
