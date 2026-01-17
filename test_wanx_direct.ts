import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API KEY found in .env.local");
    process.exit(1);
}

console.log("Testing Wanx API with Key ending in:", API_KEY.slice(-4));

const runTest = async () => {
    // 1. Submit
    console.log("Submitting task...");
    const submitRes = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
            "X-DashScope-Async": "enable"
        },
        body: JSON.stringify({
            model: "wanx-v1",
            input: {
                prompt: "A beautiful anime style garden, cherry blossoms, sunlight",
            },
            parameters: {
                style: "<auto>",
                size: "1280*720",
                n: 1
            }
        })
    });

    if (!submitRes.ok) {
        console.error("Submit Failed:", await submitRes.text());
        return;
    }

    const submitData = await submitRes.json() as any;
    console.log("Submit Response:", submitData);

    // Check if task_id exists (structure might vary depending on API version)
    // Wanx v1 usually returns output.task_id
    const taskId = submitData.output?.task_id;
    if (!taskId) {
        console.error("No task ID returned!");
        return;
    }

    console.log(`Task ID: ${taskId}. Polling...`);

    // 2. Poll
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        process.stdout.write(".");

        const checkRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        });

        const checkData = await checkRes.json() as any;
        const status = checkData.output.task_status;

        if (status === 'SUCCEEDED') {
            console.log("\n✅ Success!");
            console.log("Image URL:", checkData.output.results[0].url);
            return;
        } else if (status === 'FAILED') {
            console.error("\n❌ Task Failed:", checkData.output.message || checkData.output);
            return;
        }
    }
    console.log("\nTimeout waiting for image.");
};

runTest();
