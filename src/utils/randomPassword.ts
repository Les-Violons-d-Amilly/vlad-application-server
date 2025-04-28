type RandomPasswordOptions = {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

export default function randomPassword(
  length: number,
  options?: RandomPasswordOptions
) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

  if (!options) {
    options = {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
    };
  }

  let charset = "";
  if (options.lowercase) charset += lowercase;
  if (options.uppercase) charset += uppercase;
  if (options.numbers) charset += numbers;
  if (options.symbols) charset += symbols;

  let password = "";

  if (options.lowercase)
    password += lowercase[Math.floor(Math.random() * lowercase.length)];

  if (options.uppercase)
    password += uppercase[Math.floor(Math.random() * uppercase.length)];

  if (options.numbers)
    password += numbers[Math.floor(Math.random() * numbers.length)];

  if (options.symbols)
    password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}
