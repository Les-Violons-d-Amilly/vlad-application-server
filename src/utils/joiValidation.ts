import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    req.body = value;
    next();
  };
}
