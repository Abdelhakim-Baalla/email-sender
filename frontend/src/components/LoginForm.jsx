import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';

const LoginForm = () => {
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, {
        credential: credentialResponse.credential
      });

      const { token, user } = response.data;
      login(token, user);
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '50px 40px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          width: '100%',
          maxWidth: '480px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            style={{ marginBottom: '24px' }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </motion.div>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a202c', marginBottom: '12px' }}>Email Sender</h1>
          <p style={{ color: '#4a5568', fontSize: '18px' }}>Automatisez vos candidatures professionnelles</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log('Erreur de connexion')}
            theme="outline"
            size="large"
            text="signin_with"
            locale="fr"
            width="350"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#4a5568' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Connexion sécurisée avec Google</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#4a5568' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Vos données sont protégées</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;