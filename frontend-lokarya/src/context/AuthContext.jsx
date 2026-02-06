import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (from LocalStorage)
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Login Function
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Save to storage
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      
      toast.success(`Welcome back, ${data.name}!`);
      
      // Redirect based on Role
      if (data.role === 'super_admin') navigate('/dashboard/super-admin');
      else if (data.role === 'ngo_admin') navigate('/dashboard/ngo');
      else if (data.role === 'local_authority') navigate('/dashboard/authority');
      else navigate('/dashboard/user'); // Regular user dashboard
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  // Register Function
  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      
      // Check if verified (NGOs start as unverified)
      if (!data.isVerified) {
        toast.info("Registration successful! Please wait for Admin approval.");
        navigate('/login');
      } else {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        toast.success("Account created!");
        navigate('/dashboard/user');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;