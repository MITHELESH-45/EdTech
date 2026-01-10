
async function test() {
  try {
    const response = await fetch("http://localhost:5000/api/career/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }], userId: "test-user" })
    });
    
    const contentType = response.headers.get("content-type");
    console.log("Status:", response.status);
    console.log("Content-Type:", contentType);
    
    const text = await response.text();
    if (text.trim().startsWith("<!DOCTYPE")) {
        console.log("Received HTML (Likely 404 fallback to index.html)");
    } else {
        console.log("Received Response:", text.substring(0, 200));
    }
  } catch (e) {
    console.error("Connection failed:", e.message);
  }
}

test();
