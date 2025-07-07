import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { grade, subject, title, days, hours } = JSON.parse(event.body);

    let prompt = `Creează un plan detaliat pentru clasa a ${grade}-a despre ${title} la ${subject}.`;

    if (days && hours) {
      prompt += ` Studentul are ${days} zile și ${hours} ore pe zi.`;
    } else if (days) {
      prompt += ` Studentul are ${days} zile disponibile.`;
    } else if (hours) {
      prompt += ` Studentul are ${hours} ore pe zi.`;
    } else {
      prompt += ` Creează un roadmap flexibil împărțit pe faze.`;
    }

    prompt += ` Răspunsul în format JSON:
{
  "plan": [
    {
      "day": 1,
      "tasks": [
        {
          "title": "Titlu",
          "description": "Descriere",
          "duration": 45
        }
      ]
    }
  ]
}`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = completion.data.choices[0].message.content;

    const plan = JSON.parse(rawContent);

    return {
      statusCode: 200,
      body: JSON.stringify(plan),
    };
  } catch (err) {
    console.error("Eroare:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Eroare la generare' }),
    };
  }
}
