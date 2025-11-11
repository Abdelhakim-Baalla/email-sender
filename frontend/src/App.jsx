import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import ProfileModal from './components/ProfileModal';
import SmtpConfigModal from './components/SmtpConfigModal';
import "./scripts.js";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4859";

const emptyForm = {
  company: "",
  position: "",
  to: "",
  location: "",
  flexibility: "",
  type_contrat: "",
  application_method: "",
  contact: "",
  apply_date: "",
  status: "",
  response_date: "",
  referral: "",
  interview_date: "",
  in_touch_person: "",
  salary_range: "",
  notes: "",
  portfolioUrl: "",
  linkedinUrl: "",
  phoneNumber: "",
};

function formatError(err) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.message) return err.message;
  return "Une erreur inconnue est survenue.";
}

function getStatusBadgeClass(status) {
  if (status === "sent") return "status-badge success";
  if (status === "failed") return "status-badge error";
  return "status-badge";
}

function AppContent({ setShowProfile, showProfile, showSmtpConfig, setShowSmtpConfig, smtpConfigured, setSmtpConfigured }) {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [applications, setApplications] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [cvName, setCvName] = useState("");
  const [limit, setLimit] = useState(1);
  const [delayMs, setDelayMs] = useState(1000);
  const [dryRun, setDryRun] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailValidation, setEmailValidation] = useState({ valid: true, count: 0 });
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailList, setEmailList] = useState([]);
  const [editingEmail, setEditingEmail] = useState(null);
  const [savedPersonalInfo, setSavedPersonalInfo] = useState(null);
  const { user, token, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (applications.length === 0) {
      setLimit(1);
    } else if (limit > applications.length) {
      setLimit(applications.length);
    }
  }, [applications.length, limit]);

  useEffect(() => {
    if (user && token) {
      checkFirstLogin();
    }
  }, [user, token]);

  const checkFirstLogin = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Vérifier si c'est la première connexion (pas d'infos personnelles)
      const isFirstLogin = !data.personalInfo?.phone && !data.personalInfo?.linkedin && !data.cvPath;
      
      // Sauvegarder le chemin du CV si disponible
      if (data.cvPath) {
        localStorage.setItem('userCvPath', data.cvPath);
      }
      
      if (isFirstLogin) {
        setShowProfile(true);
      } else {
        checkSmtpConfig();
      }
    } catch (error) {
      console.error('Erreur vérification profil:', error);
    }
  };

  const checkSmtpConfig = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/smtp-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSmtpConfigured(data.configured);
      if (!data.configured) {
        setShowSmtpConfig(true);
      }
    } catch (error) {
      console.error('Erreur vérification SMTP:', error);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {

    const savedInfo = localStorage.getItem('personalInfo');
    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      setSavedPersonalInfo(parsed);
      setFormData(prev => ({
        ...prev,
        portfolioUrl: parsed.portfolioUrl || import.meta.env.VITE_PORTFOLIO_URL || '',
        linkedinUrl: parsed.linkedinUrl || import.meta.env.VITE_LINKEDIN_URL || '',
        phoneNumber: parsed.phoneNumber || import.meta.env.VITE_PHONE_NUMBER || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        portfolioUrl: import.meta.env.VITE_PORTFOLIO_URL || '',
        linkedinUrl: import.meta.env.VITE_LINKEDIN_URL || '',
        phoneNumber: import.meta.env.VITE_PHONE_NUMBER || ''
      }));
    }
  }, [user]);

  const canSend = useMemo(
    () => applications.length > 0 && !sending,
    [applications.length, sending]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) return;
    
    if (!emailRegex.test(email)) {
      setError("Format d'email invalide");
      return;
    }
    
    if (emailList.includes(email)) {
      setError("Cet email existe déjà");
      return;
    }
    
    setEmailList([...emailList, email]);
    setEmailInput("");
    setError("");
  };

  const handleRemoveEmail = (email) => {
    setEmailList(emailList.filter(e => e !== email));
  };

  const handleEditEmail = (oldEmail, newEmail) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return;
    
    setEmailList(emailList.map(e => e === oldEmail ? newEmail : e));
    setEditingEmail(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setCvFile(null);
      setCvName("");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Le CV doit être un fichier PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCvFile({
        fileName: file.name,
        content: reader.result,
        contentType: file.type,
      });
      setCvName(file.name);
    };
    reader.onerror = () => {
      setError("Impossible de lire le fichier sélectionné.");
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setCvFile(null);
    setCvName("");
  };

  const savePersonalInfo = () => {
    const info = {
      portfolioUrl: formData.portfolioUrl,
      linkedinUrl: formData.linkedinUrl,
      phoneNumber: formData.phoneNumber
    };
    localStorage.setItem('personalInfo', JSON.stringify(info));
    setSavedPersonalInfo(info);
    setSuccessMessage('✓ Informations personnelles enregistrées');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleAddApplication = () => {
    setError("");
    setSuccessMessage("");

    if (emailList.length === 0) {
      setError("Ajoutez au moins un email");
      return;
    }

    const companyName = formData.company.trim() || emailList[0].split('@')[1].split('.')[0];

    // Utiliser le CV uploadé ou le CV du profil utilisateur
    const userCvPath = localStorage.getItem('userCvPath');
    
    const entry = {
      ...formData,
      company: companyName,
      to: emailList.join(', '),
      cvFile: cvFile,
      cvPath: userCvPath, // Ajouter le chemin du CV utilisateur
      createdAt: Date.now(),
    };

    setApplications((prev) => [...prev, entry]);
    setSuccessMessage(`✓ Candidature ajoutée avec succès (${emailList.length} email${emailList.length > 1 ? 's' : ''})`);
    
    if (formData.portfolioUrl || formData.linkedinUrl || formData.phoneNumber) {
      if (!savedPersonalInfo) {
        savePersonalInfo();
      }
    }
    
    resetForm();
    setEmailList([]);
    setFormData(prev => ({
      ...emptyForm,
      portfolioUrl: savedPersonalInfo?.portfolioUrl || import.meta.env.VITE_PORTFOLIO_URL || '',
      linkedinUrl: savedPersonalInfo?.linkedinUrl || import.meta.env.VITE_LINKEDIN_URL || '',
      phoneNumber: savedPersonalInfo?.phoneNumber || import.meta.env.VITE_PHONE_NUMBER || ''
    }));
  };

  const handleRemoveApplication = (index) => {
    setApplications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendBatch = async () => {
    if (!smtpConfigured && !dryRun) {
      setError('Veuillez configurer votre mot de passe d\'application Gmail');
      setShowSmtpConfig(true);
      return;
    }

    setError("");
    setSuccessMessage("");
    setResults([]);
    setSending(true);

    const payload = {
      applications: applications.map((item) => ({
        ...item,
        dryRun,
      })),
      limit,
      delayMs,
      dryRun,
    };

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/applications/send-batch`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setResults(data.results ?? []);
      if (data.successes) {
        setSuccessMessage(
          `${data.successes} e-mail(s) envoyé(s) avec succès${
            dryRun ? " (simulation)" : ""
          }.`
        );
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSending(false);
    }
  };



  const totalToSend = Math.min(limit, applications.length);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#" className="brand">
            <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <span className="brand__text">Email Sender</span>
          </a>
          <nav className="primary-nav">
            <button className="nav-link" onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}>
              New Application
            </button>
            <button className="nav-link" onClick={() => document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" })}>
              Queue
            </button>
            <button className="nav-link" onClick={() => document.getElementById("send-section")?.scrollIntoView({ behavior: "smooth" })}>
              Send
            </button>
          </nav>
          <div className="site-header__actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginRight: 'var(--space-3)' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile && setShowProfile(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-xs)'
                }}
              >
                <img 
                  src={user.picture} 
                  alt={user.name}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%',
                    border: '2px solid var(--color-accent)'
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text)', fontWeight: 500 }}>{user.name}</span>
              </motion.button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--color-error)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                marginRight: 'var(--space-2)'
              }}
            >
              Déconnexion
            </motion.button>
            
            <button 
              className="theme-toggle" 
              onClick={() => setDarkMode(!darkMode)} 
              aria-label="Toggle theme"
              data-theme-toggle
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {darkMode ? (
                  <>
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </>
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                )}
              </svg>
            </button>
            <button 
              className="nav-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              data-nav-toggle
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={`mobile-nav ${mobileMenuOpen ? 'is-open' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            data-nav-drawer
          >
            <motion.div
              className="mobile-nav__inner"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="mobile-nav__close" 
                onClick={() => setMobileMenuOpen(false)}
                data-nav-close
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div className="mobile-nav__groups">
                <div className="mobile-nav__group">
                  <div className="mobile-nav__label">Navigation</div>
                  <ul className="mobile-nav__list">
                    <li>
                      <button className="mobile-nav__link" onClick={() => { document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                        New Application
                      </button>
                    </li>
                    <li>
                      <button className="mobile-nav__link" onClick={() => { document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                        Queue
                      </button>
                    </li>
                    <li>
                      <button className="mobile-nav__link" onClick={() => { document.getElementById("send-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                        Send
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="mobile-nav__group">
                  <div className="mobile-nav__label">Settings</div>
                  <ul className="mobile-nav__list">
                    <li>
                      <button className="mobile-nav__link" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? "Light Mode" : "Dark Mode"}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-content">
        <motion.section
          className="hero"
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          data-reveal
        >
          <div className="hero__inner">
            <div className="hero__content">
              <div className="eyebrow">Professional Email Automation</div>
              <h1>Job Application Assistant</h1>
              <p>
                Automate professional email campaigns, attach your CV, and track everything in Excel with our premium dashboard.
              </p>
              <div className="hero__actions">
                <button className="btn btn--primary" onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}>
                  Get Started
                </button>
                <button className="btn btn--ghost" onClick={() => document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" })}>
                  View Queue
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <motion.div
                className="hero__media"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div style={{ textAlign: 'center' }}>
                  <svg className="hero__media-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                  <motion.div 
                    className="hero__media-value"
                    key={applications.length}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {applications.length}
                  </motion.div>
                  <div className="hero__media-label">En file</div>
                </div>
              </motion.div>
              
              <motion.div
                className="hero__media"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div style={{ textAlign: 'center' }}>
                  <svg className="hero__media-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <motion.div 
                    className="hero__media-value"
                    key={results.filter(r => r.status === 'sent').length}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {results.filter(r => r.status === 'sent').length}
                  </motion.div>
                  <div className="hero__media-label">Envoyés</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="form-section"
          className="section"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          data-reveal
        >
          <div className="section__header">
            <h2 className="section__title">New Application</h2>
            <div className="eyebrow">Add to Campaign</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowQuickFill(!showQuickFill)}
            style={{ fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}
          >
            {showQuickFill ? '✕ Fermer' : '⚡ Remplissage rapide'}
          </motion.button>

          <AnimatePresence>
            {showQuickFill && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-accent)' }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }} onClick={() => setFormData(prev => ({ ...prev, flexibility: 'Remote' }))}>🏠 Remote</button>
                  <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }} onClick={() => setFormData(prev => ({ ...prev, flexibility: 'Hybrid' }))}>🔄 Hybrid</button>
                  <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }} onClick={() => setFormData(prev => ({ ...prev, type_contrat: 'CDI' }))}>📝 CDI</button>
                  <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }} onClick={() => setFormData(prev => ({ ...prev, type_contrat: 'Freelance' }))}>💼 Freelance</button>
                  <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }} onClick={() => setFormData(prev => ({ ...prev, apply_date: new Date().toISOString().split('T')[0] }))}>📅 Aujourd'hui</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        <div className="form-grid">
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>Company</span>
              <small style={{ color: 'var(--color-text-soft)', fontSize: '0.7rem', fontWeight: 'normal' }}>(optionnel)</small>
            </label>
            <input
              name="company"
              placeholder="Auto-détecté depuis l'email si vide"
              value={formData.company}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Position *</label>
            <input
              name="position"
              placeholder="e.g., Full-Stack Developer"
              value={formData.position}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group span-full">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Contact Email(s) *</span>
              {emailList.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="status-badge success" 
                  style={{ fontSize: '0.7rem' }}
                >
                  {emailList.length} email{emailList.length > 1 ? 's' : ''}
                </motion.span>
              )}
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="email@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                style={{ flex: 1 }}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleAddEmail}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                +
              </motion.button>
            </div>
            
            <AnimatePresence>
              {emailList.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
                >
                  {emailList.map((email, index) => (
                    <motion.div
                      key={email}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      style={{
                        background: 'var(--color-accent-soft)',
                        border: '1px solid var(--color-accent)',
                        borderRadius: 'var(--radius-xs)',
                        padding: 'var(--space-2) var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      {editingEmail === email ? (
                        <input
                          type="text"
                          defaultValue={email}
                          autoFocus
                          onBlur={(e) => handleEditEmail(email, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleEditEmail(email, e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--color-text)',
                            fontSize: '0.875rem',
                            width: '200px'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{email}</span>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        type="button"
                        onClick={() => setEditingEmail(email)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            <small style={{ color: 'var(--color-text-soft)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              💡 Tapez un email et cliquez sur + pour l'ajouter
            </small>
          </div>

          <div className="input-group">
            <label>Location</label>
            <input
              name="location"
              placeholder="e.g., Casablanca, Remote"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Flexibility</label>
            <input
              name="flexibility"
              placeholder="e.g., Hybrid, Remote"
              value={formData.flexibility}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Contract Type</label>
            <input
              name="type_contrat"
              placeholder="e.g., CDI, Freelance"
              value={formData.type_contrat}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Application Method</label>
            <input
              name="application_method"
              placeholder="e.g., Email, Portal"
              value={formData.application_method}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Contact Person</label>
            <input
              name="contact"
              placeholder="e.g., John Doe"
              value={formData.contact}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Apply Date</label>
            <input
              type="date"
              name="apply_date"
              value={formData.apply_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Status</label>
            <input
              name="status"
              placeholder="e.g., Applied, Pending"
              value={formData.status}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Response Date</label>
            <input
              type="date"
              name="response_date"
              value={formData.response_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Referral?</label>
            <input
              name="referral"
              placeholder="e.g., Yes, No"
              value={formData.referral}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Interview Date</label>
            <input
              type="date"
              name="interview_date"
              value={formData.interview_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>In-touch Person</label>
            <input
              name="in_touch_person"
              placeholder="e.g., Jane Smith"
              value={formData.in_touch_person}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Salary Range</label>
            <input
              name="salary_range"
              placeholder="e.g., 50k-70k"
              value={formData.salary_range}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Portfolio URL</span>
              {savedPersonalInfo?.portfolioUrl && <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Enregistré</span>}
            </label>
            <input
              name="portfolioUrl"
              placeholder="https://..."
              value={formData.portfolioUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>LinkedIn</span>
              {savedPersonalInfo?.linkedinUrl && <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Enregistré</span>}
            </label>
            <input
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Phone</span>
              {savedPersonalInfo?.phoneNumber && <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Enregistré</span>}
            </label>
            <input
              name="phoneNumber"
              placeholder="+212..."
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group span-full">
            <label>Notes</label>
            <textarea
              name="notes"
              rows="3"
              placeholder="Internal notes for tracking..."
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

          <div className="span-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-panel)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-soft)' }}>💾 Infos personnelles</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="btn btn--ghost"
              onClick={savePersonalInfo}
              style={{ fontSize: '0.8rem', padding: 'var(--space-1) var(--space-3)' }}
            >
              {savedPersonalInfo ? '✓ Mis à jour' : 'Enregistrer'}
            </motion.button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
            <motion.label 
              className="file-upload"
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-soft)' }}
              whileTap={{ scale: 0.98 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <span>{cvName ? `✓ ${cvName}` : (localStorage.getItem('userCvPath') ? "✓ CV du profil" : "📄 Joindre CV (PDF)")}</span>
              {(cvName || localStorage.getItem('userCvPath')) && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    background: 'var(--color-success)'
                  }}
                />
              )}
            </motion.label>
            {localStorage.getItem('userCvPath') && !cvName && (
              <small style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}>
                ✓ Votre CV du profil sera utilisé
              </small>
            )}

            <div className="toggle-group" style={{ 
              padding: 'var(--space-2) var(--space-3)', 
              background: dryRun ? 'var(--color-warning-soft)' : 'var(--color-success-soft)',
              border: `2px solid ${dryRun ? 'var(--color-warning)' : 'var(--color-success)'}`,
              borderRadius: 'var(--radius-xs)'
            }}>
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
              <label htmlFor="dryRun" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {dryRun ? '🧪 Mode Simulation (aucun email envoyé)' : '✉️ Mode Réel (emails seront envoyés)'}
              </label>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              className="btn btn--primary" 
              onClick={handleAddApplication}
              disabled={emailList.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter à la file
            </motion.button>
          </div>

          {error && <div className="feedback error">{error}</div>}
          {successMessage && <div className="feedback success">{successMessage}</div>}
        </motion.section>

        <motion.section
          id="queue-section"
          className="section"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          data-reveal
        >
          <div className="section__header">
            <h2 className="section__title">Queue</h2>
            <span className="status-badge success">{applications.length} pending</span>
          </div>
        <AnimatePresence>
          {applications.length === 0 ? (
            <motion.p
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Add applications using the form above to start your campaign.
            </motion.p>
          ) : (
            <div className="queue-list">
              {applications.map((item, index) => (
                <motion.div
                  key={item.createdAt}
                  className="queue-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="queue-info">
                    <h4>{item.company}</h4>
                    <p>{item.position}</p>
                    <small>{item.to}</small>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => handleRemoveApplication(index)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Retirer
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
          </AnimatePresence>
        </motion.section>

        <motion.section
          id="send-section"
          className="section"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          data-reveal
        >
          <div className="section__header">
            <h2 className="section__title">Send Control</h2>
            <div className="eyebrow">Campaign Settings</div>
          </div>
          <div className="form-grid">
          <div className="input-group">
            <label>Number of Emails to Send</label>
            <input
              type="number"
              min="1"
              max={applications.length || 1}
              value={totalToSend}
              onChange={(event) => setLimit(Number(event.target.value) || 1)}
              disabled={applications.length === 0}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Délai entre envois</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>{(delayMs / 1000).toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={delayMs}
              onChange={(event) => setDelayMs(Number(event.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-soft)', marginTop: '0.5rem' }}>
              <span>0.5s</span>
              <span style={{ color: delayMs < 3000 ? 'var(--color-warning)' : 'var(--color-success)' }}>{delayMs < 3000 ? '⚡ Rapide' : '🛡️ Sécurisé'}</span>
              <span>10s</span>
            </div>
          </div>

            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Configuration SMTP</span>
                {smtpConfigured ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Configuré
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>⚠️ Non configuré</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowSmtpConfig(true)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: smtpConfigured ? 'var(--color-panel)' : 'var(--color-warning-soft)',
                  border: `1px solid ${smtpConfigured ? 'var(--color-border)' : 'var(--color-warning)'}`,
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                {smtpConfigured ? 'Modifier la configuration Gmail' : 'Configurer Gmail pour envoyer'}
              </button>
            </div>

            <div className="span-full">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSendBatch}
                disabled={!canSend || (!smtpConfigured && !dryRun)}
                style={{ width: '100%', padding: 'var(--space-4)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send {totalToSend} Email{totalToSend > 1 ? "s" : ""}
                  </>
                )}
              </button>
              {!smtpConfigured && !dryRun && (
                <p style={{ textAlign: 'center', color: 'var(--color-warning)', fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>
                  ⚠️ Configurez votre Gmail pour envoyer des emails réels
                </p>
              )}
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.section
              className="section"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              data-reveal
            >
              <div className="section__header">
                <h2 className="section__title">Results</h2>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <span className="status-badge success">
                    {results.filter((res) => res.status === "sent").length} sent
                  </span>
                  <span className="status-badge error">
                    {results.filter((res) => res.status === "failed").length} failed
                  </span>
                </div>
              </div>
              <div className="queue-list">
                {results.map((item) => (
                  <motion.div
                    key={`${item.index}-${item.to}-${item.status}`}
                    className="queue-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status === "sent" ? "Sent" : "Failed"}
                    </span>
                    <div className="queue-info">
                      <h4>{item.to ?? "(Unknown email)"}</h4>
                      {item.info && item.info.messageId && (
                        <small>Message ID: {item.info.messageId}</small>
                      )}
                      {item.error && <small style={{ color: 'var(--color-error)' }}>{item.error}</small>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [showProfile, setShowProfile] = useState(false);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent 
          setShowProfile={setShowProfile}
          showProfile={showProfile}
          showSmtpConfig={showSmtpConfig}
          setShowSmtpConfig={setShowSmtpConfig}
          smtpConfigured={smtpConfigured}
          setSmtpConfigured={setSmtpConfigured}
        />
        <ProfileModal 
          isOpen={showProfile} 
          onClose={() => {
            setShowProfile(false);
            // Après fermeture du profil, vérifier SMTP
            setShowSmtpConfig(true);
          }} 
        />
        <SmtpConfigModal 
          isOpen={showSmtpConfig} 
          onClose={() => setShowSmtpConfig(false)}
          onConfigured={() => {
            setSmtpConfigured(true);
            setShowSmtpConfig(false);
          }}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
