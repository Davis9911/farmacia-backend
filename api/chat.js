const FARMACIAS = {
  carrito: {
    nombre: "Farmacia Carrito",
    tipo: "carrito",
    telefono: "911223344",
    whatsapp: "34666123456",
    url_producto: (producto) =>
      `https://farmaciacarrito.com/producto/${encodeURIComponent(producto.nombre.replace(/\s+/g, "-").toLowerCase())}`,
  },
  simple: {
    nombre: "Farmacia Simple",
    tipo: "simple",
    telefono: "912223344",
    whatsapp: "34666222333",
  }
};

const STOCK = [
  { nombre: "Ibuprofeno 400mg", codigo_nacional: "654777", receta: false },
  { nombre: "Frenadol descongestivo (capsulas)", codigo_nacional: "541234", receta: false },
  { nombre: "Naproxeno 500mg", codigo_nacional: "890800", receta: true },
  { nombre: "La roche posay effaclar duo", codigo_nacional: "223365", receta: false }
];

// ------- MANEJO DE CORS UNIVERSAL -------
function setCORS(res, origin) {
  const allowedOrigins = [
    "https://farmacia-frontend-eight.vercel.app",
    "http://localhost:3000"
  ];
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    setCORS(res, req.headers.origin);
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const { message, farmacia_tipo = "carrito" } = req.body || {};
  const farmacia = FARMACIAS[farmacia_tipo] || FARMACIAS.carrito;

  // ------ PROMPT PERSONALIZADO ------
  const prompt = `
Eres un farmacéutico experto y contestas de forma clara, profesional y humana.
Responde SIEMPRE en español y con información sencilla, cortés y útil.
Normas:
- Usa los datos de stock que te dé el sistema (te paso abajo un array de productos con nombre, código nacional y si requiere receta).
- Si el producto requiere receta, avísalo claramente.
- Si hay variantes (dosis, formatos), pregunta cuál necesita el cliente.
- Si el usuario pide algo que no tienes, sugiere preguntar en la farmacia o consultar un médico.
- Si hay errores típicos (nombres mal escritos, dosis sin unidades...), intenta adivinar a qué se refiere el usuario y pregunta para confirmar.
- No digas el número de unidades que hay en Stock, solo indica si hay o no stock.
- No digas nada de su uso, indicaciones, ni efectos secundarios ni posología de cualquier producto que te pregunten.
- Si piden más unidades de las que disponemos, decir que no disponemos de tantas y que solo podemos ofrecer las unidades que tenemos.
- Si el producto tiene código nacional que empieza por 0, 1, 2, 3 o 4:
  NO es un medicamento. Es un producto de parafarmacia.
  NUNCA requiere receta médica. NO digas nada sobre receta.
  Solo informa sobre disponibilidad.
- Si el producto tiene código nacional que empieza por 5, 6, 7, 8 o 9:
  Es un medicamento (con o sin receta).
  SIEMPRE debes informar si requiere o no receta médica, según la información del stock.
  Responde de forma clara y profesional.
- Si el usuario no da un código nacional, usa el nombre del producto para intentar identificarlo y aplica la lógica anterior.
- Si preguntan por el uso o indicaciones, responde que no puedes dar esa información por aquí, pero que puede consultarnos por teléfono o WhatsApp ${farmacia.whatsapp ? `(https://wa.me/${farmacia.whatsapp})` : ""}.
- No repitas enlaces en la misma respuesta (solo 1 botón de WhatsApp i un teléfono)

Ejemplo:
- Si el cliente pregunta por una “crema La Roche Posay” con código nacional que empieza por 2, responde solo disponibilidad y detalles, sin hablar de recetas.
- Si pregunta por “Ibuprofeno 600mg” (código nacional empieza por 6), responde si está disponible y añade si requiere o no receta.

Stock disponible:
${JSON.stringify(STOCK, null, 2)}

Tipo de farmacia: ${farmacia.tipo === "carrito" ? "Con carrito online" : "Encargo por WhatsApp/telefono"}
${farmacia.tipo === "carrito" ? `Si tienes que mostrar un enlace de compra, usa este ejemplo para el producto consultado: ${farmacia.url_producto({nombre: "[nombreProducto]"})}` : `Si tienes que dar contacto, di que puede escribir por WhatsApp: https://wa.me/${farmacia.whatsapp} o llamar al ${farmacia.telefono}`}

Mensaje del usuario: "${message}"
`.trim();

  // ------- LLAMADA A OPENAI -------
  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 250,
        temperature: 0.5
      }),
    });

    const data = await completion.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("No IA response");
    }

    res.status(200).json({ reply: data.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({
      reply: "Error consultando a la IA. Revisa la API key o el saldo de OpenAI."
    });
  }
}
