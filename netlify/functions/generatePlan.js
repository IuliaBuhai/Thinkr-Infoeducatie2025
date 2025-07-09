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

       let prompt = `Ești expert în educație, specializat în planuri de studiu eficiente pentru elevi de liceu.

          Date de intrare:  
          - Clasa: ${grade}  
          - Disciplina: ${subject}  
          - Subiect: "${title}"  
          - Zile disponibile: ${days || "N/A"}  
          - Ore pe zi: ${hours || "N/A"}  
          
          Creează un plan de studiu structurat pe zile. Pentru fiecare zi:  
          - Generează 2-4 taskuri  
          - Pentru fiecare task oferă: titlu, descriere clară, obiective, durata estimată în minute  
          - Combină teorie, exerciții practice și recapitulare  
          - Folosește metode de învățare activă (ex: exerciții, rezumate, întrebări)  
          - Folosește limbaj clar, adecvat clasei  
          
          Returnează **doar JSON valid**, fără explicații, în format:
          
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
