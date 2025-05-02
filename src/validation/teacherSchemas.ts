import Joi from "joi";

export const createTeacherSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

export const updateTeacherSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
});
