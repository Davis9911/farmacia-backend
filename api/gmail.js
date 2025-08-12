import { google } from "googleapis";

// ====== OAuth2 ======
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // debe apuntar a /api/gmail si usas este handler
);

// ====== Utilidades ======
function decodeBase64(data = "") {
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractBody(message) {
  const payload = message?.data?.payload || {};
  // 1) partes multiparte
  const parts = payload.parts || [];
  const byMime = (mime) =>
    parts
      .filter((p) => p.mimeType?.includes(mime))
      .map((p) => decodeBase64(p.body?.data))
      .join("\n");

  const textPlain = byMime("text/plain");
  const textHtml = byMime("text/html");

  // 2) cuerpo simple
  const simple = decodeBase64(payload?.body?.data);

  // Preferimos texto plano > simple > html sin etiquetas
  const htmlStripped = textHtml.replace(/<[^>]+>/g, " ");
  return (textPlain || simple || htmlStripped || "").slice(0, 20000); // límite por si acaso
}

// Asegura que la etiqueta exista y devuelve su ID
async function ensureLabel(gmail, name) {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = (data.labels || []).find((l) => l.name === name);
  if (existing) return existing.id;

  const created = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  return created.data.id;
}

// ====== Clasificación con GPT ======
async function clasificarConGPT(asunto, cuerpo) {
  const prompt = `
Eres un asistente que CLASIFICA emails de farmacias en una sola categoría.
Devuelve SOLO una de estas palabras (en mayúsculas y sin nada más):
- PROMOCIONES  (ofertas, catálogos, marketing, "promoción", "descuento", "novedad")
- FACTURAS     (facturas, abonos, pagos, "invoice", "facturación")
- GLOVO        (pedidos o incidencias de Glovo; menciones a "Glovo")
- ALBARANES    (albaranes, documentos de entrega/recepción de mercancía)
- PROVEEDORES  (cualquier otro email de proveedor/distribuidor/comercial que no sea promo/factura/albarán)
- ENCARGO      (cliente que solicita o reserva producto, disponibilidad, "me guardas", "encargo", "pedido para mí")
- NO_CLASIFICADOS (si no puedes decidir con seguridad)

Instrucciones:
- Si es de GLOVO, gana a otras categorías.
- Si el email menciona "albarán" o similar, usa ALBARANES.
- Si hay "factura", "invoice", "abono", "Nº factura", usa FACTURAS.
- Si parece marketing/ofertas, usa PROMOCIONES.
- Si es un cliente pidiendo algo, usa ENCARGO.
- Si es proveedor pero no cuadra en factura/albarán/promoción, usa PROVEEDORES.
- Si de verdad no puedes saber, NO_CLASIFICADOS.

ASUNTO: ${asunto}
CUERPO (recorte):
${cuerpo.slice(0, 3000)}
  `.trim();

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 5,
      temperature: 0,
    }),
  });

  const data = await completion.json();
  const raw = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();

  // Normalizamos por si GPT se va por la tangente (pasa a NO_CLASIFICADOS)
  const ALLOWED = new Set([
    "PROMOCIONES",
    "FACTURAS",
    "GLOVO",
    "ALBARANES",
    "PROVEEDORES",
    "ENCARGO",
    "NO_CLASIFICADOS",
  ]);

  return ALLOWED.has(raw) ? raw : "NO_CLASIFICADOS";
}

// ====== Handler ======
export default async function handler(req, res) {
  // 1) callback OAuth (primer enlace de autorización)
  if (req.method === "GET" && req.query.code) {
    try {
      const { tokens } = await oauth2Client.getToken(req.query.code);
      oauth2Client.setCredentials(tokens);
      // Guarda estos tokens en tu base de datos si quieres que quede conectado
      res.status(200).json({ message: "Cuenta de Gmail conectada", tokens });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
    return;
  }

  // 2) Clasificar últimos N emails y etiquetar
  if (req.method === "POST") {
    try {
      const {
        access_token,
        refresh_token,
        maxResults = 10, // puedes cambiar
      } = req.body || {};

      if (!access_token && !refresh_token) {
        return res.status(400).json({ error: "Faltan tokens de Gmail." });
      }

      oauth2Client.setCredentials({ access_token, refresh_token });
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      // Obtenemos últimos correos
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults,
        q: "in:inbox", // solo bandeja de entrada; ajusta si quieres
      });

      const results = [];
      // Aseguramos IDs de etiquetas (se crean si no existen)
      const labelIdsCache = {};
      async function getLabelId(name) {
        if (labelIdsCache[name]) return labelIdsCache[name];
        const id = await ensureLabel(gmail, name);
        labelIdsCache[name] = id;
        return id;
      }

      for (const m of list.data.messages || []) {
        const message = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
        const headers = message.data.payload?.headers || [];
        const asunto = headers.find((h) => h.name === "Subject")?.value || "(sin asunto)";
        const cuerpo = extractBody(message);

        const categoria = await clasificarConGPT(asunto, cuerpo);
        const labelId = await getLabelId(categoria);

        // Aplicamos la etiqueta (no quitamos otras; si quieres, añade removeLabelIds)
        await gmail.users.messages.modify({
          userId: "me",
          id: m.id,
          requestBody: { addLabelIds: [labelId] },
        });

        results.push({ id: m.id, asunto, categoria });
      }

      res.status(200).json({ ok: true, emails: results });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ error: "Método no permitido" });
}
