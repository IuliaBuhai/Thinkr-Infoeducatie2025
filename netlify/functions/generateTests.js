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
    const { grade, subject, testTitle,details, userId } = JSON.parse(event.body);

    const prompt = `
Creează un test pentru disciplina "${subject}", destinat unui elev de clasa/ nivelul  ${grade}, pe tema "${testTitle}".

Cerințe:
- Testul trebuie să conțină exact 10 întrebări.
- Întrebările trebuie să fie de dificultate medie sau ridicată.
- Fiecare întrebare trebuie să aibă:
  - 4 variante de răspuns (a, b, c, d)
  - Doar un singur răspuns corect (indexul răspunsului corect între 0 și 3, în câmpul "correctIndex")
  - O explicație clară a răspunsului
  - urmareste cu strictete aceste detalii: ${details}
Formatul trebuie să fie JSON valid, astfel:

{
  "title": "Titlul testului",
  "questions": [
    {
      "question": "Textul întrebării...",
      "options": ["Răspuns A", "Răspuns B", "Răspuns C", "Răspuns D"],
      "correctIndex": 1,
      "explanation": "Explicația răspunsului..."
    }
  ]
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    let raw = completion.choices[0].message.content;

   
    if (raw.startsWith("```")) {
      raw = raw.replace(/```(json)?|```/g, "").trim();
    }

    let plan;
    try {
      plan = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parsing error:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI a returnat un JSON invalid." }),
      };
    }

    if (
      !plan?.title ||
      !Array.isArray(plan.questions) ||
      !plan.questions.every(q =>
        q.question && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctIndex === "number" &&
        typeof q.explanation === "string"
      )
    ) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Structura JSON generată este invalidă." }),
      };
    }


    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };

  } catch (err) {
    console.error("❌ generatePlan error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Eroare la generarea testului" }),
    };
  }
}
