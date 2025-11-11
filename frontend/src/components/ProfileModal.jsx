import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({
    phone: '',
    linkedin: '',
    portfolio: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.personalInfo || {});
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/auth/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Sauvegarder dans localStorage pour le formulaire
      localStorage.setItem('personalInfo', JSON.stringify({
        portfolioUrl: profile.portfolio,
        linkedinUrl: profile.linkedin,
        phoneNumber: profile.phone
      }));
      
      // Récupérer le nouveau chemin du CV
      const profileData = await axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileData.data.cvPath) {
        localStorage.setItem('userCvPath', profileData.data.cvPath);
      }

      if (cvFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/upload-cv`, {
              fileName: cvFile.name,
              content: reader.result
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (error) {
            console.error('Erreur upload CV:', error);
          }
        };
        reader.readAsDataURL(cvFile);
      }

      // Recharger la page pour mettre à jour le formulaire
      window.location.reload();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setCvFile(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              background: 'var(--color-panel)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                marginRight: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={user?.picture} 
                  alt="Profile" 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '14px',
                    objectFit: 'cover'
                  }} 
                />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '4px' }}>
                  {user?.name}
                </h2>
                <p style={{ color: 'var(--color-text-soft)', fontSize: '14px' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  📱 Téléphone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'var(--color-panel-solid)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  💼 LinkedIn
                </label>
                <input
                  type="url"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/votre-profil"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'var(--color-panel-solid)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  🌐 Portfolio
                </label>
                <input
                  type="url"
                  value={profile.portfolio}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  placeholder="https://votre-portfolio.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'var(--color-panel-solid)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  📄 CV (PDF)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: '2px dashed var(--color-border)',
                      borderRadius: '10px',
                      background: 'var(--color-panel-solid)',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'var(--color-accent-soft)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-panel-solid)';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {cvFile ? `✓ ${cvFile.name}` : 'Cliquez pour uploader votre CV'}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid var(--color-border)',
                  borderRadius: '10px',
                  background: 'var(--color-panel-solid)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-accent-soft)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-panel-solid)'}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: loading ? 'var(--color-border)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;