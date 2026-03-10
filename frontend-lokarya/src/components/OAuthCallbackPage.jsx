import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); 

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=no_token');
      return;
    }

    api.post('/auth/oauth-exchange', { token })
      .then(res => {
        login(res.data);          // ✅ set user in AuthContext
        window.location.href = '/'; // ✅ full reload to sync all state
      })
      .catch(() => {
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return (
    <div style={{
      display:        'flex',
      justifyContent: 'center',
      alignItems:     'center',
      height:         '100vh',
      flexDirection:  'column',
      gap:            '12px',
    }}>
      <p style={{ fontSize: '18px' }}>Signing you in...</p>
      <p style={{ color: '#888', fontSize: '14px' }}>Please wait</p>
    </div>
  );
};

export default OAuthCallbackPage;