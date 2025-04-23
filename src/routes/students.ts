import "dotenv/config";
import { Router } from "express";
import omit from "../utils/omit";
import { CustomRequest } from "../utils/authentication";
import { deleteOne, getById, register, registerMany } from "../service/user";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { parse } from "csv-parse";

const router = Router();
const upload = multer();

enum Sex {
  Female,
  Male,
}

type RawUser = {
  age: string;
  group: string;
  email: string;
  lastName: string;
  firstName: string;
  sex: string;
};

type ParsedUser = {
  age: number;
  group: string;
  email: string;
  lastName: string;
  firstName: string;
  sex: Sex;
  password: string;
};

type RandomPasswordOptions = {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

function randomPassword(length: number, options?: RandomPasswordOptions) {
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

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  try {
    const records: ParsedUser[] = [];
    const parser = parse({
      delimiter: ";",
      encoding: "latin1",
      columns: () => ["age", "group", "email", "lastName", "firstName", "sex"],
      trim: true,
      skip_empty_lines: true,
    });

    parser.on("readable", async () => {
      let record: RawUser;

      while ((record = parser.read())) {
        records.push({
          firstName: record.firstName.toLowerCase().trim(),
          lastName: record.lastName.toLowerCase().trim(),
          email: record.email.trim(),
          group: record.group.replace(/\s{2,}/, " ").trim(),
          age: parseInt(record.age),
          sex: +(record.sex === "M") as Sex,
          password: randomPassword(10),
        });
      }
    });

    parser.on("error", (err) => {
      console.error("Error parsing CSV file:", err.message);
      res.status(500).json({ message: "Error parsing CSV file" });
    });

    parser.on("end", async () => {
      console.log("CSV file parsed successfully:", records);
      const count = await registerMany(records);
      res.status(201).json({ message: `Registered ${count} students.` });
    });

    parser.write(req.file.buffer);
    parser.end();
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error importing CSV", error: err.message });
  }
});

router.get("/@me", async (req, res): Promise<any> => {
  try {
    res
      .status(200)
      .json(omit((req as CustomRequest).user.toJSON(), "hash", "refreshToken"));
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.delete("/@me", async (req, res): Promise<any> => {
  try {
    await deleteOne((req as CustomRequest).user.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.put(
  "/@me/avatar",
  upload.single("avatar"),
  async (req, res): Promise<any> => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!/png|jpe?g/i.test(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const user = (req as CustomRequest).user;
    const fileName = `${user.id}-${Date.now()}.png`;
    const uploadDir = path.join(__dirname, "../uploads/avatars");
    const outputPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    try {
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: "cover" })
        .png()
        .toFile(outputPath);

      user.avatar = fileName;
      await user.save();

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: fileName,
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing image" });
    }
  }
);

router.delete("/@me/avatar", async (req, res): Promise<any> => {
  try {
    const user = (req as CustomRequest).user;

    if (!user.avatar) {
      return res.status(400).json({ message: "No avatar to delete" });
    }

    const avatarPath = path.join(__dirname, "../uploads/avatars", user.avatar);

    fs.unlinkSync(avatarPath);
    user.avatar = null;
    await user.save();
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.get("/:id", async (req, res): Promise<any> => {
  try {
    const user = await getById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(omit(user.toJSON(), "hash", "refreshToken", "email"));
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

export default router;
