import { Response } from "express";
import { Teacher } from "../model/teacherInterface";

// Étendre la réponse d'Express pour inclure `teacher`
export interface CustomResponse extends Response {
  teacher?: Teacher; // teacher est optionnel, car toutes les réponses ne l'auront pas
}
