import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hostelcare_token') || null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchNotificationsCount(token);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsCount = async (jwtToken) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${jwtToken || token}` }
      });
      if (res.ok) {
        const notifications = await res.json();
        const unread = notifications.filter(n => !n.is_read).length;
        setUnreadNotifications(unread);
      }
    } catch (e) {
      // Ignore background notification error
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('hostelcare_token', data.token);
    setToken(data.token);
    setUser(data.user);
    fetchNotificationsCount(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('hostelcare_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        unreadNotifications,
        fetchNotificationsCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
