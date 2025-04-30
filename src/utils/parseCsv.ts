import { parse } from "csv-parse";
import { Sex } from "../model/User";
import randomPassword from "./randomPassword";
import moment, { Moment } from "moment";

export type ParsedUser = {
  lastName: string;
  firstName: string;
  sex: Sex;
  email: string;
  password: string;
  sendMail: boolean;
};

export type ParsedStudent = ParsedUser & {
  birthdate: Moment;
  group: string;
};

export type ParsedTeacher = ParsedUser & {};

function parseCsv<T, U extends string[]>(
  buffer: Buffer<ArrayBufferLike>,
  columns: U,
  formatFn: (record: Record<U[number], string>) => T = (record) => record as T
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const records: T[] = [];

    const parser = parse({
      delimiter: ";",
      encoding: "latin1",
      columns: () => columns,
      trim: true,
      skip_empty_lines: true,
    })
      .on("readable", () => {
        let record: Record<U[number], string> | null;

        while ((record = parser.read())) {
          records.push(formatFn(record));
        }
      })
      .on("error", reject)
      .on("end", () => resolve(records));

    parser.write(buffer);
    parser.end();
  });
}

export function parseStudentCsv(
  buffer: Buffer<ArrayBufferLike>
): Promise<ParsedStudent[]> {
  return parseCsv(
    buffer,
    ["age", "group", "email", "lastName", "firstName", "sex"],
    ({ age, group, email, lastName, firstName, sex }) => ({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      email: email,
      group: group.toUpperCase().replace(/\s{2,}/, " "),
      birthdate: moment().subtract(parseInt(age), "years"),
      sex: (sex === "F" ? "female" : "male") as Sex,
      password: randomPassword(10),
      sendMail: false,
    })
  );
}

export function parseTeacherCsv(
  buffer: Buffer<ArrayBufferLike>
): Promise<ParsedTeacher[]> {
  return parseCsv(
    buffer,
    ["email", "lastName", "firstName", "sex"],
    ({ email, lastName, firstName, sex }) => ({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      email: email,
      sex: (sex === "F" ? "female" : "male") as Sex,
      password: randomPassword(10),
      sendMail: false,
    })
  );
}
