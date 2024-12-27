import CryptoJS from 'crypto-js';

// Encrypt function
export function encrypt(data: object, secretKey: string): string {

  try {
    const iv = CryptoJS.lib.WordArray.random(16); 
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      CryptoJS.enc.Hex.parse(secretKey),
      { iv }
    ).toString();
    return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

// Decrypt function
export function decrypt(encryptedText: string, secretKey: string): object | null {
  try {
    const [iv, encrypted] = encryptedText.split(':');
    const bytes = CryptoJS.AES.decrypt(
      encrypted,
      CryptoJS.enc.Hex.parse(secretKey),
      { iv: CryptoJS.enc.Hex.parse(iv) }
    );
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
