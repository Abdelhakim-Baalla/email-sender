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

      onClose();
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-6">
              <img src={user?.picture} alt="Profile" className="w-12 h-12 rounded-full mr-4" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/votre-profil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio
                </label>
                <input
                  type="url"
                  value={profile.portfolio}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://votre-portfolio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CV (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {cvFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {cvFile.name}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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