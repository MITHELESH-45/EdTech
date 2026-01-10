import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, ".env") });

const apiKey = process.env.OPENAI_API_KEY;
console.log("Testing OpenAI Key:", apiKey ? "Present" : "Missing");

if (!apiKey) {
    process.exit(1);
}

const run = async () => {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: "Hello" }]
            })
        });

        if (!response.ok) {
            const data = await response.json();
            console.error("OpenAI Error:", JSON.stringify(data, null, 2));
        } else {
            const data = await response.json();
            console.log("Success:", data.choices[0].message.content);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
};

run();
