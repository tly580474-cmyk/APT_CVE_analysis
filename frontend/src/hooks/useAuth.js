import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    setIsLoggedIn(!!token);

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      } catch {
        setUser(null);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [checkAuth]);

  return { isLoggedIn, isAdmin, user, checkAuth };
};

export default useAuth;
