import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

const SAFE_ROOT = path.resolve(__dirname, "../../uploads");

export async function parseCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(SAFE_ROOT, filePath);
    if (!resolvedPath.startsWith(SAFE_ROOT)) {
      return reject(new Error("Invalid file path"));
    }
    const records: T[] = [];

    fs.createReadStream(resolvedPath, { encoding: "utf8" })
      .pipe(
        parse({
          delimiter: ";",
          columns: (header) => {
            const fixed = header.map((col: string) =>
              col
                .replace(/^\uFEFF/, "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^ -~]/g, "")
                .trim()
            );
            console.log("Normalized headers:", fixed);
            return fixed;
          },
          trim: true,
        })
      )
      .on("data", (row) => {
        console.log("Received row:", row);
        records.push(row);
      })
      .on("end", () => {
        fs.unlink(resolvedPath, () => {});
        resolve(records);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
