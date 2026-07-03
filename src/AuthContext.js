import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [isDonor, setIsDonor] = useState(false);
  const [isReceiver, setIsReceiver] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRider, setIsRider] = useState(false);
  const [accountStatus, setAccountStatus] = useState('Pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username') || sessionStorage.getItem('username');
    const savedIsDonor = localStorage.getItem('isDonor') === 'true' || sessionStorage.getItem('isDonor') === 'true';
    const savedIsReceiver = localStorage.getItem('isReceiver') === 'true' || sessionStorage.getItem('isReceiver') === 'true';
    const savedIsAdmin = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
    const savedIsRider = localStorage.getItem('isRider') === 'true' || sessionStorage.getItem('isRider') === 'true';
    const savedAccountStatus = localStorage.getItem('accountStatus') || sessionStorage.getItem('accountStatus') || 'Pending';

    if (savedToken) {
      setToken(savedToken);
      setUsername(savedUsername || '');
      setIsDonor(savedIsDonor);
      setIsReceiver(savedIsReceiver);
      setIsAdmin(savedIsAdmin);
      setIsRider(savedIsRider);
      setAccountStatus(savedAccountStatus);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (authToken, userEmail, userIsDonor, userIsReceiver, userIsAdmin = false, userIsRider = false, userAccountStatus = 'Pending', rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('authToken', authToken);
    storage.setItem('token', authToken);
    storage.setItem('username', userEmail);
    storage.setItem('isDonor', String(userIsDonor));
    storage.setItem('isReceiver', String(userIsReceiver));
    storage.setItem('isAdmin', String(userIsAdmin));
    storage.setItem('isRider', String(userIsRider));
    storage.setItem('accountStatus', userAccountStatus);

    setToken(authToken);
    setUsername(userEmail);
    setIsDonor(userIsDonor);
    setIsReceiver(userIsReceiver);
    setIsAdmin(userIsAdmin);
    setIsRider(userIsRider);
    setAccountStatus(userAccountStatus);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isDonor');
    localStorage.removeItem('isReceiver');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isRider');
    localStorage.removeItem('accountStatus');

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('isDonor');
    sessionStorage.removeItem('isReceiver');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isRider');
    sessionStorage.removeItem('accountStatus');

    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');

    setToken(null);
    setUsername('');
    setIsDonor(false);
    setIsReceiver(false);
    setIsAdmin(false);
    setIsRider(false);
    setAccountStatus('Pending');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, username, isDonor, isReceiver, isAdmin, isRider, accountStatus, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
