import fs from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const CV_STORAGE = path.join(process.cwd(), 'data', 'cvs');

// Assurer que les dossiers existent
await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
await fs.mkdir(CV_STORAGE, { recursive: true });

class User {
  static async findByEmail(email) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      return users.find(user => user.email === email);
    } catch (error) {
      return null;
    }
  }

  static async create(userData) {
    try {
      let users = [];
      try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        users = JSON.parse(data);
      } catch (error) {
        // Fichier n'existe pas encore
      }

      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        createdAt: new Date().toISOString(),
        cvPath: null,
        smtpConfigured: false,
        smtpPassword: null,
        personalInfo: {
          phone: userData.phone || '',
          linkedin: userData.linkedin || '',
          portfolio: userData.portfolio || ''
        }
      };

      users.push(newUser);
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      return newUser;
    } catch (error) {
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }
  }

  static async updatePersonalInfo(userId, personalInfo) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Utilisateur non trouvé');
      }

      users[userIndex].personalInfo = { ...users[userIndex].personalInfo, ...personalInfo };
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      return users[userIndex];
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour');
    }
  }

  static async saveCv(userId, cvBuffer, fileName) {
    try {
      const cvPath = path.join(CV_STORAGE, `${userId}_${fileName}`);
      await fs.writeFile(cvPath, cvBuffer);
      
      // Mettre à jour le chemin du CV dans les données utilisateur
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].cvPath = cvPath;
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
      
      return cvPath;
    } catch (error) {
      throw new Error('Erreur lors de la sauvegarde du CV');
    }
  }

  static async getCvPath(userId) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const user = users.find(user => user.id === userId);
      return user?.cvPath || null;
    } catch (error) {
      return null;
    }
  }

  static async saveSmtpConfig(userId, encryptedPassword) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].smtpPassword = encryptedPassword;
        users[userIndex].smtpConfigured = true;
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return users[userIndex];
      }
      throw new Error('Utilisateur non trouvé');
    } catch (error) {
      throw new Error('Erreur lors de la sauvegarde SMTP');
    }
  }

  static async getSmtpConfig(userId) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const user = users.find(user => user.id === userId);
      return {
        configured: user?.smtpConfigured || false,
        password: user?.smtpPassword || null
      };
    } catch (error) {
      return { configured: false, password: null };
    }
  }
}

export default User;