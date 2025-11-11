# 🔧 Correction de l'erreur SMTP Gmail

## Erreur actuelle
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

## ✅ Solution : Configurer un mot de passe d'application Gmail

### Étape 1 : Activer l'authentification à 2 facteurs
1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en deux étapes" si ce n'est pas déjà fait

### Étape 2 : Générer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Autre (nom personnalisé)"
3. Tapez "Email Sender"
4. Cliquez sur "Générer"
5. **Copiez le mot de passe de 16 caractères** (format: xxxx xxxx xxxx xxxx)

### Étape 3 : Configurer le fichier .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SENDER_EMAIL=votre-email@gmail.com
SENDER_NAME=Votre Nom
```

⚠️ **Important** : 
- Utilisez le mot de passe d'application (16 caractères), PAS votre mot de passe Gmail normal
- Retirez les espaces du mot de passe : `xxxxxxxxxxxxxx`
- Redémarrez le serveur après modification du .env

### Étape 4 : Redémarrer le serveur
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### Test
1. Cochez "Dry Run" pour tester sans envoyer
2. Décochez "Dry Run" pour envoyer réellement
3. L'email sera envoyé depuis votre compte Gmail authentifié
