import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}