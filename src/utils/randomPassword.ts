import crypto from "crypto";

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
    password += lowercase[Math.floor(crypto.randomInt(0, lowercase.length))];

  if (options.uppercase)
    password += uppercase[Math.floor(crypto.randomInt(0, uppercase.length))];

  if (options.numbers)
    password += numbers[Math.floor(crypto.randomInt(0, numbers.length))];

  if (options.symbols)
    password += symbols[Math.floor(crypto.randomInt(0, symbols.length))];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(crypto.randomInt(0, charset.length))];
  }

  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}
