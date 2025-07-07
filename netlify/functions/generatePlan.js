
import OpenAI from "openai";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }


  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { grade, subject, title, days, hours } = JSON.parse(event.body);

    let prompt = `Creează un plan detaliat de studiu pentru un student în clasa a ${grade}-a care vrea să învețe despre ${title} la materia ${subject}.`;
    if (days && hours) {
      prompt += ` Studentul are ${days} zile și ${hours} ore pe zi.`;
    } else if (days) {
      prompt += ` Studentul are ${days} zile disponibile.`;
    } else if (hours) {
      prompt += ` Studentul are ${hours} ore pe zi.`;
    } else {
      prompt += ` Creează un roadmap flexibil organizat în faze.`;
    }
    prompt += `
Returnează doar JSON în acest format:
{
  "plan": [
    {
      "day": 1,
      "tasks": [
        { "title": "Titlu", "description": "Descriere detaliată", "duration": 45 }
      ]
    }
  ]
}
`;

  
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;
    const plan = JSON.parse(raw); 

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };

  } catch (err) {
    console.error("Error in generatePlan:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
}
