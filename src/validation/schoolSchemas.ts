import Joi from "joi";

export const createSchoolSchema = Joi.object({
  siret: Joi.string().required().length(14),
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  managedBy: Joi.array().items(Joi.number()).required(),
  paymentMethodId: Joi.string().required(),
});
