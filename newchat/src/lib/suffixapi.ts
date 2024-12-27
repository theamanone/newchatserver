
export const getRandomComplexSuffix = (length = 7) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Uppercase, lowercase, and numbers
    let suffix = '';
    for (let i = 0; i < length; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return suffix;
  }