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
    const {title, questions, score } = JSON.parse(event.body);

     const prompt = `
      Creează o lecție pentru testul intitulat "${title}". Lecția trebuie să acopere toate subiectele menționate în următoarele întrebări: ${questions}.
      Elevul a obținut un scor de ${score} puncte și dorește să-și îmbunătățească cunoștințele în acest domeniu.
      Răspunsul trebuie să conțină:
      - Paragrafe explicative,
      - Titluri de nivel 1-3 pentru structurare,
      - Să fie formatat în HTML valid (folosește tag-uri <p>, <h2>, <h3> etc.),
      Fără alte explicații suplimentare, doar conținutul lecției în format HTML.
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
    console.error("Error in generateLecture", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
}
