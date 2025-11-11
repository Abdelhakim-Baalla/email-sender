import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';

export default function GoogleAuth({ onSuccess, onError }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gradient-hero)',
        padding: 'var(--space-4)'
      }}
    >
      <motion.div
        className="glass"
        style={{
          padding: 'var(--space-8)',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center'
        }}
        whileHover={{ scale: 1.02 }}
      >
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{ 
            width: '80px', 
            height: '80px', 
            objectFit: 'contain',
            margin: '0 auto var(--space-4)'
          }} 
        />
        
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: 'var(--space-2)',
          color: 'var(--color-text)'
        }}>
          Email Sender
        </h1>
        
        <p style={{ 
          color: 'var(--color-text-soft)', 
          marginBottom: 'var(--space-6)',
          fontSize: '1rem'
        }}>
          Connectez-vous avec Google pour commencer à envoyer vos candidatures
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>
        
        <p style={{ 
          color: 'var(--color-text-soft)', 
          marginTop: 'var(--space-6)',
          fontSize: '0.875rem'
        }}>
          🔒 Vos données sont sécurisées et privées
        </p>
      </motion.div>
    </motion.div>
  );
}
