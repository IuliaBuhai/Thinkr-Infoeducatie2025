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
    const { age, tasks, avgStudyTime, learnerType } = JSON.parse(event.body);

 
    const daysRo = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const today = new Date();
    const startDayIndex = today.getDay(); // 0 (Duminică) – 6 (Sâmbătă)

   
    const weekDaysOrdered = [];
    for (let i = 0; i < 7; i++) {
      weekDaysOrdered.push(daysRo[(startDayIndex + i) % 7]);
    }

    let prompt = `
Creează un plan detaliat de studiu pentru această săptămână. Planul trebuie să respecte următoarele:

- Fiecare zi a planului va fi exact una din următoarele, în această ordine:${weekDaysOrdered.map((d, i) => `${i + 1}. ${d}`).join("\n")} ,Asociază corect task-urile cu ziua potrivită și nu schimba ordinea.;
- Pentru fiecare zi, include 2–5 task-uri;
- Pentru fiecare task, include: titlu, descriere detaliată, durată (în minute sau ore daca sunt peste 60 de minute), resurse web și cărți;
- Studentul are ${age} ani, stilul său de învățare optim este: "${learnerType}";
- Are următoarele task-uri de finalizat (în ordinea priorității): ${tasks}, unele task-uri au detalii în paranteze, deci ai grijă să ți cont de ele ;
- Organizează sarcinile eficient și echilibrat.

Returnează DOAR JSON valid, în următorul format:

{
  "plan": [
    {
      "day": "Luni",
      "tasks": [
        {
          "title": "Titlu",
          "description": "Descriere detaliată...",
          "duration": 45,
          "resources": {
            "web": ["https://link1.com"],
            "books": ["Titlu carte"]
          }
        }
      ]
    }
    // până la 7 zile
  ]
}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
    });

    let raw = completion.choices[0].message.content;
  
    if (raw.startsWith("```json")) {
      raw = raw.replace(/```json|```/g, "").trim();
    }

    const plan = JSON.parse(raw);

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };

  } catch (err) {
    console.error("Error in generatePlan:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Eroare la generarea planului" }),
    };
  }
}
