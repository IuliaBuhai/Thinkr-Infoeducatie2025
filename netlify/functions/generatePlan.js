
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
    const { grade, subject, title, days, hours } = JSON.parse(event.body);

     let prompt = `Creează un plan detaliat de studiu (planul va contine la fiecare task si resurse web, cărți, iar descrierea va fi foarte detaliată, explicând exact ce trebuie să facă, tpiul de exercițiu, sau tipul de tehnciă, metodă, foart clar explicată)pentru un student in clasa a ${grade} care vrea sa invețe despre ${title} la materia ${subject}.`;

    if (days && hours){
        prompt+= `studentul are la dispoziție ${days} la dispoziție și ${hours} ore pe zi . Împarte planul pe zile, pentru fiecare zi task-uri care au un titlu, o descriere, si durata estimată`
    }else if(days){
        prompt+= `studentul are la dispoziție ${days} la dispoziție Împarte planul pe zile, pentru fiecare zi taskificultatea estimată `
    }else if(hours){
        prompt+= `studentul are la dispoziție ${hours} ore pe zi .Împarte planul pe faze, pentru fiecare fază: task-uri care au un titlu, o descriere, si durata estimată`
    }else{
        prompt+=`creaaza un roadmap flexibil organizat în faze, nu pe timp, fiecare fază are un task cu un titlu, o descriere, și dificultatea estimată(ușor/mediu/greu)`
    }
    prompt += `
Returnează doar JSON în acest format:
{
  "plan": [
    {
      "day": 1,
      "tasks": [
        { "title": "Titlu", "description": "Descriere detaliată", "duration": 45 }
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
    const plan = JSON.parse(raw); 

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
