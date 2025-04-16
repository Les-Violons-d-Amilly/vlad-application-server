import Student, { StudentDocument } from "../model/Student";

import path from "path";
import fs from "fs";
import { parse } from "csv-parse";

const SAFE_ROOT = "/path/to/safe/directory";

export async function getStudents(): Promise<StudentDocument[]> {
  try {
    const students = await Student.find();
    return students;
  } catch (error: any) {
    throw new Error("Error fetching students: " + error);
  }
}

export async function getStudentById(
  id: string
): Promise<StudentDocument | null> {
  try {
    const student = await Student.findById(id).populate("exercises");
    return student;
  } catch (error: any) {
    throw new Error("Error fetching student by ID: " + error);
  }
}

export async function saveStudent(
  student: StudentDocument
): Promise<StudentDocument> {
  try {
    const newStudent = new Student(student);
    await newStudent.save();
    return newStudent;
  } catch (error: any) {
    throw new Error("Error creating student: " + error);
  }
}

export async function updateStudent(
  studentId: string,
  updateData: Partial<StudentDocument>
): Promise<StudentDocument | null> {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true }
    );
    return updatedStudent;
  } catch (error: any) {
    throw new Error("Error updating student: " + error);
  }
}

export async function deleteStudent(
  studentId: string
): Promise<StudentDocument | null> {
  try {
    return await Student.findByIdAndDelete(studentId);
  } catch (error: any) {
    throw new Error("Error deleting student: " + error);
  }
}

export async function importFromCSV(
  filePath: string
): Promise<StudentDocument[]> {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(SAFE_ROOT, filePath);

    if (!resolvedPath.startsWith(SAFE_ROOT)) {
      return reject(new Error("Invalid file path"));
    }

    const records: StudentDocument[] = [];

    fs.createReadStream(resolvedPath)
      .pipe(
        parse({
          delimiter: ";",
          columns: true,
          trim: true,
        })
      )
      .on("data", async (row) => {
        try {
          const student = new Student({
            firstName: row["Prénom"],
            lastName: row["Nom"],
            email: row["E-mail"],
            age: parseInt(row["Age"]),
            sex: row["Sexe"],
            exercises: [],
          });
          await student.save();
          records.push(student);
        } catch (err: any) {
          console.error("Skipping invalid row:", row, err.message);
        }
      })
      .on("end", () => {
        resolve(records);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
