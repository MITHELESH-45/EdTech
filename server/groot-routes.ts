import type { Express, Request, Response } from "express";

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
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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
}

