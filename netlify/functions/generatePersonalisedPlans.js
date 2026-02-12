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
    const dateOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    const baseDate = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
    
      const roDay = daysRo[(startDayIndex + i) % 7];
      const formattedDate = date.toLocaleDateString("ro-RO", dateOptions);
    
      weekDaysOrdered.push(`${roDay}: ${formattedDate}`);
    }


    let prompt = `
        Creează un plan detaliat de studiu pentru această săptămână, respectând următoarele reguli:
        
        - Fiecare zi va avea eticheta exactă în formatul: ${weekDaysOrdered.join(", ")}, pe care trebuie să o folosești în răspuns.
        - Pentru fiecare zi, include între 2 și 10 task-uri, organizate echilibrat în timp.
        - Task-urile pot fi recurente (zilnic) sau punctuale (în zile specifice), respectă cerințele din lista de task-uri.
        - Pentru fiecare task, oferă:
          * titlu clar,
          * descriere detaliată a activității,
          * durată exprimată în minute (dacă este mai mare de 60 minute, folosește formatul "X ore Y minute", de ex: "2 ore 30 minute"),
          * resurse web (2-3 linkuri relevante) și cărți recomandate (titlu și autor) – dacă nu sunt resurse, scrie "nu este cazul".
        - Studentul are ${age} ani și stilul său de învățare optim este: "${learnerType}".
        - Următoarele detalii trebuie incluse: ${tasks}.
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
                },
                ...
              ]
            },
            ...
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
