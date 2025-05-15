import Joi from "joi";

export const contactSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().required(),
  message: Joi.string().required(),
});
