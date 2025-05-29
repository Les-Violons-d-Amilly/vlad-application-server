import LevelResult, { LevelResultDocument } from "../model/LevelResult";

export async function getLevelResults(): Promise<any> {
  try {
    const levelResults = await LevelResult.find();
    return levelResults;
  } catch (error: any) {
    throw new Error("Error fetching levelResults: " + error);
  }
}

export async function getLevelResultById(
  id: string
): Promise<LevelResultDocument | null> {
  try {
    const levelResult = await LevelResult.findById(id);
    return levelResult;
  } catch (error: any) {
    throw new Error("Error fetching levelResult by ID: " + error);
  }
}

export async function saveLevelResult(
  levelResultData: LevelResultDocument
): Promise<LevelResultDocument> {
  try {
    const newLevelResult = new LevelResult(levelResultData);
    await newLevelResult.save();
    return newLevelResult;
  } catch (error: any) {
    throw new Error("Error creating levelResult: " + error);
  }
}

export async function updateLevelResult(
  levelResultId: string,
  updateData: Partial<LevelResultDocument>
): Promise<LevelResultDocument | null> {
  try {
    const updatedLevelResult = await LevelResult.findByIdAndUpdate(
      levelResultId,
      updateData,
      { new: true }
    );
    return updatedLevelResult;
  } catch (error: any) {
    throw new Error("Error updating levelResult: " + error);
  }
}

export async function deleteLevelResult(
  levelResultId: string
): Promise<LevelResultDocument | null> {
  try {
    return await LevelResult.findByIdAndDelete(levelResultId);
  } catch (error: any) {
    throw new Error("Error deleting levelResult: " + error);
  }
}

export async function getLevelResultsByCategory(
  category: string
): Promise<LevelResultDocument[]> {
  try {
    const levelResults = await LevelResult.find({ category });
    return levelResults;
  } catch (error: any) {
    throw new Error("Error fetching levelResults by category: " + error);
  }
}
