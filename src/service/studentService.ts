import Student, { StudentDocument } from "../model/Student";

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
