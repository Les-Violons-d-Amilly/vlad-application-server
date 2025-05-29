import Joi from "joi";

export const updateLevelResultSchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  globalScore: Joi.number().optional(),
  noteReading: Joi.string().optional(),
  numberOfErrors: Joi.number().optional(),
  reactionTime: Joi.number().optional(),
  errorDetails: Joi.array().items(Joi.string()).optional(),
});
