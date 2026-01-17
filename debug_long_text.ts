import { analyzeStory } from './services/aliyunService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Construct a massive text input
const CHAPTER_ONE = `第一章 绯红\n痛！\n好痛！\n头好痛！\n此处省略一万字...`;
// In reality, we'd use the user's provided text, but for brevity in code I'll multiply it.
// The user provided ~3000 chars. Let's multiply it by 20 to get 60,000 chars.
// A standard novel chapter is 3k-5k words. 3 chapters is ~15k chars.

const BASE_TEXT = `第一章 绯红
痛！好痛！头好痛！
光怪陆离满是低语的梦境迅速支离破碎...
(此处模拟大量重复文本以触发 Token 限制)
`;

// Create ~60k characters of text
const LONG_TEXT = new Array(200).fill(BASE_TEXT).join("\n\n");

console.log(`Starting reproduction test with text length: ${LONG_TEXT.length} characters...`);

analyzeStory(LONG_TEXT)
    .then(script => {
        console.log("✅ Success! Script generated with", script.nodes.length, "nodes.");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Reproduction Failed:", err);
        process.exit(1);
    });
