const API_TOKEN = process.env.API_TOKEN || "CaminogloriaDPM2709_";

const RATE_LIMIT = 100; // máximo de peticiones por IP y por minuto
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto en milisegundos
const ipAccess = {};

const FARMACIAS = {
  riera: {
    nombre: "Farmacia Riera",
    tipo: "carrito",
    telefono: "930001122",
    whatsapp: "34666000111",
    horario: {
      lunes: ["08:30", "20:30"],
      martes: ["08:30", "20:30"],
      miercoles: ["08:30", "20:30"],
      jueves: ["08:30", "20:30"],
      viernes: ["08:30", "20:30"],
      sabado: ["09:00", "14:00"],
      domingo: null
    },
    url_producto: (producto) =>
      `https://farmaciariera.com/producto/${encodeURIComponent(producto.nombre.replace(/\s+/g, "-").toLowerCase())}`,
  },
  uriarte: {
    nombre: "Farmacia Uriarte",
    tipo: "simple",
    telefono: "931112233",
    whatsapp: "34666112233",
    horario: {
      lunes: ["09:00", "19:00"],
      martes: ["09:00", "19:00"],
      miercoles: ["09:00", "19:00"],
      jueves: ["09:00", "19:00"],
      viernes: ["09:00", "19:00"],
      sabado: null,
      domingo: null
    }
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
}

// -------- FUNCIÓN PARA SABER SI LA FARMACIA ESTÁ ABIERTA --------
function isFarmaciaAbierta(farmacia) {
  const now = new Date();
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const dia = dias[now.getDay()];
  const horario = farmacia.horario?.[dia];
  if (!horario) return false; // cerrado
  const [horaApertura, horaCierre] = horario;
  const horaActual = now.toTimeString().slice(0,5);
  return horaActual >= horaApertura && horaActual <= horaCierre;
}

// --------- HANDLER MULTIFARMACIA ----------
export default async function handler(req, res) {
  setCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  // --- TOKEN CHECK ---
  const token = req.headers["x-api-key"];
  if (token !== API_TOKEN) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }

  // --- RATE LIMITING ---
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
  const now = Date.now();

  if (!ipAccess[ip]) {
    ipAccess[ip] = [];
  }
  // Elimina peticiones fuera de la ventana de tiempo
  ipAccess[ip] = ipAccess[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (ipAccess[ip].length >= RATE_LIMIT) {
    res.status(429).json({ error: "Demasiadas peticiones, espera un minuto" });
    return;
  }
  ipAccess[ip].push(now);

  // ----------- TU LÓGICA DEL CHAT AQUÍ -----------
  // Nuevo: usamos farmacia_id para identificar la farmacia
  const { message, farmacia_id = "riera" } = req.body || {};
  const farmacia = FARMACIAS[farmacia_id] || FARMACIAS.riera;

  // ------ MENSAJE DE HORARIO ------
  const abierta = isFarmaciaAbierta(farmacia);
  let mensajeHorario = "";

  if (!abierta) {
    mensajeHorario = `La farmacia está cerrada en este momento. Nuestro horario es:\n` +
      Object.entries(farmacia.horario)
        .map(([dia, horas]) => {
          if (!horas) return `${dia[0].toUpperCase() + dia.slice(1)}: cerrado`;
          return `${dia[0].toUpperCase() + dia.slice(1)}: de ${horas[0]} a ${horas[1]}`;
        }).join("\n") +
      `\nPuedes dejar tu consulta o encargo y te lo preparamos para recogerlo en horario de apertura.`;
  }

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
- Si el usuario pregunta por el horario, responde claramente con los horarios de apertura de la farmacia.

${mensajeHorario ? `IMPORTANTE: ${mensajeHorario}` : ""}

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
