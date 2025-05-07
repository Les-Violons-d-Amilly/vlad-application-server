import { Router, Request, Response } from "express";
import LevelResultDocument from "../model/LevelResult";
import * as levelResultService from "../service/levelResult";
import Joi from "joi";
import rateLimit from "express-rate-limit";
import { validateBody } from "../utils/joiValidation";
import { updateLevelResultSchema } from "../validation/levelResultSchemas";

const router = Router();

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use(limiter);

router.get("/", async (req: Request, res: Response) => {
  try {
    const levelResults = await levelResultService.getLevelResults();
    res.json(levelResults);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const levelResult = await levelResultService.getLevelResultById(id);
    if (!levelResult) {
      return res.status(404).send("LevelResult not found");
    }
    res.json(levelResult);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.post("/", async (req: Request, res: Response) => {
  const {
    name,
    globalScore,
    noteReading,
    numberOfErrors,
    reactionTime,
    errorDetails,
  } = req.body;

  const levelResult = new LevelResultDocument({
    name,
    globalScore,
    noteReading,
    numberOfErrors,
    reactionTime,
    errorDetails,
    date: new Date(),
  });

  try {
    const savedLevelResult = await levelResultService.saveLevelResult(
      levelResult
    );
    res.status(201).json(savedLevelResult);
  } catch (error) {
    res.status(400).json({ message: "Error creating an LevelResult" });
  }
});

router.patch(
  "/:id",
  validateBody(updateLevelResultSchema),
  async (req: Request, res: Response): Promise<any> => {
    try {
      const updatedLevelResult = await levelResultService.updateLevelResult(
        req.params.id,
        req.body
      );

      if (!updatedLevelResult) {
        return res.status(404).json({ message: "LevelResult not found" });
      }

      res.json(updatedLevelResult);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await levelResultService.deleteLevelResult(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "LevelResult not found" });
    }

    res.json({ message: "Deleted LevelResult" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
