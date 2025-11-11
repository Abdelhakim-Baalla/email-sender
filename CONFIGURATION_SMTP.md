# Configuration SMTP pour Email Sender

## ⚠️ IMPORTANT : Configuration de l'email d'envoi

L'application utilise **l'email de l'utilisateur connecté** pour envoyer les emails, mais nécessite une configuration SMTP dans le fichier `.env`.

### Configuration Gmail (Recommandé)

1. **Activer l'authentification à 2 facteurs** sur votre compte Google
2. **Générer un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/security
   - Cliquez sur "Mots de passe des applications"
   - Sélectionnez "Autre" et nommez-le "Email Sender"
   - Copiez le mot de passe généré (16 caractères)

3. **Configurer le fichier `.env`** :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
SENDER_EMAIL=votre-email@gmail.com
SENDER_NAME=Votre Nom
```

### Comment ça fonctionne ?

1. **Connexion** : L'utilisateur se connecte avec Google OAuth
2. **Email d'envoi** : Les emails sont envoyés DEPUIS l'email de l'utilisateur connecté
3. **SMTP** : Utilise les credentials SMTP configurés dans `.env` pour l'envoi

### Exemple de flux :

```
Utilisateur connecté : john@gmail.com
Configuration SMTP : john@gmail.com (avec mot de passe d'application)
Email envoyé : FROM john@gmail.com TO recruteur@entreprise.com
```

### ⚠️ Sécurité

- Ne partagez JAMAIS votre mot de passe d'application
- Utilisez un mot de passe d'application différent pour chaque service
- Le fichier `.env` ne doit JAMAIS être commité sur Git

### Test en mode Dry Run

Pour tester sans envoyer de vrais emails :
1. Cochez "Dry Run (simulation)" dans l'interface
2. L'application simulera l'envoi sans utiliser SMTP
