import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { GalgameScript } from "../types";

// NOTE: We do not prompt for API Key here. It is assumed to be in process.env.API_KEY

const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeStory = async (storyText: string): Promise<GalgameScript> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    你是一位顶级的视觉小说（Galgame）导演和游戏设计师。
    你的任务是将提供的【线性小说】重构为一个【可交互的 Galgame 剧本】。

    ### 核心指令（请严格遵守）：

    1. **控制选项频率（节奏感）**：
       - **不要**让每个节点都有分支选项。
       - 大部分时候，剧情应该是线性推进的。**请将剧情切分为一系列连续的节点**。
       - 对于线性推进的节点，请只提供**一个**选项，内容为“继续”、“...”或简单的动作描述。
       - **只有**在剧情关键转折点、需要玩家表达立场、或决定剧情走向时，才提供 2-3 个分支选项。
       - 理想比例：每 3-5 个线性对话节点，出现一次互动分支。

    2. **逻辑连续性（Context Memory）**：
       - 这是一个图结构剧本。请确保分支后的剧情逻辑严密。
       - 既然是基于线性小说改编，请确保无论玩家选择哪条路，核心信息都能以某种方式被玩家获知，或者剧情能合理地收束回主线（菱形叙事结构），除非导致了 Bad End。
       - 不要让角色在 B 分支中谈论只有 A 分支发生过的事情。

    3. **角色与演出**：
       - 旁白（narrator）应尽量减少，多通过角色对话来表达信息。
       - 提取角色的独特语气。

    4. **语言要求**：
       - 剧本内容必须是**简体中文**。
       - VisualPrompt 必须是英文。

    ### 结构输出要求：
    - **Scene**：当地点发生实质变化时才切换 Scene。
    - **VisualPrompt**：用于生成背景图的英文提示词，需包含光照、风格（Noir/Cyberpunk/Industrial）描述。

    ### 输出格式：
    请返回严格的 JSON 格式，符合 GalgameScript 接口定义。
    所有非结局节点（isEnding: false）必须至少包含一个 choice。
    如果是线性剧情，choice 数组中只放一个指向下一节点的选项即可。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `请将这部小说文本转化为剧本，重点是保持阅读的流畅性，不要过于频繁地打断玩家，只在关键时刻给出选项。\n\n小说内容：\n${storyText}`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          synopsis: { type: Type.STRING },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                visualTraits: { type: Type.STRING },
              },
              required: ["id", "name", "description", "visualTraits"],
            },
          },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                description: { type: Type.STRING },
                mood: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
              },
              required: ["id", "description", "mood"],
            },
          },
          startNodeId: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sceneId: { type: Type.STRING },
                characterId: { type: Type.STRING, nullable: true },
                text: { type: Type.STRING },
                isEnding: { type: Type.BOOLEAN, nullable: true },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      nextNodeId: { type: Type.STRING },
                      moodEffect: { type: Type.STRING, nullable: true },
                    },
                    required: ["text", "nextNodeId"],
                  },
                },
              },
              required: ["id", "sceneId", "text", "choices"],
            },
          },
        },
        required: ["title", "characters", "scenes", "nodes", "startNodeId"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini.");
  }

  try {
    const data = JSON.parse(text) as GalgameScript;
    return data;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse Gemini response.");
  }
};