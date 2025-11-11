# Configuration de l'authentification Google OAuth

## Étapes pour configurer Google OAuth

### 1. Créer un projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ (Google People API)

### 2. Créer les identifiants OAuth 2.0
1. Dans le menu, allez à **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Configurez l'écran de consentement OAuth si demandé
4. Sélectionnez **Web application** comme type d'application
5. Ajoutez les URIs autorisés :
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (développement)
     - Votre domaine de production
   - **Authorized redirect URIs**: 
     - `http://localhost:5173` (développement)
     - Votre domaine de production
6. Copiez le **Client ID** généré

### 3. Configuration Backend (.env)
Ajoutez dans votre fichier `.env` :
```env
GOOGLE_CLIENT_ID=votre-client-id-ici
JWT_SECRET=votre-secret-jwt-super-securise
```

### 4. Configuration Frontend (.env)
Créez un fichier `.env` dans le dossier `frontend/` :
```env
VITE_API_URL=http://localhost:4859
VITE_GOOGLE_CLIENT_ID=votre-client-id-ici
```

### 5. Démarrer l'application
```bash
# Backend
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

## Fonctionnalités implémentées

✅ Authentification Google OAuth 2.0
✅ JWT pour la gestion des sessions
✅ Protection des routes API
✅ Stockage sécurisé du token
✅ Déconnexion
✅ Affichage du profil utilisateur
✅ Chaque utilisateur envoie avec son propre email

## Sécurité

- Les tokens JWT expirent après 7 jours
- Les routes API sont protégées par middleware
- Les credentials sont stockés dans localStorage
- CORS configuré pour les origines autorisées
