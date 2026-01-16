import { config } from "dotenv";
config();
import { analyzeStory } from "./services/modelScopeService.js";

const testText = "这是一个简单的测试故事：小明走进咖啡店，看到一位美丽的女孩坐在窗边。他犹豫了一下，最终鼓起勇气走过去打招呼。";

console.log("正在测试 ModelScope API key...");
console.log("=" .repeat(40));

try {
  const result = await analyzeStory(testText);
  console.log("API Key 验证成功！");
  console.log("\n返回结果概要:");
  console.log(`- 标题: ${result.title}`);
  console.log(`- 概要: ${result.synopsis}`);
  console.log(`- 角色数: ${result.characters.length}`);
  console.log(`- 场景数: ${result.scenes.length}`);
  console.log(`- 节点数: ${result.nodes.length}`);
  console.log("\nAPI Key 有效，可以正常使用。");
} catch (error) {
  console.error("\nAPI Key 验证失败:");
  console.error(error.message);
  process.exit(1);
}
