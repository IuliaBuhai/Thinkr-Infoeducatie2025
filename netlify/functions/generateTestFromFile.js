import OpenAI from "openai";
import Busboy from "busboy";
import { Buffer } from "buffer";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {

    const bb = Busboy({ headers: event.headers });
    let fileBuffer = null;
    let grade = null;
    let subject = null;
    let testTitle = null;

    await new Promise((resolve, reject) => {
      bb.on("file", (name, file, info) => {
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on("field", (name, val) => {
        if (name === "grade") grade = val;
        if (name === "subject") subject = val;
        if (name === "testTitle") testTitle = val;
      });

      bb.on("error", reject);
      bb.on("finish", resolve);

      bb.end(Buffer.from(event.body, "base64")); 
    });

    if (!fileBuffer) throw new Error("No file uploaded");

    const text = fileBuffer.toString("utf-8");


    const prompt = `
Generează un test cu 10 întrebări grilă pe baza textului de mai jos.
- Fiecare întrebare are 4 opțiuni (a, b, c, d) și un singur răspuns corect
- Include un câmp "explanation" pentru fiecare întrebare
- Returnează DOAR JSON valid, în formatul:

{
  "title": "${testTitle}",
  "questions": [
    {
      "question": "Întrebarea...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explicația..."
    }
  ]
}

Text sursă:
"""
${text}
"""
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    let raw = completion.choices[0].message.content;
    if (raw.startsWith("```")) raw = raw.replace(/```(json)?|```/g, "").trim();

    const plan = JSON.parse(raw);

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };

  } catch (err) {
    console.error("generateTestFromFile error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Eroare la generarea testului din fișier" }),
    };
  }
}
