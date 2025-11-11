import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
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

export default function App() {
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

  useEffect(() => {
    if (applications.length === 0) {
      setLimit(1);
    } else if (limit > applications.length) {
      setLimit(applications.length);
    }
  }, [applications.length, limit]);

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

  const canSend = useMemo(
    () => applications.length > 0 && !sending,
    [applications.length, sending]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleAddApplication = () => {
    setError("");
    setSuccessMessage("");

    if (!formData.to.trim()) {
      setError("L'adresse e-mail du destinataire est obligatoire.");
      return;
    }

    if (!formData.company.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }

    const entry = {
      ...formData,
      cvFile,
      createdAt: Date.now(),
    };

    setApplications((prev) => [...prev, entry]);
    resetForm();
  };

  const handleRemoveApplication = (index) => {
    setApplications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendBatch = async () => {
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
        payload
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

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#" className="brand">
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
            <motion.div
              className="hero__media"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div style={{ textAlign: 'center' }}>
                <svg className="hero__media-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9"/>
                  <path d="M13 17V5"/>
                  <path d="M8 17v-3"/>
                </svg>
                <div className="hero__media-value">{applications.length}</div>
                <div className="hero__media-label">Applications Queued</div>
              </div>
            </motion.div>
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
        <div className="form-grid">
          <div className="input-group">
            <label>Company *</label>
            <input
              name="company"
              placeholder="e.g., ACME Corp"
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

          <div className="input-group">
            <label>Contact Email(s) *</label>
            <input
              name="to"
              type="text"
              placeholder="email1@company.com, email2@company.com"
              value={formData.to}
              onChange={handleInputChange}
            />
            <small style={{ color: 'var(--color-text-soft)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Séparez plusieurs emails par des virgules</small>
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
            <label>Portfolio URL</label>
            <input
              name="portfolioUrl"
              placeholder="https://..."
              value={formData.portfolioUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>LinkedIn</label>
            <input
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <label>Phone</label>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
            <label className="file-upload">
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <span>{cvName || "Attach CV (PDF)"}</span>
            </label>

            <div className="toggle-group">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
              <label htmlFor="dryRun">Dry Run (simulation)</label>
            </div>

            <button type="button" className="btn btn--primary" onClick={handleAddApplication}>
              Add to Queue
            </button>
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
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => handleRemoveApplication(index)}
                  >
                    Remove
                  </button>
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
            <label>Delay Between Sends (ms)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={delayMs}
              onChange={(event) => setDelayMs(Number(event.target.value) || 0)}
            />
          </div>

            <div className="input-group">
              <label>Backend API</label>
              <div style={{ 
                padding: 'var(--space-2)', 
                background: 'var(--color-panel-solid)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-xs)', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.875rem',
                color: 'var(--color-text-soft)'
              }}>
                {API_BASE_URL}
              </div>
            </div>

            <div className="span-full">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSendBatch}
                disabled={!canSend}
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
