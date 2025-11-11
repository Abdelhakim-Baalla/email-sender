import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Connexion Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let user = await User.findByEmail(payload.email);

    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: 'Authentification échouée' });
  }
});

// Profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByEmail(req.user.email);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mise à jour des informations personnelles
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { phone, linkedin, portfolio } = req.body;
    const updatedUser = await User.updatePersonalInfo(req.user.id, {
      phone,
      linkedin,
      portfolio
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload CV
router.post('/upload-cv', authenticateToken, async (req, res) => {
  try {
    const { fileName, content } = req.body;
    
    if (!content || !fileName) {
      return res.status(400).json({ error: 'Fichier CV requis' });
    }

    const base64Data = content.replace(/^data:application\/pdf;base64,/, '');
    const cvBuffer = Buffer.from(base64Data, 'base64');
    
    const cvPath = await User.saveCv(req.user.id, cvBuffer, fileName);
    res.json({ message: 'CV uploadé avec succès', cvPath });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sauvegarder la configuration SMTP
router.post('/smtp-config', authenticateToken, async (req, res) => {
  try {
    const { smtpPassword } = req.body;
    
    if (!smtpPassword) {
      return res.status(400).json({ error: 'Mot de passe SMTP requis' });
    }

    const { encrypt } = await import('../utils/encryption.js');
    const encryptedPassword = encrypt(smtpPassword);
    
    await User.saveSmtpConfig(req.user.id, encryptedPassword);
    res.json({ message: 'Configuration SMTP sauvegardée', configured: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Vérifier la configuration SMTP
router.get('/smtp-config', authenticateToken, async (req, res) => {
  try {
    const config = await User.getSmtpConfig(req.user.id);
    res.json({ configured: config.configured });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;