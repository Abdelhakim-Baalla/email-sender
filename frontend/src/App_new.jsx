import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

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
  const [darkMode, setDarkMode] = useState(false);
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
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
      <nav className="navbar glass">
        <div className="navbar-content">
          <h1 className="brand">Email Sender</h1>
          <div className="nav-desktop">
            <button className="nav-link" onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}>
              New Application
            </button>
            <button className="nav-link" onClick={() => document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" })}>
              Queue
            </button>
            <button className="nav-link" onClick={() => document.getElementById("send-section")?.scrollIntoView({ behavior: "smooth" })}>
              Send
            </button>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              className="mobile-backdrop" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-drawer glass"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
              <div className="mobile-nav">
                <button className="nav-link" onClick={() => { document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                  New Application
                </button>
                <button className="nav-link" onClick={() => { document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                  Queue
                </button>
                <button className="nav-link" onClick={() => { document.getElementById("send-section")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}>
                  Send
                </button>
                <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.header
        className="hero glass"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-text">
          <h2>Job Application Assistant</h2>
          <p>
            Automate professional email campaigns, attach your CV, and track everything in Excel.
          </p>
        </div>
        <motion.div
          className="stats-chip glass"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <span className="stat-value">{applications.length}</span>
          <small className="stat-label">Applications Queued</small>
        </motion.div>
      </motion.header>

      <motion.section
        id="form-section"
        className="section glass"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h3 className="section-title">New Application</h3>
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
            <label>Contact Email *</label>
            <input
              name="to"
              type="email"
              placeholder="recruiter@company.com"
              value={formData.to}
              onChange={handleInputChange}
            />
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

        <div className="form-actions">
          <label className="file-upload glass">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <span>{cvName ? `CV: ${cvName}` : "📎 Attach CV (PDF)"}</span>
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

          <button type="button" className="btn-primary" onClick={handleAddApplication}>
            Add to Queue
          </button>
        </div>

        {error && <p className="feedback error">{error}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}
      </motion.section>

      <motion.section
        id="queue-section"
        className="section glass"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="section-header">
          <h3 className="section-title">Queue</h3>
          <span className="badge">{applications.length} pending</span>
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
                  className="queue-item glass"
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
                    className="btn-ghost"
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
        className="section glass"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="section-title">Send Control</h3>
        <div className="controls-grid">
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

          <div className="input-group api-info">
            <label>Backend API</label>
            <code>{API_BASE_URL}</code>
          </div>

          <button
            type="button"
            className="btn-primary btn-large"
            onClick={handleSendBatch}
            disabled={!canSend}
          >
            {sending ? "Sending..." : `Send ${totalToSend} Email${totalToSend > 1 ? "s" : ""}`}
          </button>
        </div>
      </motion.section>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.section
            className="section glass"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
          >
            <div className="section-header">
              <h3 className="section-title">Results</h3>
              <div className="result-badges">
                <span className="badge success">
                  {results.filter((res) => res.status === "sent").length} sent
                </span>
                <span className="badge error">
                  {results.filter((res) => res.status === "failed").length} failed
                </span>
              </div>
            </div>
            <div className="result-list">
              {results.map((item) => (
                <motion.div
                  key={`${item.index}-${item.to}-${item.status}`}
                  className="result-item glass"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className={getStatusBadgeClass(item.status)}>
                    {item.status === "sent" ? "✓ Sent" : "✕ Failed"}
                  </span>
                  <div className="result-info">
                    <h4>{item.to ?? "(Unknown email)"}</h4>
                    {item.info && item.info.messageId && (
                      <small>Message ID: {item.info.messageId}</small>
                    )}
                    {item.error && <small className="error-text">{item.error}</small>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
