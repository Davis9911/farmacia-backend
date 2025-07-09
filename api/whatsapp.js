const API_TOKEN = process.env.API_TOKEN

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
    activaWhatsapp: true,
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
    },
    activaWhatsapp: true,
  }
};

const STOCK = [
  { nombre: "Ibuprofeno 400mg", codigo_nacional: "654777", receta: false },
  { nombre: "Frenadol descongestivo (capsulas)", codigo_nacional: "541234", receta: false },
  { nombre: "Naproxeno 500mg", codigo_nacional: "890800", receta: true },
  { nombre: "La roche posay effaclar duo", codigo_nacional: "223365", receta: false }
];

// -------- FUNCIÓN PARA SABER SI LA FARMACIA ESTÁ ABIERTA --------
function isFarmaciaAbierta(farmacia) {
  const now = new Date();
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const dia = dias[now.getDay()];
  const horario = farmacia.horario?.[dia];
  if (!horario) return false;
  const [horaApertura, horaCierre] = horario;
  const horaActual = now.toTimeString().slice(0,5);
  return horaActual >= horaApertura && horaActual <= horaCierre;
}

export default async function handler(req, res) {
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
  ipAccess[ip] = ipAccess[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (ipAccess[ip].length >= RATE_LIMIT) {
    res.status(429).json({ error: "Demasiadas peticiones, espera un minuto" });
    return;
  }
  ipAccess[ip].push(now);

  // ------------ LÓGICA PRINCIPAL -------------
  const {
    message,
    farmacia_id = "riera",
    telefono_usuario = "",
    nombre_usuario = ""
  } = req.body || {};

  const farmacia = FARMACIAS[farmacia_id];

  // Si la farmacia no tiene WhatsApp bot activo, puedes devolver una respuesta genérica
  if (!farmacia || !farmacia.activaWhatsapp) {
    res.status(403).json({ reply: "Este canal de WhatsApp no está habilitado para esta farmacia." });
    return;
  }

  // --- MENSAJE DE HORARIO ---
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

  // --- PROMPT ADAPTADO PARA WHATSAPP ---
  const prompt = `
Eres un farmacéutico experto. Responde SIEMPRE en español, de forma muy clara, educada y profesional.
Normas:
- Si el usuario pregunta por el horario, responde claramente con los horarios de apertura de la farmacia.
- Si detectas que el mensaje es de un proveedor o distribuidor y no de un cliente, responde simplemente "Mensaje recibido. Un responsable lo revisará." y no des información sobre productos.
- Si el usuario encarga un producto, confirma que se lo preparas y que podrá recogerlo en horario de apertura.
- No des datos de stock exactos ni detalles médicos (ni posología).
- Si la farmacia está cerrada, indícalo y di el horario, pero permite hacer el encargo.
- Si tienes que pasar un enlace de producto, ponlo solo una vez por producto.
- Si tienes que pasar el WhatsApp de la farmacia, ponlo solo una vez.
- Si el usuario no es cliente (proveedor, distribuidor), responde solo con un acuse de recibo.

${mensajeHorario ? `IMPORTANTE: ${mensajeHorario}` : ""}

Stock disponible:
${JSON.stringify(STOCK, null, 2)}

Horario de la farmacia:
${Object.entries(farmacia.horario)
  .map(([dia, horas]) => {
    if (!horas) return `${dia[0].toUpperCase() + dia.slice(1)}: cerrado`;
    return `${dia[0].toUpperCase() + dia.slice(1)}: de ${horas[0]} a ${horas[1]}`;
  }).join("\n")}

Contacto: ${farmacia.telefono} WhatsApp: ${farmacia.whatsapp}

Mensaje del usuario (${nombre_usuario || telefono_usuario}): "${message}"
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
