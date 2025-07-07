// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const { message } = req.body;

  // Stock simulado para la demo
  const stock = [
    { nombre: "Ibuprofeno 400mg", stock: 10, receta: false },
    { nombre: "Frenadol", stock: 8, receta: false },
    { nombre: "Naproxeno 500mg", stock: 5, receta: true }
  ];

  const prompt = `
Eres un farmacéutico experto y contestas de forma clara, profesional y humana. El stock es: ${JSON.stringify(stock)}.
Si el usuario pregunta por un producto, responde si hay o no stock y si requiere receta.
Mensaje del usuario: "${message}"
  `.trim();

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });
    const data = await completion.json();
    res.status(200).json({ reply: data.choices?.[0]?.message?.content ?? "Sin respuesta de la IA." });
  } catch (error) {
    res.status(500).json({ reply: "Error consultando a la IA. Revisa la API key o el saldo de OpenAI." });
  }
}
