import { Document } from "mongoose";

// Définir l'interface Teacher
export interface Teacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
}
