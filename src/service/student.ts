import Student, { StudentDocument } from "../model/Student";
import { parseCSV } from "./csv";

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

const studentMap: Record<string, keyof StudentDocument> = {
  Prenom: "firstName",
  Prnom: "firstName",
  Nom: "lastName",
  "E-mail": "email",
  Age: "age",
  Sexe: "sex",
};

function transformRow(row: Record<string, string>): Partial<StudentDocument> {
  const student: Partial<StudentDocument> = {};
  for (const [csvKey, modelKey] of Object.entries(studentMap)) {
    const value = row[csvKey];
    if (!value) continue;
    student[modelKey] = modelKey === "age" ? parseInt(value, 10) : value;
  }
  student.exercises = [];
  return student;
}

export async function importStudentsFromCSV(
  filePath: string
): Promise<StudentDocument[]> {
  const parsedRows = await parseCSV(filePath);
  const students: StudentDocument[] = [];

  for (const row of parsedRows) {
    try {
      const studentData = transformRow(row as Record<string, string>);
      const student = new Student(studentData);
      await student.save();
      students.push(student);
    } catch (err: any) {
      console.error("Skipping invalid row:", row, err.message);
    }
  }

  return students;
}
