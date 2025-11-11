# 🚀 Nouveau Système SMTP par Utilisateur

## ✨ Fonctionnalités

Chaque utilisateur configure **son propre mot de passe d'application Gmail** :
- ✅ Pas besoin de `.env` pour SMTP
- ✅ Chaque utilisateur utilise son propre compte Gmail
- ✅ Mot de passe crypté et stocké de manière sécurisée
- ✅ Configuration une seule fois à la première connexion
- ✅ Modal automatique si non configuré

## 🔐 Sécurité

- **Cryptage AES** : Les mots de passe SMTP sont cryptés avec `crypto-js`
- **Stockage sécurisé** : Sauvegardés dans `data/users.json` (cryptés)
- **Isolation** : Chaque utilisateur a ses propres credentials
- **Pas de partage** : Les mots de passe ne sont jamais exposés

## 📋 Comment ça marche ?

### 1. Première connexion
Lorsqu'un utilisateur se connecte pour la première fois :
1. Un modal s'affiche automatiquement
2. L'utilisateur doit configurer son mot de passe d'application Gmail

### 2. Configuration Gmail
L'utilisateur doit :
1. Activer l'authentification à 2 facteurs sur Google
2. Aller sur https://myaccount.google.com/apppasswords
3. Créer un mot de passe d'application "Email Sender"
4. Copier le mot de passe de 16 caractères
5. Le coller dans le modal

### 3. Envoi d'emails
- Les emails sont envoyés **depuis le compte Gmail de l'utilisateur**
- Utilise automatiquement ses credentials cryptés
- Pas besoin de reconfigurer à chaque fois

## 🎯 Avantages

### Pour l'utilisateur
- ✅ Contrôle total sur son compte Gmail
- ✅ Emails envoyés depuis son adresse
- ✅ Configuration simple et rapide
- ✅ Sécurité maximale

### Pour l'application
- ✅ Pas de credentials partagés
- ✅ Chaque utilisateur indépendant
- ✅ Pas de limite d'envoi globale
- ✅ Traçabilité parfaite

## 🔄 Flux complet

```
1. Connexion Google OAuth
   ↓
2. Vérification configuration SMTP
   ↓
3. Si non configuré → Modal automatique
   ↓
4. Utilisateur entre son mot de passe d'application
   ↓
5. Cryptage et sauvegarde sécurisée
   ↓
6. Prêt à envoyer des emails !
```

## 🛠️ Reconfiguration

Si l'utilisateur veut changer son mot de passe :
1. Cliquer sur "Configuration SMTP" dans la section "Send Control"
2. Entrer le nouveau mot de passe d'application
3. Sauvegarder

## ⚠️ Important

- Le mot de passe d'application est **différent** du mot de passe Gmail normal
- Il faut activer l'authentification à 2 facteurs sur Google
- Le mot de passe est crypté et jamais visible en clair
- En mode "Dry Run", pas besoin de configuration SMTP

## 📁 Structure des données

```json
{
  "id": "1234567890",
  "email": "user@gmail.com",
  "name": "User Name",
  "smtpConfigured": true,
  "smtpPassword": "U2FsdGVkX1+encrypted_password_here",
  "personalInfo": { ... }
}
```

## 🎨 Interface

- **Badge vert** : SMTP configuré ✅
- **Badge orange** : SMTP non configuré ⚠️
- **Bouton** : "Configurer Gmail pour envoyer"
- **Modal** : Instructions détaillées + champ sécurisé
