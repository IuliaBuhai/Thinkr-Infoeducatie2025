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

            1. Fiecare zi trebuie să aibă eticheta exactă din lista: ${weekDaysOrdered.join(", ")}.
            2. Pentru fiecare zi, include între numarul de task-uri necesare **Nu fiecare zi trebuie să conțină task-uri, dacă lista de task-uri oferită include activități pentru acea zi.**
            3. Task-urile trebuie să fie **doar din lista de task-uri furnizată**: ${tasks}. **Nu adăuga task-uri noi sau inventate.**
            4. Pentru fiecare task, oferă:
              - "title": un titlu clar,
              - "description": descriere detaliată și sugestii utile,
              - "duration": durata în minute sau "X ore Y minute" dacă > 60 minute,
              - "resources": 
                  * "web": 2-3 linkuri relevante sau "nu este cazul",
                  * "books": titlu și autor sau "nu este cazul".
            5. Studentul are ${age} ani și stilul său de învățare optim este "${learnerType}, si in medie invata ${avgStudyTime} minute pe zi".
            6. Organizează sarcinile astfel încât nicio zi să nu fie suprasolicitată și să existe varietate.
            7. Dacă un task este zilnic, adaugă-l în fiecare zi.Daca o zi nu are task-uri specifice, las-o goală sau adaugă un mesaj de tipul "Zi de relaxare sau revizuire".
            8. Fii creativ și oferă resurse reale și utile.
            9. Returnează **DOAR** un JSON valid în următorul format:

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
