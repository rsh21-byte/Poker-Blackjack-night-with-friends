export function generateUniqueCode(): string {
  // Generate a random number from 0 to 999 and pad with zeroes
  const code = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return code;
}
