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
    const { grade, subject, testTitle } = JSON.parse(event.body);
    
    let prompt = `
          Creează un test pentru disciplina "${subject}", destinat unui elev de clasa a ${grade}-a, pe tema "${testTitle}".

          Cerințe:
          - Testul trebuie să conțină exact 10 întrebări.
          - Întrebările vor fi de dificultate medie și ridicată.
          - Fiecare întrebare va avea:
            - 4 variante de răspuns (a, b, c, d)
            - Un singur răspuns corect (indicați indexul corect 0-3)
            - O explicație clară a rezolvării.

          Format de ieșire (JSON):

          {
            "title": "Titlul testului",
            "questions": [
              {
                "question": "Întrebarea 1...",
                "options": ["Răspuns A", "Răspuns B", "Răspuns C", "Răspuns D"],
                "correctIndex": 0,
                "explanation": "Explicația detaliată..."
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

    
    const transformedPlan = {
      ...plan,
      questions: plan.questions.map(q => ({
        ...q,
        
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : 
                     (q.correctAnswers && q.correctAnswers.length ? q.correctAnswers[0] : 0)
      }))
    };

    return {
      statusCode: 200,
      body: JSON.stringify(transformedPlan),
    };

  } catch (err) {
    console.error("Error in generatePlan:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Eroare la generarea planului" }),
    };
  }
}
