import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearch({ applications, onSelect, isOpen, onClose }) {
  const [query, setQuery] = useState('');

  const results = applications.filter(app =>
    app.company?.toLowerCase().includes(query.toLowerCase()) ||
    app.position?.toLowerCase().includes(query.toLowerCase()) ||
    app.to?.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20vh 20px 20px',
        zIndex: 9999
      }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-panel)',
          borderRadius: 'var(--radius-sm)',
          width: '100%',
          maxWidth: '600px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <input
          autoFocus
          type="text"
          placeholder="🔍 Rechercher une candidature..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            border: 'none',
            borderBottom: '1px solid var(--color-border)',
            background: 'transparent',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.map((app, i) => (
            <motion.div
              key={app.createdAt}
              whileHover={{ background: 'var(--color-accent-soft)' }}
              onClick={() => { onSelect(i); onClose(); }}
              style={{
                padding: 'var(--space-3)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <div style={{ fontWeight: 600 }}>{app.company}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-soft)' }}>{app.position}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)' }}>{app.to}</div>
            </motion.div>
          ))}
          {query && results.length === 0 && (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-soft)' }}>
              Aucun résultat
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
