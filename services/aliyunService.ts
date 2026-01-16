import { GalgameScript } from "../types";

const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus";

export const analyzeStory = async (storyText: string): Promise<GalgameScript> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }

  const systemInstruction = `
    你是一位顶级的视觉小说(Galgame)导演和游戏设计师。
    你的任务是将提供的【线性小说】重构为一个【可交互的 Galgame 剧本】。

    ### 核心指令(请严格遵守):

    1. **控制选项频率与节点节奏**:
       - **不要**让每个节点都有分支选项。
       - **线性节点要求**: 大部分时候剧情是线性的。**每个线性节点必须包含一个 choice**,内容通常为"继续"或简单的动作描述,用于指向下一个节点。
       - **节点合并建议**: 对于连续的细微动作、神态描写(如: "他皱了皱眉。他叹了口气。"),可以合并为一个旁白节点。避免产生大量极其细碎的单句节点。
       - 只有剧情关键转折点才提供互动分支(2-3个)。
       - 确保生成的 JSON 紧凑高效,不要包含冗余的描述信息。

    2. **逻辑连续性(Context Memory)**:
       - 这是一个图结构剧本。请确保分支后的剧情逻辑严密。
       - 既然是基于线性小说改编,请确保无论玩家选择哪条路,核心信息都能以某种方式被玩家获知,或者剧情能合理地收束回主线(菱形叙事结构),除非导致了 Bad End。
       - 不要让角色在 B 分支中谈论只有 A 分支发生过的事情。

    3. **角色与演出**:
       - 旁白(narrator)应尽量减少,多通过角色对话来表达信息。
       - 提取角色的独特语气。
    
    4. **节点拆分规则 (配音需求 + Galgame 格式 - 极其重要!!!)**:
       
       **核心原则: 对话节点只包含纯粹的对话内容**
       
       - **对话节点 - 纯粹的角色台词**:
         * text 字段只包含角色说的话,不包含任何其他内容
         * ❌ 不要包含对话引导语: "XX说"、"XX问道"、"一个声音传来"等
         * ❌ 不要包含动作描写: "伸出一只手"、"拍了拍口袋"等  
         * ❌ 不要包含表情/状态描写: "叹了口气"、"犹豫了"等
         * ✅ 只保留角色直接说出的话
         * ⚠️ **极其重要**: 严禁截断对话正文的开头！确保对话的第一个汉字/标点符号完整保留。
         * characterId 指向说话的角色
         * 不要添加「」符号,前端会自动添加
       
       - **旁白节点 - 独立的叙述/描写**:
         * 环境描述、场景变化 → 独立节点
         * 角色动作、表情、状态 → 独立节点  
         * 对话引导语 → 可以省略或改为旁白节点
         * characterId 必须为 null
       
       **完整转换实例**:
       
       原文:
       "雨没有停。在新东京,雨已经下了三天三夜。
       凯尔靠在小巷满是涂鸦的墙上,检查着他的义肢手臂。
       '你迟到了,'一个声音从阴影中传来。
       是米拉。她走进了霓虹灯光中。
       '带来那个驱动器了吗?'她问道,伸出一只手。
       凯尔犹豫了。
       '我带了,'凯尔拍了拍口袋说。'但我需要知道你为什么要它。'"
       
       ✅ 正确拆分:
       [
         {id:"n1", characterId:null, text:"雨没有停。在新东京,雨已经下了三天三夜。"},
         {id:"n2", characterId:null, text:"凯尔靠在小巷满是涂鸦的墙上,检查着他的义肢手臂。"},
         {id:"n3", characterId:"mira", text:"你迟到了。"},  // 去掉"一个声音从阴影中传来"
         {id:"n4", characterId:null, text:"是米拉。她走进了霓虹灯光中。"},
         {id:"n5", characterId:"mira", text:"带来那个驱动器了吗?"},  // 去掉"她问道"
         {id:"n6", characterId:null, text:"她伸出一只手。"},  // 动作单独成节点
         {id:"n7", characterId:null, text:"凯尔犹豫了。"},
         {id:"n8", characterId:"kyle", text:"我带了。"},  // 去掉"拍了拍口袋说"
         {id:"n9", characterId:"kyle", text:"但我需要知道你为什么要它。"}
       ]
       
       ❌ 错误示例:
       {id:"bad1", characterId:"mira", text:"一个声音从阴影中传来。你迟到了。"}  // 包含引导语
       {id:"bad2", characterId:"mira", text:"带来那个驱动器了吗?她问道,伸出一只手。"}  // 包含动作
       {id:"bad3", characterId:"kyle", text:"凯尔拍了拍口袋说。我带了。"}  // 包含动作

    5. **语言要求**:
       - 剧本内容必须是**简体中文**。
       - VisualPrompt 必须是英文。

    ### 结构输出要求:
    - **Scene**:当地点发生实质变化时才切换 Scene。
    - **VisualPrompt**:用于生成背景图的英文提示词,需包含光照、风格(Noir/Cyberpunk/Industrial)描述。

    ### JSON 格式要求 (极其重要!!!):
    
    **你必须严格遵守 JSON 规范:**
    1. 所有字符串必须用双引号包裹
    2. 字符串内的特殊字符必须转义:
       - 双引号 " 必须写成 \\"
       - 反斜杠 \\ 必须写成 \\\\
       - 换行符必须写成 \\n
    3. 不要在 JSON 中使用中文引号「」『』
    4. text 字段中如果包含对话,不要使用双引号,改用单引号或其他符号
    
    示例正确格式:
    {
      "text": "你迟到了,一个声音从阴影中传来。"
    }
    
    示例错误格式(会导致解析失败):
    {
      "text": "你迟到了,"一个声音从阴影中传来。"
    }

    ### 输出 JSON 结构:
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
    
    **重要**: 你的回复必须是纯 JSON,不要包含任何其他文本、解释或markdown标记。确保所有引号都正确转义!
  `;

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
          content: `请将这部小说文本转化为剧本,重点是保持阅读的流畅性,不要过于频繁地打断玩家,只在关键时刻给出选项。\n\n小说内容:\n${storyText}`
        }
      ]
    },
    parameters: {
      result_format: "message",
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 3000,
      enable_search: false
    }
  };

  try {
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

    // Aliyun response structure: data.output.choices[0].message.content
    const content = data?.output?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Unexpected response structure:", data);
      throw new Error("No content in Aliyun API response.");
    }

    console.log(`API Response received. Length: ${content.length} characters.`);

    // Quick check for truncated JSON
    if (!content.trim().endsWith("}") && !content.trim().endsWith("```")) {
      console.warn("API response appears to be truncated.");
      // We'll still try to parse it, as the regex might find a valid object within it,
      // but this is a likely cause of failure for long stories.
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

      // Try to extract JSON object using regex if direct parsing fails
      let scriptData: GalgameScript;
      try {
        scriptData = JSON.parse(jsonText) as GalgameScript;
      } catch (firstError) {
        console.warn("Direct JSON parse failed, attempting regex extraction...");

        // Try to find JSON object in the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            scriptData = JSON.parse(jsonMatch[0]) as GalgameScript;
            console.log("Successfully extracted JSON using regex");
          } catch (regexError) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0].substring(0, 500));
            console.error("Regex parse error:", regexError);
            throw new Error("JSON 格式无效,请重试。模型返回的内容包含未转义的引号。");
          }
        } else {
          console.error("No JSON object found in response:", jsonText.substring(0, 500));
          throw new Error("响应中未找到有效的 JSON 对象");
        }
      }

      // Data transformation: ensure nodes array exists at top level and is normalized
      let normalizedNodes: any[] = [];

      if (scriptData.nodes && Array.isArray(scriptData.nodes)) {
        normalizedNodes = scriptData.nodes;
      } else if (scriptData.scenes && Array.isArray(scriptData.scenes)) {
        console.warn("No nodes found at top level, extracting from scenes...");
        scriptData.scenes.forEach((scene: any) => {
          if (scene.nodes && Array.isArray(scene.nodes)) {
            normalizedNodes.push(...scene.nodes);
          }
        });
      }

      if (normalizedNodes.length === 0) {
        console.error("No nodes found in response:", scriptData);
        throw new Error("生成的剧本缺少节点数据，请重试。");
      }

      // Deep normalization of each node
      scriptData.nodes = normalizedNodes.map((node: any, index: number) => {
        const isLastNode = index === normalizedNodes.length - 1;
        const choices = Array.isArray(node.choices) ? node.choices : [];

        // Auto-fix: If no choices are provided and it's not an ending or the last node, 
        // automatically link it to the next node to prevent a "Dead End".
        if (choices.length === 0 && !node.isEnding && !isLastNode) {
          const nextNode = normalizedNodes[index + 1];
          if (nextNode && nextNode.id) {
            choices.push({
              text: "继续",
              nextNodeId: nextNode.id
            });
          }
        }

        return {
          ...node,
          choices,
          // Ensure characterId is either string or null (never undefined)
          characterId: node.characterId === undefined ? null : (node.characterId === "narration" ? null : node.characterId),
          // Ensure text is always a string
          text: node.text || ""
        };
      });

      // Ensure the startNodeId is valid, if not, point to the first node
      if (!scriptData.nodes.find(n => n.id === scriptData.startNodeId) && scriptData.nodes.length > 0) {
        scriptData.startNodeId = scriptData.nodes[0].id;
      }

      console.log(`Script validated: ${scriptData.nodes.length} nodes, starting at ${scriptData.startNodeId}`);
      return scriptData;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content.substring(0, 1000));
      console.error("Parse error:", parseError);
      throw new Error(parseError instanceof Error ? parseError.message : "Failed to parse Aliyun API response as JSON.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while calling Aliyun API.");
  }
};
