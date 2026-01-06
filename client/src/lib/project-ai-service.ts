export interface ProjectResource {
  name: string;
  description: string;
}

export interface ProjectStep {
  instruction: string;
  subSteps?: string[];
}

export interface ProjectAnalysisResponse {
  resources: ProjectResource[];
  steps: ProjectStep[];
  code: string;
}

/**
 * Analyze a robotics/IoT project description and get structured response
 * @param description - The project description from the user
 * @returns Promise with the analysis response containing resources, steps, and code
 */
export async function analyzeProject(
  description: string
): Promise<ProjectAnalysisResponse> {
  if (!description || description.trim().length === 0) {
    throw new Error("Project description is required");
  }

  const response = await fetch("/api/groot/analyze-project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description: description.trim() }),
  });

  // Get response text first (can only read body once)
  const responseText = await response.text();

  // Check content type to ensure we're getting JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.error("[Project AI] Non-JSON response:", responseText.substring(0, 500));
    throw new Error(
      `Server returned non-JSON response (${contentType}). Status: ${response.status} ${response.statusText}. This might indicate the API route is not found or there's a server error.`
    );
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (e) {
      console.error("[Project AI] Failed to parse error response:", responseText.substring(0, 500));
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 200)}`
      );
    }
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  let data: ProjectAnalysisResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("[Project AI] Failed to parse JSON:", responseText.substring(0, 500));
    throw new Error("Invalid JSON response from server");
  }

  // Validate response structure
  if (!data.resources || !data.steps || !data.code) {
    throw new Error("Invalid response format from server");
  }

  return data;
}