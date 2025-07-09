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

    let prompt = `Ești un expert în educație, pedagogie și domeniul academic, specializat în crearea unor planuri de studiu foarte avansate, detaliate și profesionale pentru elevi de liceu sau studenți.

Creează un plan de studiu pentru un elev din clasa a ${grade} care dorește să învețe temeinic despre subiectul "${title}" la disciplina "${subject}". Planul trebuie să fie structurat pe zile (sau faze, dacă nu sunt zile definite), să includă taskuri cu:

- Titlu clar și profesional,
- Obiective didactice și competențe dezvoltate în fiecare task,
- Descriere detaliată pas cu pas a ceea ce trebuie făcut,
- Metode și tehnici pedagogice explicate (ex: metoda Cornell, metoda Feynman, Pomodoro, etc.),
- Durata estimată în minute pentru fiecare task,
- Resurse recomandate reale, de încredere (cărți, articole, tutoriale video, platforme educaționale),
- Nivelul de dificultate pentru fiecare task (ușor, mediu, avansat).

Planul trebuie să cuprindă cel puțin:

1. O zi dedicată fundamentelor teoretice și formalismului, cu studiu aprofundat, metode de notare și vizualizare a conceptelor.
2. O zi pentru algoritmi, implementare practică, analiză de complexitate și rezolvare de probleme cu peer review.
3. O zi pentru aplicații practice, studii de caz, mini-proiecte și prezentări.
(Asta trebuie să conțină, nu 3 zile)
Fiecare zi va avea 2-3 taskuri clar diferențiate, care acoperă teoria, practica și reflecția critică.
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
Returnează **doar JSON valid** în următorul format (fără explicații suplimentare, fără markdown):

{
  "plan": [
    {
      "day": 1,
      "tasks": [
        {
          "title": "Titlul taskului",
          "description": "Descriere detaliată pas cu pas, obiective, metode didactice, competențe dezvoltate.",
          "duration": 60,
          "difficulty": "avansat",
          "resources": [
            "https://linkrelevant.com",
            "Titlul unei cărți de specialitate"
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
