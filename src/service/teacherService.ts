import Teacher, { TeacherDocument } from "../model/Teacher";

export async function getTeachers(): Promise<TeacherDocument[]> {
  try {
    const teacher = await Teacher.find();
    return teacher;
  } catch (error: any) {
    throw new Error("Error fetching teacher: " + error);
  }
}

export async function getTeacherById(
  id: string
): Promise<TeacherDocument | null> {
  try {
    const teacher = await Teacher.findById(id).populate("students");
    return teacher;
  } catch (error: any) {
    throw new Error("Error fetching teacher by ID: " + error);
  }
}

export async function saveTeacher(
  teacher: TeacherDocument
): Promise<TeacherDocument> {
  try {
    const newTeacher = new Teacher(teacher);
    await newTeacher.save();
    return newTeacher;
  } catch (error: any) {
    throw new Error("Error creating teacher: " + error);
  }
}

export async function updateTeacher(
  teacherId: string,
  updateData: Partial<TeacherDocument>
): Promise<TeacherDocument | null> {
  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true }
    );
    return updatedTeacher;
  } catch (error: any) {
    throw new Error("Error updating teacher: " + error);
  }
}

export async function deleteTeacher(
  teacherId: string
): Promise<TeacherDocument | null> {
  try {
    return await Teacher.findByIdAndDelete(teacherId);
  } catch (error: any) {
    throw new Error("Error deleting teacher: " + error);
  }
}
