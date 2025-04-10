import { Response, Request, Router } from "express";
import rateLimit from "express-rate-limit";
import GroupModel from "../model/Group";
import Joi from "joi";
import Student from "../model/Student";

const router = Router();

// set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

router.get("/", async (req: Request, res: Response) => {
  try {
    const groups = await GroupModel.find();
    res.json(groups);
  } catch (error: any) {
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const group = await GroupModel.findById(req.params.id);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    return res.json(group);
  } catch (error) {
    return res.status(500).send("Server error");
  }
});

// validating the Group object to limit injections
const createGroupSchema = Joi.object({
  name: Joi.string().required(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createGroupSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }
  const { name, students } = value;
  const group = new GroupModel({
    name,
    students: students ?? [],
  });
  try {
    const savedGroup = await group.save();
    res.status(201).json(savedGroup);
  } catch (err: any) {
    res
      .status(400)
      .json({ message: "Error creating a Group", error: err.message });
  }
});

// validating the Group object to limit injections
const updateGroupSchema = Joi.object({
  name: Joi.string().optional(),
  students: Joi.array().items(Joi.string().hex().length(24)).optional(), // Students' ID
});

router.patch("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const { error, value } = updateGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const updatedGroup = await GroupModel.findByIdAndUpdate(
      req.params.id,
      value, // instead of req.body
      { new: true, runValidators: true }
    );
    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(updatedGroup);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await GroupModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json({ message: "Deleted group" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
