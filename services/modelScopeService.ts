import { GalgameScript } from "../types";

const MODELSCOPE_API_BASE = "https://api-inference.modelscope.cn/v1";
const MODEL_NAME = "ZhipuAI/GLM-4.7";

export const analyzeStory = async (storyText: string): Promise<GalgameScript> => {
  const apiKey = process.env.MODELSCOPE_TOKEN;
  if (!apiKey) {
    throw new Error("MODELSCOPE_TOKEN environment variable is missing.");
  }

  const systemInstruction = `
    你是一位顶级的视觉小说(Galgame)导演和游戏设计师。
    你的任务是将提供的【线性小说】重构为一个【可交互的 Galgame 剧本】。

    ### 核心指令(请严格遵守):

    1. **控制选项频率(节奏感)**:
       - **不要**让每个节点都有分支选项。
       - 大部分时候,剧情应该是线性推进的。**请将剧情切分为一系列连续的节点**。
       - 对于线性推进的节点,请只提供**一个**选项,内容为"继续"、"..."或简单的动作描述。
       - **只有**在剧情关键转折点、需要玩家表达立场、或决定剧情走向时,才提供 2-3 个分支选项。
       - 理想比例:每 3-5 个线性对话节点,出现一次互动分支。

    2. **逻辑连续性(Context Memory)**:
       - 这是一个图结构剧本。请确保分支后的剧情逻辑严密。
       - 既然是基于线性小说改编,请确保无论玩家选择哪条路,核心信息都能以某种方式被玩家获知,或者剧情能合理地收束回主线(菱形叙事结构),除非导致了 Bad End。
       - 不要让角色在 B 分支中谈论只有 A 分支发生过的事情。

    3. **角色与演出**:
       - 旁白(narrator)应尽量减少,多通过角色对话来表达信息。
       - 提取角色的独特语气。

    4. **语言要求**:
       - 剧本内容必须是**简体中文**。
       - VisualPrompt 必须是英文。

    ### 结构输出要求:
    - **Scene**:当地点发生实质变化时才切换 Scene。
    - **VisualPrompt**:用于生成背景图的英文提示词,需包含光照、风格(Noir/Cyberpunk/Industrial)描述。

    ### 输出格式:
    请返回严格的 JSON 格式,符合以下结构:
    {
      "title": "string",
      "synopsis": "string",
      "characters": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "visualTraits": "string"
        }
      ],
      "scenes": [
        {
          "id": "string",
          "description": "string",
          "mood": "string",
          "visualPrompt": "string (optional)"
        }
      ],
      "startNodeId": "string",
      "nodes": [
        {
          "id": "string",
          "sceneId": "string",
          "characterId": "string or null",
          "text": "string",
          "isEnding": "boolean (optional)",
          "choices": [
            {
              "text": "string",
              "nextNodeId": "string",
              "moodEffect": "string (optional)"
            }
          ]
        }
      ]
    }

    所有非结局节点(isEnding: false)必须至少包含一个 choice。
    如果是线性剧情,choice 数组中只放一个指向下一节点的选项即可。

    **重要**: 你的回复必须是纯 JSON,不要包含任何其他文本、解释或markdown标记。
  `;

  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: systemInstruction
      },
      {
        role: "user",
        content: `请将这部小说文本转化为剧本,重点是保持阅读的流畅性,不要过于频繁地打断玩家,只在关键时刻给出选项。\n\n小说内容:\n${storyText}`
      }
    ],
    temperature: 0.7,
    top_p: 0.9
  };

  try {
    const response = await fetch(`${MODELSCOPE_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("ModelScope API Error:", errorData);
      throw new Error(`ModelScope API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // OpenAI format: data.choices[0].message.content
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Unexpected response structure:", data);
      throw new Error("No content in ModelScope API response.");
    }

    // Parse the JSON response
    try {
      // Remove potential markdown code blocks if present
      let jsonText = content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const scriptData = JSON.parse(jsonText) as GalgameScript;
      return scriptData;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse ModelScope API response as JSON.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while calling ModelScope API.");
  }
};

/**
 * 为后续段落生成增量节点（OpenAI 格式）
 */
export const generateFollowUpNodes = async (
  characters: any[],
  scenes: any[],
  lastNodeText: string,
  segmentText: string
): Promise<{ nodes: any[] }> => {
  const apiKey = process.env.MODELSCOPE_TOKEN;
  if (!apiKey) {
    throw new Error("MODELSCOPE_TOKEN environment variable is missing.");
  }

  const systemInstruction = `
你是一位顶级的视觉小说（Galgame）导演和游戏设计师。
你的任务是将提供的【线性小说片段】重构为【后续的 Galgame 剧本节点】。

### 已有设定（请严格遵守）：

**角色列表**：
${characters.map(c => `- ${c.id}: ${c.name} - ${c.description}`).join('\n')}

**场景列表**：
${scenes.map(s => `- ${s.id}: ${s.description} (mood: ${s.mood})`).join('\n')}

**当前剧情进度（最后一段）**：
"${lastNodeText}"

### 核心指令：

1. **使用已有设定**：
   - 角色ID必须使用已有角色的ID
   - 场景ID必须使用已有场景的ID
   - 保持角色语气与设定一致

2. **节点命名规则**：
   - 新节点的ID格式必须为 "node_N"，N 从 ${Math.floor(Math.random() * 1000)} 开始递增
   - 每个choices中的nextNodeId必须正确指向后续节点ID

3. **节点衔接**：
   - 最后一个节点的choices数组为空（等待下一段）
   - 如果不是最后一段，确保有线性推进的单选项

4. **节奏控制**：
   - 将文本切分为3-5个连续的剧情节点
   - 大部分时候线性推进（单个choice）
   - 只在关键转折点提供2-3个分支选项

### 输出格式：
请返回严格的JSON格式，仅包含nodes数组：
{
  "nodes": [
    {
      "id": "string",
      "sceneId": "string",
      "characterId": "string or null",
      "text": "string",
      "choices": [
        {
          "text": "string",
          "nextNodeId": "string"
        }
      ]
    }
  ]
}

**重要**：你的回复必须是纯JSON，不要包含任何其他文本、解释或markdown标记。
`;

  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: systemInstruction
      },
      {
        role: "user",
        content: `请将以下小说片段转换为后续剧情节点：\n\n${segmentText}`
      }
    ],
    temperature: 0.7,
    top_p: 0.9
  };

  const response = await fetch(`${MODELSCOPE_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("ModelScope API Error:", errorData);
    throw new Error(`ModelScope API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    console.error("Unexpected response structure:", data);
    throw new Error("No content in ModelScope API response.");
  }

  // 清理 JSON
  let jsonText = content.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const result = JSON.parse(jsonText) as { nodes: any[] };
  return result;
};
