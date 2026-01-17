export interface ImageGenerationResult {
    url: string;
    taskId: string;
    status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
}

const BASE_PATH = "/api/v1/services/aigc/text2image/image-synthesis";
const TASK_PATH = "/api/v1/tasks";

const getEndpoint = (path: string) => {
    if (typeof window !== 'undefined') {
        return `/api/aliyun${path}`;
    }
    return `https://dashscope.aliyuncs.com${path}`;
};

const API_KEY = (typeof process !== 'undefined' ? (process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY) : null)
    || (import.meta as any).env?.VITE_ALIYUN_API_KEY
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

export const generateImage = async (prompt: string, type: 'sketch' | 'anime' | 'reality' = 'anime'): Promise<string> => {
    if (!API_KEY) {
        console.warn("[imageGenerationService] API_KEY missing. Skipping image generation.");
        return ""; // Return empty string to indicate no image generated, defaulting to placeholder.
    }

    const endpoint = getEndpoint(BASE_PATH);
    console.log(`[imageGenerationService] Generating image using endpoint: ${endpoint}`);

    // 1. Submit Generation Task
    const submitResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'X-DashScope-Async': 'enable' // Force async for image gen
        },
        body: JSON.stringify({
            model: "wanx-v1",
            input: {
                prompt: prompt
            },
            parameters: {
                style: type === 'anime' ? "<auto>" : "<auto>", // Wanx style parameter, or omit for default
                size: "1280*720",
                n: 1
            }
        })
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Image Gen Submit Failed: ${submitResponse.status} - ${errorText}`);
    }

    const submitData = await submitResponse.json();
    const taskId = submitData.output.task_id;
    console.log(`Image Generation Task Submitted: ${taskId}`);

    // 2. Poll for Completion
    return pollForImage(taskId);
};

const pollForImage = async (taskId: string, attempts = 0): Promise<string> => {
    const MAX_ATTEMPTS = 60; // 2 minutes max (2s interval)
    if (attempts >= MAX_ATTEMPTS) throw new Error("Image Generation Timed Out");

    await new Promise(r => setTimeout(r, 2000)); // Wait 2s

    const endpoint = getEndpoint(`${TASK_PATH}/${taskId}`);

    const checkResponse = await fetch(endpoint, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    if (!checkResponse.ok) {
        throw new Error(`Task Check Failed: ${checkResponse.status}`);
    }

    const checkData = await checkResponse.json();
    const status = checkData.output.task_status;

    console.log(`Task ${taskId} status: ${status}`);

    if (status === 'SUCCEEDED') {
        const url = checkData.output.results[0].url;
        return url;
    } else if (status === 'FAILED') {
        throw new Error(`Image Generation Failed: ${checkData.output.message}`);
    } else {
        return pollForImage(taskId, attempts + 1);
    }
};
