import type { Express, Request, Response } from "express";

// Global OpenAI configuration
const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_CHAT_COMPLETIONS_URL = `${OPENAI_API_BASE}/chat/completions`;
const OPENAI_IMAGE_GENERATIONS_URL = `${OPENAI_API_BASE}/images/generations`;

// Model configuration with per-route fallbacks
// Chat with GROOT
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo";
// Vision / image analysis
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";
// Image generation
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
// Structured project analysis (can be overridden separately)
const PROJECT_MODEL = process.env.OPENAI_PROJECT_MODEL || CHAT_MODEL;

const GROOT_SYSTEM_PROMPT = `You are GROOT, the AI learning assistant for the E-GROOTS platform.

You help students learn:
- Electronics fundamentals
- IoT concepts
- Arduino and ESP32
- Sensors and actuators
- Circuit basics

Rules:
- Be friendly, calm, and encouraging
- Explain step-by-step
- Use simple language
- Avoid unsafe instructions
- Do not execute code
- Do not hallucinate facts
- Stay educational

Always respond as GROOT with a helpful, educational tone.`;

/**
 * Register GROOT chat routes
 */
export function registerGrootRoutes(app: Express): void {
  // ==========================================================================
  // POST /api/groot/chat - Chat with GROOT AI assistant
  // ==========================================================================
  app.post("/api/groot/chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({
          error: "Message is required",
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.error("[GROOT] OPENAI_API_KEY not found in environment variables");
        return res.status(500).json({
          error: "AI service is not configured. Please contact support.",
        });
      }

      // Call OpenAI API
      const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: [
            {
              role: "system",
              content: GROOT_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: message.trim(),
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error("[GROOT] OpenAI API error:", {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData,
        });
        
        // Provide more specific error messages
        if (openaiResponse.status === 401) {
          return res.status(500).json({
            error: "AI service authentication failed. Please check API key configuration.",
          });
        } else if (openaiResponse.status === 429) {
          return res.status(500).json({
            error: "AI service rate limit exceeded. Please try again later.",
          });
        } else {
          return res.status(500).json({
            error: `Failed to get response from AI service: ${errorData.error?.message || openaiResponse.statusText}`,
          });
        }
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        console.error("[GROOT] Invalid response structure:", data);
        return res.status(500).json({
          error: "Invalid response from AI service",
        });
      }

      console.log("[GROOT] Successfully generated response");
      res.json({
        response: assistantMessage,
      });
    } catch (error: any) {
      console.error("[GROOT] Error processing chat request:", error);
      res.status(500).json({
        error: "An error occurred while processing your request",
      });
    }
  });

  // ==========================================================================
  // POST /api/groot/analyze-image - Analyze uploaded image with Vision API
  // ==========================================================================
  app.post("/api/groot/analyze-image", async (req: Request, res: Response) => {
    try {
      const { message, image } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({
          error: "Image is required (base64 encoded)",
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.error("[GROOT] OPENAI_API_KEY not found in environment variables");
        return res.status(500).json({
          error: "AI service is not configured. Please contact support.",
        });
      }

      // Extract base64 data (remove data:image/...;base64, prefix if present)
      const base64Image = image.includes(",") ? image.split(",")[1] : image;

      // Call OpenAI Vision API (using gpt-4o or gpt-4-vision-preview)
      const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: "system",
              content: GROOT_SYSTEM_PROMPT + "\n\nYou can analyze images related to electronics, circuits, components, and IoT devices. Describe what you see in detail and provide educational insights.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: message || "Analyze this image and explain what you see. Focus on any electronics components, circuits, or IoT devices visible.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error("[GROOT] OpenAI Vision API error:", {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData,
        });
        
        if (openaiResponse.status === 401) {
          return res.status(500).json({
            error: "AI service authentication failed. Please check API key configuration.",
          });
        } else if (openaiResponse.status === 429) {
          return res.status(500).json({
            error: "AI service rate limit exceeded. Please try again later.",
          });
        } else {
          return res.status(500).json({
            error: `Failed to analyze image: ${errorData.error?.message || openaiResponse.statusText}`,
          });
        }
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        console.error("[GROOT] Invalid response structure:", data);
        return res.status(500).json({
          error: "Invalid response from AI service",
        });
      }

      console.log("[GROOT] Successfully analyzed image");
      res.json({
        response: assistantMessage,
      });
    } catch (error: any) {
      console.error("[GROOT] Error processing image analysis request:", error);
      res.status(500).json({
        error: "An error occurred while processing your image",
      });
    }
  });

  // ==========================================================================
  // POST /api/groot/generate-image - Generate image using DALL-E
  // ==========================================================================
  app.post("/api/groot/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({
          error: "Prompt is required for image generation",
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.error("[GROOT] OPENAI_API_KEY not found in environment variables");
        return res.status(500).json({
          error: "AI service is not configured. Please contact support.",
        });
      }

      // Enhance prompt for electronics/educational context
      const enhancedPrompt = `Educational illustration: ${prompt}. Style: clean, technical, educational diagram or schematic style suitable for electronics learning.`;

      // Call OpenAI DALL-E API
      const openaiResponse = await fetch(OPENAI_IMAGE_GENERATIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error("[GROOT] OpenAI DALL-E API error:", {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData,
        });
        
        if (openaiResponse.status === 401) {
          return res.status(500).json({
            error: "AI service authentication failed. Please check API key configuration.",
          });
        } else if (openaiResponse.status === 429) {
          return res.status(500).json({
            error: "AI service rate limit exceeded. Please try again later.",
          });
        } else {
          return res.status(500).json({
            error: `Failed to generate image: ${errorData.error?.message || openaiResponse.statusText}`,
          });
        }
      }

      const data = await openaiResponse.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        console.error("[GROOT] Invalid response structure:", data);
        return res.status(500).json({
          error: "Invalid response from AI service",
        });
      }

      console.log("[GROOT] Successfully generated image");
      res.json({
        response: `I've generated an image based on your request: "${prompt}". Here it is!`,
        imageUrl: imageUrl,
      });
    } catch (error: any) {
      console.error("[GROOT] Error processing image generation request:", error);
      res.status(500).json({
        error: "An error occurred while generating the image",
      });
    }
  });

  // ==========================================================================
  // POST /api/groot/tts - Convert text to speech using OpenAI TTS
  // ==========================================================================
  app.post("/api/groot/tts", async (req: Request, res: Response) => {
    try {
      const { text } = req.body as { text?: string };

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
          error: "Text is required",
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("[GROOT] OPENAI_API_KEY not found for TTS");
        return res.status(500).json({
          error: "AI service is not configured. Please contact support.",
        });
      }

      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
          voice: process.env.OPENAI_TTS_VOICE || "alloy",
          input: text,
        }),
      });

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json().catch(() => ({}));
        console.error("[GROOT] OpenAI TTS API error:", {
          status: ttsResponse.status,
          statusText: ttsResponse.statusText,
          error: errorData,
        });
        return res.status(500).json({
          error:
            (errorData as any)?.error?.message ||
            `Failed to synthesize speech: ${ttsResponse.statusText}`,
        });
      }

      const audioArrayBuffer = await ttsResponse.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioBuffer.length.toString());
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error("[GROOT] Error processing TTS request:", error);
      return res.status(500).json({
        error: "An error occurred while generating speech",
      });
    }
  });

  // ==========================================================================
  // POST /api/groot/analyze-project - Analyze robotics/IoT project and return structured data
  // ==========================================================================
  app.post("/api/groot/analyze-project", async (req: Request, res: Response) => {
    try {
      const { description } = req.body;

      if (!description || typeof description !== "string" || description.trim().length === 0) {
        return res.status(400).json({
          error: "Project description is required",
        });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("[GROOT] OPENAI_API_KEY not found in environment variables");
        return res.status(500).json({
          error: "AI service is not configured. Please contact support.",
        });
      }

      const ROBOTICS_SYSTEM_PROMPT = `You are a Robotics and IoT expert assistant. Your task is to analyze project descriptions and provide structured JSON responses.

You must respond ONLY with valid JSON in this exact format:
{
  "resources": [
    {
      "name": "Component Name",
      "description": "Detailed description of what this component is and how it's used in the project"
    }
  ],
  "steps": [
    {
      "instruction": "Main step instruction",
      "subSteps": ["Optional sub-step 1", "Optional sub-step 2"]
    }
  ],
  "code": "Complete, ready-to-use code for the project (Arduino/ESP8266/C++ format)"
}

Rules:
- Be specific and technical
- Provide all necessary components with clear descriptions
- Break down steps logically
- Include complete, working code
- Use proper formatting and comments in code
- Focus on robotics, IoT, embedded systems, and electronics
- Ensure code is production-ready and well-commented`;

      // Call OpenAI API
      const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: PROJECT_MODEL,
          messages: [
            {
              role: "system",
              content: ROBOTICS_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Analyze this robotics/IoT project and provide the required components, step-by-step instructions, and complete embedded C code:\n\n${description.trim()}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error("[GROOT] OpenAI API error:", {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          error: errorData,
        });
        
        if (openaiResponse.status === 401) {
          return res.status(500).json({
            error: "AI service authentication failed. Please check API key configuration.",
          });
        } else if (openaiResponse.status === 429) {
          return res.status(500).json({
            error: "AI service rate limit exceeded. Please try again later.",
          });
        } else {
          return res.status(500).json({
            error: `Failed to analyze project: ${errorData.error?.message || openaiResponse.statusText}`,
          });
        }
      }

      const data = await openaiResponse.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        console.error("[GROOT] Invalid response structure:", data);
        return res.status(500).json({
          error: "Invalid response from AI service",
        });
      }

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(assistantMessage);
      } catch (parseError) {
        console.error("[GROOT] Failed to parse JSON response:", parseError);
        return res.status(500).json({
          error: "Invalid JSON response from AI service",
        });
      }

      // Validate response structure
      if (!parsedResponse.resources || !parsedResponse.steps || !parsedResponse.code) {
        console.error("[GROOT] Invalid response structure:", parsedResponse);
        return res.status(500).json({
          error: "Invalid response format from AI service",
        });
      }

      console.log("[GROOT] Successfully analyzed project");
      res.json(parsedResponse);
    } catch (error: any) {
      console.error("[GROOT] Error processing project analysis request:", error);
      res.status(500).json({
        error: "An error occurred while analyzing your project",
      });
    }
  });
}