import Student, { StudentDocument } from "../model/Student";
import { parseCSV } from "./csv";
import LevelResult, { LevelResultDocument } from "../model/LevelResult";

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
    const student = await Student.findById(id).populate("levelResults");
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
  Cours: "className",
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

export async function addLevelResultToStudent(
  studentId: string,
  levelResultId: string
): Promise<StudentDocument | null> {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const levelResult = await LevelResult.findById(levelResultId);
    if (!levelResult) {
      throw new Error("Level result not found");
    }

    student.levelResults.push(levelResult);
    await student.save();

    return student;
  } catch (error: any) {
    throw new Error("Error adding level result to student: " + error.message);
  }
}

export async function getLevelResultsByStudentId(
  studentId: string
): Promise<LevelResultDocument[]> {
  try {
    const student = await Student.findById(studentId).populate("levelResults");
    if (!student) {
      throw new Error("Student not found");
    }
    return student.levelResults;
  } catch (error: any) {
    throw new Error("Error fetching level results: " + error.message);
  }
}

export async function deleteLevelResultFromStudent(
  studentId: string,
  levelResultId: string
): Promise<void> {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    const levelResultIndex = student.levelResults.findIndex(
      (result) => result.toString() === levelResultId
    );
    if (levelResultIndex === -1) {
      return;
    }
    student.levelResults.splice(levelResultIndex, 1);
    await student.save();

    await LevelResult.findByIdAndDelete(levelResultId);
  } catch (error: any) {
    throw new Error(
      "Error deleting level result from student: " + error.message
    );
  }
}
