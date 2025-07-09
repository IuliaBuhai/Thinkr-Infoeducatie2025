import OpenAI from "openai";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { grade, title, subject, days, hours } = JSON.parse(event.body);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

       let prompt = `Ești un expert în educație, specializat în crearea unor planuri de studiu avansate, clare și eficiente pentru elevi de liceu.

Date de intrare:
- Clasa: ${grade}
- Disciplina: ${subject}
- Subiect/Titlu principal: "${title}"
- Zile disponibile: ${days || "N/A"}
- Ore pe zi: ${hours || "N/A"}

Cerințe:
1. Împarte subiectul în taskuri clare pentru fiecare zi.
2. Pentru fiecare zi, generează 2-4 taskuri cu titlu, descriere scurtă, obiective, durata estimată în minute.
3. Include metode de învățare activă: exerciții practice, rezumate, întrebări, flashcard-uri.
4. Echilibrează teorie, practică și recapitulare.
5. Folosește limbaj clar, adecvat clasei.
6. Include un mic sfat motivațional sau recomandare pentru fiecare zi.
7. Returnează doar un JSON valid, fără alte explicații, în formatul:

[
  {
    "zi": 1,
    "taskuri": [
      {
        "titlu": "Titlul taskului",
        "descriere": "Descriere clară a ce trebuie făcut",
        "durata": 45
      }
    ]
  }
]
`;


    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;

    let plan;

    try {
      plan = JSON.parse(raw);
    } catch (jsonErr) {
      console.error("Invalid JSON from OpenAI:", raw);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Răspuns invalid de la OpenAI. Încearcă din nou." }),
      };
    }

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
