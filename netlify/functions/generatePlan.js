import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, 
});

const openai = new OpenAIApi(configuration);

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { grade, subject, title, days, hours } = JSON.parse(event.body);

  let prompt = `Creează un plan detaliat de studiu (planul va conține la fiecare task și resurse web, cărți, iar descrierea va fi foarte detaliată) pentru un student în clasa a ${grade}-a care vrea să învețe despre ${title} la materia ${subject}.`;

  if (days && hours) {
    prompt += ` Studentul are la dispoziție ${days} zile și ${hours} ore pe zi. Împarte planul pe zile, fiecare zi cu task-uri care au un titlu, o descriere, și durata estimată.`;
  } else if (days) {
    prompt += ` Studentul are la dispoziție ${days} zile. Împarte planul pe zile, fiecare zi cu task-uri și dificultatea estimată.`;
  } else if (hours) {
    prompt += ` Studentul are la dispoziție ${hours} ore pe zi. Împarte planul pe faze, fiecare fază conține task-uri care au un titlu, o descriere, și durata estimată.`;
  } else {
    prompt += ` Creează un roadmap flexibil organizat în faze. Fiecare fază are un task cu titlu, descriere și dificultate estimată (ușor/mediu/greu).`;
  }

  prompt += `
Returnează răspunsul strict în acest format:
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

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const rawContent = completion.data.choices[0].message.content;

    const plan = JSON.parse(rawContent);

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };

  } catch (err) {
    console.error("Error from OpenAI or JSON:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Eroare la generarea planului" }),
    };
  }
}
