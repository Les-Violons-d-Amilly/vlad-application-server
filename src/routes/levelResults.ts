import { Router, Request, Response } from "express";
import LevelResultDocument from "../model/LevelResult";
import * as levelResultService from "../service/levelResult";
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
  /**
   * @openapi
   * /api/levelResults:
   *   get:
   *     tags:
   *       - LevelResults
   *     summary: Get all level results
   *     responses:
   *       200:
   *         description: Success
   *       500:
   *         description: Server error
   */
  try {
    const levelResults = await levelResultService.getLevelResults();
    res.json(levelResults);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  /**
   * @openapi
   * /api/levelResults/{id}:
   *   get:
   *     tags:
   *       - LevelResults
   *     summary: Get a level result by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the level result
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Success
   *       404:
   *         description: LevelResult not found
   *       500:
   *         description: Server error
   */
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

router.get(
  "/category/:category",
  async (req: Request, res: Response): Promise<any> => {
    /**
     * @openapi
     * /api/levelResults/category/{category}:
     *   get:
     *     tags:
     *       - LevelResults
     *     summary: Get level results by category
     *     parameters:
     *       - name: category
     *         in: path
     *         required: true
     *         description: Category of the level results
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *       404:
     *         description: LevelResults not found for the category
     *       500:
     *         description: Server error
     */
    const category = req.params.category;
    try {
      const levelResults = await levelResultService.getLevelResultsByCategory(
        category
      );
      if (!levelResults || levelResults.length === 0) {
        return res.status(404).send("LevelResults not found for the category");
      }
      res.json(levelResults);
    } catch (error) {
      res.status(500).send("Server error");
    }
  }
);

router.post("/", async (req: Request, res: Response) => {
  /**
   * @openapi
   * /api/levelResults:
   *   post:
   *     tags:
   *       - LevelResults
   *     summary: Create a new level result
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               category:
   *                 type: string
   *               globalScore:
   *                 type: number
   *               noteReading:
   *                 type: number
   *               numberOfErrors:
   *                 type: number
   *               reactionTime:
   *                 type: number
   *               errorDetails:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: LevelResult created successfully
   */
  const {
    name,
    category,
    globalScore,
    noteReading,
    numberOfErrors,
    reactionTime,
    errorDetails,
  } = req.body;

  const levelResult = new LevelResultDocument({
    name,
    category,
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
    res.status(200).json(savedLevelResult);
  } catch (error) {
    res.status(400).json({ message: "Error creating an LevelResult" });
  }
});

router.patch(
  "/:id",
  validateBody(updateLevelResultSchema),
  async (req: Request, res: Response): Promise<any> => {
    /**
     * @openapi
     * /api/levelResults/{id}:
     *   patch:
     *     tags:
     *       - LevelResults
     *     summary: Update a level result by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the level result
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               category:
     *                 type: string
     *               globalScore:
     *                 type: number
     *               noteReading:
     *                 type: number
     *               numberOfErrors:
     *                 type: number
     *               reactionTime:
     *                 type: number
     *               errorDetails:
     *                 type: array
     *                 items:
     *                   type: string
     */
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
  /**
   * @openapi
   * /api/levelResults/{id}:
   *   delete:
   *     tags:
   *       - LevelResults
   *     summary: Delete a level result by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the level result
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: LevelResult deleted successfully
   *       404:
   *         description: LevelResult not found
   */
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
