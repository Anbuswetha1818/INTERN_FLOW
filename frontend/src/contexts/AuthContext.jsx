/**
 * SIMS — Auth Context
 * Manages token, user info, login/logout state across the app.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [user, setUser] = useState({
    username: sessionStorage.getItem('username') || '',
    email: sessionStorage.getItem('email') || '',
    role: sessionStorage.getItem('role') || '',
    empId: sessionStorage.getItem('empId') || '',
    fullName: sessionStorage.getItem('fullName') || '',
    entityId: sessionStorage.getItem('entityId') || '',
    entityName: sessionStorage.getItem('entityName') || '',
    photo: sessionStorage.getItem('photo') || '',
  });
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token;

  // Fetch permissions and latest user profile on mount if authenticated
  useEffect(() => {
    if (token) {
      Promise.all([
        authAPI.permissions(),
        authAPI.me()
      ])
      .then(([permRes, meRes]) => {
        setPermissions(permRes.data);
        const latestPhoto = meRes.data.photo || '';
        const email = meRes.data.email || '';
        const entityName = meRes.data.entity_name || '';
        sessionStorage.setItem('photo', latestPhoto);
        sessionStorage.setItem('email', email);
        sessionStorage.setItem('entityName', entityName);
        setUser(prev => ({ ...prev, photo: latestPhoto, email, entityName, projects_info: meRes.data.projects_info || [] }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = useCallback(async () => {
    try {
      const meRes = await authAPI.me();
      const latestPhoto = meRes.data.photo || '';
      const email = meRes.data.email || '';
      const entityName = meRes.data.entity_name || '';
      sessionStorage.setItem('photo', latestPhoto);
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('entityName', entityName);
      setUser(prev => ({ ...prev, photo: latestPhoto, email, entityName, projects_info: meRes.data.projects_info || [] }));
    } catch (e) {
      console.error(e);
    }
  }, []);


  const login = useCallback(async (username, password) => {
    const res = await authAPI.login({ username, password });
    const data = res.data;

    if (res.status === 202 || data.message === 'OTP required') {
      return data;
    }

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('username', data.username);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('empId', data.emp_id);
    sessionStorage.setItem('fullName', data.full_name);
    sessionStorage.setItem('entityId', data.entity_id || '');
    sessionStorage.setItem('entityName', data.entity_name || '');
    if (data.email) sessionStorage.setItem('email', data.email);

    setToken(data.token);
    setUser({
      username: data.username,
      role: data.role,
      empId: data.emp_id,
      fullName: data.full_name,
      entityId: data.entity_id,
      entityName: data.entity_name || '',
      photo: sessionStorage.getItem('photo') || '',
    });

    try {
      const permRes = await authAPI.permissions();
      setPermissions(permRes.data);
    } catch (e) {}

    return data;
  }, []);

  const verifyLoginOTP = useCallback(async (userId, otp) => {
    const res = await authAPI.verifyLoginOTP({ user_id: userId, otp });
    const data = res.data;

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('username', data.username);
    sessionStorage.setItem('role', data.role);
    sessionStorage.setItem('empId', data.emp_id);
    sessionStorage.setItem('fullName', data.full_name);
    sessionStorage.setItem('entityId', data.entity_id || '');
    if (data.email) sessionStorage.setItem('email', data.email);

    setToken(data.token);
    setUser({
      username: data.username,
      email: data.email || '',
      role: data.role,
      empId: data.emp_id,
      fullName: data.full_name,
      entityId: data.entity_id,
    });

    try {
      const permRes = await authAPI.permissions();
      setPermissions(permRes.data);
    } catch (e) {}

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Silent fail
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('empId');
    sessionStorage.removeItem('fullName');
    sessionStorage.removeItem('entityId');
    sessionStorage.removeItem('photo');
    sessionStorage.removeItem('email');
    setToken(null);
    setUser({ username: '', email: '', role: '', empId: '', fullName: '', entityId: '', photo: '' });
    setPermissions({});
  }, []);

  return (
    <AuthContext.Provider value={{
      token, user, permissions, isAuthenticated, loading,
      login, verifyLoginOTP, logout, fetchMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
