import Joi from "joi";

export const studentRegisterSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
    .required(),
  sex: Joi.string().valid("male", "female").required(),
  birthdate: Joi.date().less(Date.now()).required(),
  group: Joi.string().required(),
  sendMail: Joi.boolean().default(false),
});

export const teacherRegisterSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
    .required(),
  sex: Joi.string().valid("male", "female").required(),
});
