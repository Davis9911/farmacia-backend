
// pages/api/respond-label.js

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Asegúrate de definir esto en tu entorno
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensaje no recibido" });
  }

  try {
    const prompt = `
Eres un asistente que clasifica mensajes de WhatsApp de una farmacia. 
Tienes que analizar el contenido del mensaje y devolver una etiqueta según estas categorías:

- "pendiente encargo": si el mensaje indica que el cliente quiere pedir, comprar o consultar por un producto.
- "proveedor": si es un comercial, catálogo, distribuidor, o cualquier promoción.
- "requiere humano": si no puedes identificar lo anterior, o es una consulta médica, personal o compleja.

Devuelve solo un JSON con este formato:
{
  "etiqueta": "...",
  "respuesta": "..."
}

Incluye una respuesta solo si es un encargo. No des respuesta en los otros dos casos.

Mensaje: "${message}"
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const respuestaGPT = completion.data.choices[0].message.content.trim();

    // Intentar parsear la respuesta como JSON
    let data;
    try {
      data = JSON.parse(respuestaGPT);
    } catch (e) {
      return res.status(500).json({ error: "La respuesta de la IA no es válida." });
    }

    return res.status(200).json({
      etiqueta: data.etiqueta || "requiere humano",
      respuesta: data.respuesta || "",
    });
  } catch (error) {
    console.error("Error al llamar a OpenAI:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
