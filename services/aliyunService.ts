import { GalgameScript, AnalysisProgress } from "../types";
import { generateOutline } from "./pipeline/OutcomeGenerator";
import { generateFragment } from "./pipeline/FragmentGenerator";
import { assembleScript } from "./pipeline/ScriptAssembler";
import { ScriptFragment } from "./pipeline/types";

// Reduced concurrency to 1 to prevent Rate Limiting (429) on large context
const CONCURRENCY_LIMIT = 1;

/**
 * Utility: Retry operation with exponential backoff
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  throw lastError;
}

/**
 * Main entry point for the Long Script Processing (LSP) Pipeline.
 */
export const analyzeStory = async (
  storyText: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<GalgameScript> => {
  console.log("🚀 Starting Long Script Processing (LSP) Pipeline...");
  const startTime = Date.now();

  try {
    // --- Stage 1: The Architect (Macro Analysis) ---
    console.log("Phase 1/4: Generating Story Outline...");
    onProgress?.({ phase: 'OUTLINE', current: 0, total: 100, message: "正在构思剧情大纲..." });

    const outline = await withRetry(() => generateOutline(storyText));
    onProgress?.({ phase: 'OUTLINE', current: 100, total: 100, message: "大纲构思完成。" });

    if (outline.beats.length === 0) {
      throw new Error("Story analysis failed: No beats generated.");
    }

    // --- Stage 2: The Director (Micro Expansion) ---
    console.log("Phase 2/4: Generating Script Fragments...");
    const BATCH_SIZE = 5;
    const beatChunks = [];
    for (let i = 0; i < outline.beats.length; i += BATCH_SIZE) {
      beatChunks.push(outline.beats.slice(i, i + BATCH_SIZE));
    }

    const fragments: ScriptFragment[] = [];

    const processBatch = async (batchBeats: typeof outline.beats, batchIndex: number) => {
      onProgress?.({
        phase: 'CHUNKS',
        current: batchIndex,
        total: beatChunks.length,
        message: `正在编写剧本细节 (${batchIndex + 1}/${beatChunks.length})...`
      });

      const nodes = await withRetry(() => generateFragment({
        storyText: storyText,
        characters: outline.characters,
        scenes: outline.scenes,
        beatsToProcess: batchBeats,
        previousContext: batchIndex > 0 ? "Previous batch context..." : undefined
      }));

      return { beatId: batchIndex, nodes: nodes };
    };

    for (let i = 0; i < beatChunks.length; i++) {
      const result = await processBatch(beatChunks[i], i);
      if (result.nodes && result.nodes.length > 0) {
        fragments.push(result);
      }
    }

    // --- Stage 3: The Assembler (Stitching) ---
    console.log("Phase 3/4: Assembling Final Script...");
    const finalScript = assembleScript(outline, fragments);

    // --- Phase 4: Visual Asset Generation (Pre-generation Mode) ---
    console.log("Phase 4/4: Generating Visual Assets (Wanx)...");

    // We need images for both individual nodes (CG/Items) AND background scenes
    const visualNodes = finalScript.nodes.filter(n => n.visualSpecs && !n.visualSpecs.imageUrl);
    const sceneAssets = finalScript.scenes.filter(s => !s.imageUrl);

    const totalAssets = visualNodes.length + sceneAssets.length;
    let assetsDone = 0;

    if (totalAssets > 0) {
      const { generateImage } = await import("./imageGenerationService");

      // 1. Generate Scene Backgrounds
      for (const scene of sceneAssets) {
        onProgress?.({
          phase: 'ASSETS',
          current: assetsDone,
          total: totalAssets,
          message: `正在准备背景场景: ${scene.description.slice(0, 15)}...`
        });

        try {
          // Use 'reality' or 'anime' based on scene description or default
          scene.imageUrl = await withRetry(() =>
            generateImage(scene.visualPrompt, 'reality')
          );
        } catch (err) {
          console.error(`❌ Failed to generate scene background [${scene.id}]:`, err);
        }
        assetsDone++;
      }

      // 2. Generate Node Assets (CG/Items)
      for (let i = 0; i < visualNodes.length; i++) {
        const node = visualNodes[i];
        if (!node.visualSpecs) continue;

        onProgress?.({
          phase: 'ASSETS',
          current: assetsDone,
          total: totalAssets,
          message: `正在生成特写/道具 (${i + 1}/${visualNodes.length}): ${node.visualSpecs.description.slice(0, 15)}...`
        });

        try {
          const imageUrl = await withRetry(() =>
            generateImage(node.visualSpecs!.visualPrompt, node.visualSpecs!.type === 'cg' ? 'reality' : 'anime')
          );
          node.visualSpecs.imageUrl = imageUrl;
        } catch (err) {
          console.error(`❌ Failed to generate node asset:`, err);
        }
        assetsDone++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ LSP Pipeline Complete in ${duration}s. Script Ready.`);

    return finalScript;

  } catch (error) {
    console.error("❌ LSP Pipeline Failed:", error);
    throw error;
  }
};
