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

    let prompt = `Ești un expert în educație și pedagogie, specializat în crearea planurilor de învățare eficiente pentru elevi de gimnaziu și liceu.

Creează un plan de studiu **extrem de detaliat și profesionist** pentru un elev din clasa a ${grade} care vrea să învețe despre **"${title}"** la disciplina **"${subject}"**.

Fiecare task din plan trebuie să includă:
- Un **titlu clar**.
- O **descriere didactică detaliată**, care să explice:
  - Ce trebuie făcut pas cu pas.
  - Tipul de exercițiu sau activitate.
  - Tehnici/metode didactice utilizate (ex: metoda Cornell, Feynman, Pomodoro etc).
  - Ce competențe sunt dezvoltate.
- O **durată estimativă (în minute)**.
- **Resurse recomandate** (cărți, articole web, videoclipuri, platforme educaționale), cu linkuri reale sau titluri de încredere.
`;

    if (days && hours) {
      prompt += `Elevul are la dispoziție ${days} zile, cu ${hours} ore alocate zilnic. Împarte planul pe zile. Fiecare zi trebuie să conțină 2–4 taskuri, diversificate ca format și metodologie.`;
    } else if (days) {
      prompt += `Elevul are la dispoziție ${days} zile în total. Împarte planul pe zile. Fiecare zi va avea taskuri echilibrate ca dificultate, progresive (de la ușor la avansat).`;
    } else if (hours) {
      prompt += `Elevul are la dispoziție ${hours} ore pe zi. Creează un plan organizat pe etape/faze logice de învățare, fiecare cu taskuri bine definite.`;
    } else {
      prompt += `Nu există constrângeri de timp. Creează un **roadmap flexibil**, structurat pe **etape de învățare** (ex: introducere, consolidare, aplicare), fiecare cu taskuri specifice. Fiecare task va avea și un indicator de dificultate estimativă (ușor / mediu / avansat).`;
    }

    prompt += `
Returnează **doar un JSON valid** în următorul format (fără explicații suplimentare, fără markdown):

{
  "plan": [
    {
      "day": 1,
      "tasks": [
        {
          "title": "Titlul taskului",
          "description": "Descriere completă a activității, ce trebuie făcut pas cu pas, metode folosite etc.",
          "duration": 45,
          "resources": [
            "https://resursa1.com",
            "Titlul unei cărți utile"
          ]
        }
      ]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
