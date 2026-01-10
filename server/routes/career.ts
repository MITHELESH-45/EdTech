import { Router, Request, Response } from "express";
import { getDatabase, getLoginCollection } from "../utils/mongodb";
import { ObjectId } from "mongodb";

const router = Router();

// OpenAI Configuration
const OPENAI_API_BASE = "https://api.openai.com/v1";
const OPENAI_CHAT_COMPLETIONS_URL = `${OPENAI_API_BASE}/chat/completions`;
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo";

// -----------------------------------------------------------------------------
// System Prompts
// -----------------------------------------------------------------------------

const MENTOR_SYSTEM_PROMPT = `You are an AI Career Mentor embedded inside a learning platform.

The platform supports the following career roles ONLY:
1. Embedded Systems Engineer
2. IoT Developer
3. Hardware Engineer
4. Robotics Engineer
5. Electronics Designer
6. Software Engineer

The platform provides these built-in tools that users can practice with:
- Code Editor (general programming)
- Coding Challenges
- Electronic Circuit Simulator
- IoT Simulator
- No-Code Editor
- Microcontroller programming (ESP, Arduino Nano)

CORE BEHAVIOR RULES:
1. Ask ONE question at a time.
2. Ask a maximum of 5 questions total.
3. Adapt the next question based on the user's previous answer.
4. Be encouraging, clear, and mentor-like (not robotic).
5. Do NOT generate any roadmap yet. Just gather information.
6. If the user selects a specific role, ask questions ONLY related to that role.
7. If the user selects "Know Your Path", ask exploratory questions to decide the BEST role among the 6 listed.

INFORMATION TO INFER (Do not ask explicitly unless needed):
- Skill level (beginner / intermediate / advanced)
- Interest orientation (hardware / software / mixed)
- Prior exposure
- Learning goal
- Time commitment

When you have enough information (after 5 questions), your final message should be EXACTLY: "READY_TO_GENERATE_ROADMAP"
`;

const ROADMAP_GENERATOR_PROMPT = `You are an expert technical career planner.
Create a STRICT 20-day personalized roadmap based on the user's conversation.

The platform supports these career roles ONLY:
1. Embedded Systems Engineer
2. IoT Developer
3. Hardware Engineer
4. Robotics Engineer
5. Electronics Designer
6. Software Engineer

The platform provides these built-in tools:
- Code Editor
- Coding Challenges
- Electronic Circuit Simulator
- IoT Simulator
- No-Code Editor
- Microcontroller programming (ESP, Arduino Nano)

OUTPUT FORMAT:
You must respond ONLY with valid JSON in this exact format:
{
  "careerDecision": {
    "role": "Selected Career Role",
    "reasoning": ["Reason 1", "Reason 2"],
    "readinessLevel": 0-100
  },
  "roadmap": [
    {
      "day": 1,
      "title": "Day Title",
      "concept": "Concept to learn",
      "learn": {
        "explanation": "Short explanation",
        "videoTopic": "Suggested video topic",
        "notes": "Notes summary"
      },
      "practice": "Practical task description",
      "tool": "One of the platform tools listed above",
      "completionCriteria": "What 'done' means"
    }
    // ... exactly 20 days
  ],
  "summary": {
    "totalDays": 20,
    "completionReward": {
      "skill": "Skill Name",
      "points": 500
    }
  }
}
`;

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

// GET /api/career - Get user's career paths
router.get("/", async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }

    const db = await getDatabase();
    
    if (role && typeof role === "string") {
      const careerPath = await db.collection("career_paths").findOne({ 
        userId, 
        "careerDecision.role": role 
      });
      return res.json(careerPath || null);
    }

    const careerPaths = await db.collection("career_paths").find({ userId }).toArray();
    res.json(careerPaths);
  } catch (error: any) {
    console.error("[Career] Error fetching career path:", error);
    res.status(500).json({ error: "Failed to fetch career path" });
  }
});

// POST /api/career/chat - Chat with the mentor
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, userId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    // Prepend system prompt if it's the first exchange or not present
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const fullMessages = [
      { role: "system", content: MENTOR_SYSTEM_PROMPT },
      ...sanitizedMessages
    ];

    const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: fullMessages,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("[Career] OpenAI error:", JSON.stringify(errorData, null, 2));
      return res.status(openaiResponse.status).json({ 
        error: "AI service error", 
        details: errorData.error?.message || "Unknown error from OpenAI" 
      });
    }

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content;

    res.json({ reply });
  } catch (error: any) {
    console.error("[Career] Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/career/generate - Generate the roadmap
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { messages, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    const fullMessages = [
      { role: "system", content: ROADMAP_GENERATOR_PROMPT },
      ...messages,
      { role: "user", content: "Generate the 20-day roadmap now based on our conversation. Return ONLY JSON." }
    ];

    const openaiResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: fullMessages,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      return res.status(500).json({ error: "AI generation failed" });
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content;
    
    let roadmapData;
    try {
      roadmapData = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const role = roadmapData.careerDecision?.role;
    if (!role) {
       return res.status(500).json({ error: "AI did not return a valid role" });
    }

    // Save to DB
    const db = await getDatabase();
    const careerPath = {
      userId,
      role, // Save role at top level for easy query
      ...roadmapData,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        completedDays: [],
        currentDay: 1,
        totalProgress: 0
      }
    };

    // Upsert based on userId AND role
    await db.collection("career_paths").updateOne(
      { userId, "careerDecision.role": role },
      { $set: careerPath },
      { upsert: true }
    );

    res.json(careerPath);
  } catch (error: any) {
    console.error("[Career] Generate error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/career/progress - Update progress
router.post("/progress", async (req: Request, res: Response) => {
  try {
    const { userId, day, completed, role } = req.body;

    if (!userId || !day || !role) {
      return res.status(400).json({ error: "Missing required fields: userId, day, role" });
    }

    const db = await getDatabase();
    const careerPath = await db.collection("career_paths").findOne({ 
      userId, 
      "careerDecision.role": role 
    });

    if (!careerPath) {
      return res.status(404).json({ error: "Career path not found" });
    }

    let completedDays = careerPath.progress?.completedDays || [];
    let pointsAwarded = 0;
    
    if (completed) {
      if (!completedDays.includes(day)) {
        completedDays.push(day);
        pointsAwarded = 50; // Award points for completion
      }
    } else {
      completedDays = completedDays.filter((d: number) => d !== day);
      pointsAwarded = -50; // Deduct points if unchecked (optional, but logical)
    }

    const totalDays = careerPath.summary.totalDays || 20;
    const totalProgress = Math.round((completedDays.length / totalDays) * 100);

    await db.collection("career_paths").updateOne(
      { userId, "careerDecision.role": role },
      { 
        $set: { 
          "progress.completedDays": completedDays,
          "progress.totalProgress": totalProgress,
          updatedAt: new Date()
        } 
      }
    );

    // Update User Points
    if (pointsAwarded !== 0) {
      const loginCollection = await getLoginCollection();
      await loginCollection.updateOne(
        { userId },
        { $inc: { activityPoints: pointsAwarded } }
      );
    }

    res.json({ success: true, completedDays, totalProgress, pointsAwarded });
  } catch (error: any) {
    console.error("[Career] Progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/career/reset - Delete a specific career path
router.post("/reset", async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: "User ID and Role are required" });
    }

    const db = await getDatabase();
    await db.collection("career_paths").deleteOne({ 
      userId, 
      "careerDecision.role": role 
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Career] Reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
