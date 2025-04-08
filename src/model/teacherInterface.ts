import { Document } from "mongoose";

// Définir l'interface Teacher
export interface Teacher extends Document {
  name: string;
  email: string;
}
