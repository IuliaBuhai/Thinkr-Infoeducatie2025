import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { grade, subject, title, days, hours } = JSON.parse(event.body);

    let prompt = `Creează un plan detaliat de studiu (planul va conține la fiecare task și resurse web, cărți, iar descrierea va fi foarte detaliată, explicând exact ce trebuie să facă, tipul de exercițiu sau tehnică, metodă, foarte clar explicată) pentru un student în clasa a ${grade} care vrea să învețe despre ${title} la materia ${subject}. `;

    if (days && hours) {
      prompt += `Studentul are la dispoziție ${days} zile și ${hours} ore pe zi. Împarte planul pe zile, pentru fiecare zi task-uri care au un titlu, o descriere și durată estimată. `;
    } else if (days) {
      prompt += `Studentul are la dispoziție ${days} zile. Împarte planul pe zile, pentru fiecare zi task-uri cu dificultate estimată. `;
    } else if (hours) {
      prompt += `Studentul are la dispoziție ${hours} ore pe zi. Împarte planul pe faze, pentru fiecare fază task-uri care au titlu, descriere și durată estimată. `;
    } else {
      prompt += `Creează un roadmap flexibil organizat în faze, nu pe timp, fiecare fază are task-uri cu titlu, descriere și dificultate estimată (ușor/mediu/greu). `;
    }

    prompt += `
Returnează răspunsul doar în JSON valid, în acest format:

{
  "plan": [
    {
      "day": 1,
      "tasks": [
        {
          "title": "Titlu task",
          "description": "Ce să facă studentul",
          "duration": 45
        }
      ]
    }
  ]
}
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    const plan = JSON.parse(completion.data.choices[0].message.content);

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
}
