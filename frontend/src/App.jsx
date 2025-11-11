import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4859";

const emptyForm = {
  entreprise: "",
  poste: "",
  to: "",
  localisation: "",
  type_contrat: "",
  statut_candid: "",
  date_candid: "",
  site_web: "",
  remarques: "",
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

    if (!formData.entreprise.trim()) {
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
      <motion.header
        className="page-hero glass-card"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1>Assistant d'envoi de candidatures</h1>
          <p>
            Prépare ta campagne d'e-mails professionnels, joins ton CV et
            conserve un suivi automatique dans Excel.
          </p>
        </div>
        <motion.div
          className="stats-chip"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <span>{applications.length}</span>
          <small>Candidatures dans la file</small>
        </motion.div>
      </motion.header>

      <motion.section
        className="glass-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h2>Nouvelle candidature</h2>
        <div className="form-grid">
          <div className="input-field">
            <label>Entreprise *</label>
            <input
              name="entreprise"
              placeholder="Ex: ACME"
              value={formData.entreprise}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Poste ciblé *</label>
            <input
              name="poste"
              placeholder="Ex: Développeur Full-Stack"
              value={formData.poste}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Email destinataire *</label>
            <input
              name="to"
              placeholder="recruteur@entreprise.com"
              value={formData.to}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Date candidature</label>
            <input
              type="date"
              name="date_candid"
              value={formData.date_candid}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Localisation</label>
            <input
              name="localisation"
              placeholder="Casablanca, Remote..."
              value={formData.localisation}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Type de contrat</label>
            <input
              name="type_contrat"
              placeholder="CDI, Freelance..."
              value={formData.type_contrat}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Statut de candidature</label>
            <input
              name="statut_candid"
              placeholder="Soumise, En attente..."
              value={formData.statut_candid}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Site Web</label>
            <input
              name="site_web"
              placeholder="https://..."
              value={formData.site_web}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Portfolio / Projet</label>
            <input
              name="portfolioUrl"
              placeholder="Lien portfolio"
              value={formData.portfolioUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Profil LinkedIn</label>
            <input
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinUrl}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field">
            <label>Téléphone</label>
            <input
              name="phoneNumber"
              placeholder="+212..."
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field span-2">
            <label>Remarques internes</label>
            <textarea
              name="remarques"
              rows="2"
              placeholder="Notes pour le suivi..."
              value={formData.remarques}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="file-row">
          <label className="file-upload">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <span>{cvName ? `CV sélectionné : ${cvName}` : "Joindre un CV (PDF)"}</span>
          </label>

          <div className="toggle">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
            />
            <label htmlFor="dryRun">Mode simulation (dry run)</label>
          </div>

          <button type="button" className="primary" onClick={handleAddApplication}>
            Ajouter à la file
          </button>
        </div>

        {error && <p className="feedback error">{error}</p>}
        {successMessage && <p className="feedback success">{successMessage}</p>}
      </motion.section>

      <motion.section
        className="glass-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="section-header">
          <h2>File d'envoi</h2>
          <span>{applications.length} en attente</span>
        </div>
        <AnimatePresence>
          {applications.length === 0 ? (
            <motion.p
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Ajoute des candidatures via le formulaire ci-dessus pour lancer ta
              campagne.
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
                  <div>
                    <h3>{item.entreprise}</h3>
                    <p>{item.poste}</p>
                    <small>{item.to}</small>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleRemoveApplication(index)}
                  >
                    Retirer
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section
        className="glass-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2>Pilotage des envois</h2>
        <div className="controls-grid">
          <div className="control">
            <label>Nombre d'e-mails à envoyer</label>
            <input
              type="number"
              min="1"
              max={applications.length || 1}
              value={totalToSend}
              onChange={(event) => setLimit(Number(event.target.value) || 1)}
              disabled={applications.length === 0}
            />
          </div>

          <div className="control">
            <label>Délai entre chaque envoi (ms)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={delayMs}
              onChange={(event) => setDelayMs(Number(event.target.value) || 0)}
            />
          </div>

          <div className="control api">
            <label>API backend</label>
            <code>{API_BASE_URL}</code>
          </div>

          <button
            type="button"
            className="primary large"
            onClick={handleSendBatch}
            disabled={!canSend}
          >
            {sending ? "Envoi en cours..." : `Envoyer ${totalToSend} email(s)`}
          </button>
        </div>
      </motion.section>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.section
            className="glass-card"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
          >
            <div className="section-header">
              <h2>Résultats</h2>
              <small>
                {results.filter((res) => res.status === "sent").length} envoyés /{" "}
                {results.filter((res) => res.status === "failed").length} échecs
              </small>
            </div>
            <div className="result-list">
              {results.map((item) => (
                <motion.div
                  key={`${item.index}-${item.to}-${item.status}`}
                  className="result-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className={getStatusBadgeClass(item.status)}>
                    {item.status === "sent" ? "Envoyé" : "Échec"}
                  </span>
                  <div>
                    <h4>{item.to ?? "(Email inconnu)"}</h4>
                    {item.info && item.info.messageId && (
                      <small>ID Message : {item.info.messageId}</small>
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
