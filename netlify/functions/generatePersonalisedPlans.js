import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { age, tasks, avgStudyTime, learnerType } = JSON.parse(event.body);

    const daysRo = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const today = new Date();
    const startDayIndex = today.getDay();
    const weekDaysOrdered = [];

    const dateOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    const baseDate = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      const roDay = daysRo[(startDayIndex + i) % 7];
      const formattedDate = date.toLocaleDateString("ro-RO", dateOptions);
      weekDaysOrdered.push(`${roDay}: ${formattedDate}`);
    }

    const prompt = `
Creează un plan detaliat de studiu pentru această săptămână, respectând următoarele reguli:

- Fiecare zi va avea eticheta exactă în formatul: ${weekDaysOrdered.join(", ")}, pe care trebuie să o folosești în răspuns.
- Pentru fiecare zi, include între 2 și 10 task-uri, organizate echilibrat în timp.
- Task-urile pot fi recurente (zilnic) sau punctuale (în zile specifice), respectă cerințele din lista de task-uri.
- Pentru fiecare task, oferă:
  * titlu clar,
  * descriere detaliată a activității,
  * durată exprimată în minute (dacă este mai mare de 60 minute, folosește formatul "X ore Y minute"),
  * resurse web (2-3 linkuri relevante) și cărți recomandate (titlu și autor) – dacă nu sunt resurse, scrie "nu este cazul".
- Studentul are ${age} ani și stilul său de învățare optim este: "${learnerType}".
- Următoarele task-uri trebuie incluse, în ordinea priorității, respectând detaliile din paranteze: ${tasks}.
- Organizează sarcinile astfel încât să nu fie prea încărcate în aceeași zi și să existe varietate.
- Dacă un task este zilnic (ex: pregătire bac română 2 ore pe zi), asigură-te că îl adaugi în fiecare zi.
- Fii creativ și oferă sugestii utile în descriere și resurse reale.
- Returnează DOAR un JSON valid în formatul următor:

{
  "plan": [
    {
      "day": "Luni",
      "tasks": [
        {
          "title": "Titlu task",
          "description": "Descriere detaliată a activității...",
          "duration": "X ore Y minute",
          "resources": {
            "web": ["https://exemplu1.com", "https://exemplu2.com"],
            "books": ["Titlu carte - Autor", "Altă carte - Autor"]
          }
        }
      ]
    }
  ]
}
`;

    const completion = await anthropic.chat.completions.create({
      model: "claude-3",
      messages: [{ role: "user", content: prompt }],
      max_tokens_to_sample: 4000,
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
    console.error("Claude error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Eroare la generarea planului" }),
    };
  }
}
