import { GalgameScript, StoryNode, Character, Scene, SegmentProgress, STORY_SEGMENT_THRESHOLD, SEGMENT_SIZE } from "../types";
import { analyzeStory } from "./aliyunService";

const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-max";

/**
 * 将故事文本切分成多个段落
 * 优先在段落边界、句号处切分，避免破坏语义
 */
export function splitStoryIntoSegments(text: string): string[] {
  if (text.length <= STORY_SEGMENT_THRESHOLD) {
    return [text]; // 不分段
  }

  const segments: string[] = [];
  let remaining = text.trim();

  while (remaining.length > SEGMENT_SIZE) {
    // 1. 尝试在段落边界切分
    let cutPoint = remaining.indexOf('\n\n', SEGMENT_SIZE - 500);

    // 2. 没有段落边界，尝试在句号切分
    if (cutPoint === -1 || cutPoint > SEGMENT_SIZE + 500) {
      cutPoint = remaining.indexOf('。', SEGMENT_SIZE - 200);
    }

    // 3. 强制切分
    if (cutPoint === -1 || cutPoint > SEGMENT_SIZE + 200) {
      cutPoint = SEGMENT_SIZE;
    }

    segments.push(remaining.slice(0, cutPoint + 1).trim());
    remaining = remaining.slice(cutPoint + 1).trim();
  }

  if (remaining.length > 0) {
    segments.push(remaining);
  }

  return segments;
}

/**
 * 为后续段落生成增量节点的系统指令
 */
function buildFollowUpSystemInstruction(
  characters: Character[],
  scenes: Scene[],
  lastNodeText: string
): string {
  return `
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
}

/**
 * 为后续段落生成增量节点
 */
async function generateFollowUpNodes(
  apiKey: string,
  characters: Character[],
  scenes: Scene[],
  lastNodeText: string,
  segmentText: string
): Promise<{ nodes: StoryNode[] }> {
  const systemInstruction = buildFollowUpSystemInstruction(characters, scenes, lastNodeText);

  const requestBody = {
    model: MODEL_NAME,
    input: {
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: `请将以下小说片段转换为后续剧情节点：\n\n${segmentText}`
        }
      ]
    },
    parameters: {
      result_format: "message",
      temperature: 0.7,
      top_p: 0.9,
    }
  };

  const response = await fetch(ALIYUN_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Aliyun API Error:", errorData);
    throw new Error(`Aliyun API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.output?.choices?.[0]?.message?.content;

  if (!content) {
    console.error("Unexpected response structure:", data);
    throw new Error("No content in Aliyun API response.");
  }

  // 清理 JSON
  let jsonText = content.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const result = JSON.parse(jsonText) as { nodes: StoryNode[] };
  return result;
}

/**
 * 流式分析故事
 * 对于长文本，分段排队调用API
 */
export const analyzeStoryStreamed = async (
  storyText: string,
  onProgress: (progress: SegmentProgress) => void,
  onChunk: (chunk: Partial<GalgameScript>) => void
): Promise<GalgameScript> => {
  const segments = splitStoryIntoSegments(storyText);
  const totalSegments = segments.length;

  console.log(`[StreamedService] Total segments: ${totalSegments}`);

  let baseConfig: {
    characters: Character[];
    scenes: Scene[];
    lastNodeId: string;
    lastNodeText: string;
  } | null = null;

  const allNodes: StoryNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    onProgress({
      currentSegment: i + 1,
      totalSegments,
      status: 'loading'
    });

    let result: Partial<GalgameScript>;

    if (i === 0) {
      // 第一段：完整生成
      console.log(`[StreamedService] Processing segment 1 (full script)...`);
      const fullScript = await analyzeStory(segments[0]);
      result = fullScript;

      baseConfig = {
        characters: fullScript.characters,
        scenes: fullScript.scenes,
        lastNodeId: fullScript.nodes[fullScript.nodes.length - 1].id,
        lastNodeText: fullScript.nodes[fullScript.nodes.length - 1].text
      };
      allNodes.push(...fullScript.nodes);

      // 触发首次更新，包含完整剧本
      onChunk({
        ...fullScript,
        nodes: [...fullScript.nodes] // 复制数组
      });
    } else {
      // 后续段：增量生成
      console.log(`[StreamedService] Processing segment ${i + 1} (follow-up nodes)...`);

      if (!baseConfig) {
        throw new Error("Base config not available for follow-up generation");
      }

      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY environment variable is missing.");
      }

      const followUp = await generateFollowUpNodes(
        apiKey,
        baseConfig.characters,
        baseConfig.scenes,
        baseConfig.lastNodeText,
        segments[i]
      );

      // 修复：将前一个节点的最后一个choice指向新生成的第一个节点
      if (allNodes.length > 0 && followUp.nodes.length > 0) {
        const lastNode = allNodes[allNodes.length - 1];
        if (lastNode.choices.length === 1 && lastNode.choices[0].nextNodeId === lastNode.id) {
          // 线性节点，更新nextNodeId
          lastNode.choices[0].nextNodeId = followUp.nodes[0].id;
        } else if (lastNode.choices.length === 0) {
          // 无choice，添加线性选项
          lastNode.choices.push({
            text: "继续",
            nextNodeId: followUp.nodes[0].id
          });
        }
      }

      baseConfig.lastNodeId = followUp.nodes[followUp.nodes.length - 1].id;
      baseConfig.lastNodeText = followUp.nodes[followUp.nodes.length - 1].text;

      allNodes.push(...followUp.nodes);

      // 触发增量更新，只包含新增节点
      onChunk({
        nodes: [...followUp.nodes]
      });
    }

    onProgress({
      currentSegment: i + 1,
      totalSegments,
      status: 'complete'
    });
  }

  // 返回完整剧本
  if (baseConfig) {
    return {
      title: "流式生成剧本",
      synopsis: "由多段文本生成的交互式Galgame剧本",
      characters: baseConfig.characters,
      scenes: baseConfig.scenes,
      nodes: allNodes,
      startNodeId: allNodes[0]?.id || ""
    };
  }

  throw new Error("Failed to generate complete script");
};

/**
 * 检查是否需要启用流式加载
 */
export function shouldUseStreaming(text: string): boolean {
  return text.length > STORY_SEGMENT_THRESHOLD;
}
