const API_TOKEN = process.env.API_TOKEN

const RATE_LIMIT = 100; // máximo de peticiones por IP y por minuto
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto en milisegundos
const ipAccess = {};
 // --- LINKS de productos Uriarte (pegados de la web) ---
const LINKS_URIARTE = [
  "https://www.farmaciauriartefmas.com/catalog/product/view/id/87296/s/interapothek-protector-labial-manteca-de-karite-spf50/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/87020/s/interapothek-protector-labial-con-aloe-spf20/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84253/s/interapothek-protector-labial-sabor-fresa-spf15/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84183/s/interapothek-protector-labial-sabor-pi-a-spf20/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92064/s/interapothek-balsamo-nariz-y-labios-tubo-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84254/s/interapothek-protector-labial-sabor-vainillalima-spf30/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92693/s/interapothek-lapiz-ojos-negro/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70293/s/interapothek-balsamo-labial-frambuesa-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70298/s/interapothek-balsamo-reparador-nariz-y-labios-15g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70296/s/interapothek-balsamo-labial-neutro-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86703/s/interapothek-esmalte-de-unas-coral-n14-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93189/s/interapothek-solar-emulsion-color-spf50-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70294/s/interapothek-balsamo-labial-kiwi-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92131/s/interapothek-solar-stick-50-25g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/87080/s/interapothek-solar-mineral-nino-spf50-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70250/s/interapothek-aceite-de-almendras-dulces-250ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94158/s/interapothek-contorno-ojos-vitamina-c-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84549/s/interapothek-leche-hidratante-corporal-aloe-vera-100ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86692/s/interapothek-barra-de-labios-burdeos-n2-42g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/87002/s/interapothek-esmalte-una-marron-n23-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/83271/s/interapothek-leche-hidratante-corporal-aloe-vera-con-dosificador-500ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/87983/s/interapothek-leche-hidratante-corporal-aloe-vera-200ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86700/s/interapothek-esmalte-de-unas-azul-n11-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86702/s/interapothek-esmalte-de-unas-rosa-pastel-n13-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92082/s/interapothek-barra-de-labios-n-8-4-2g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93190/s/interapothek-solar-emulsion-spf50-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70251/s/interapothek-aceite-de-almendras-dulces-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86698/s/interapothek-esmalte-de-unas-rosa-palo-n02-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/83205/s/interapothek-leche-hidratante-corporal-spa-500ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70361/s/interapothek-crema-corporal-con-extracto-de-leche-de-coco-300ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70393/s/interapothek-discos-desmaquillantes-ovalados-algodon-40uds/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/90416/s/interapothek-serum-niacinamida-30ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/83956/s/interapothek-solar-aceite-potenciador-del-bronceado-spf30-200ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92084/s/interapothek-esmalte-de-unas-azul-marino-n25-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70295/s/interapothek-balsamo-labial-naranja-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94159/s/interapothek-contorno-ojos-colageno-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70362/s/interapothek-crema-corporal-nutritiva-300ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86693/s/interapothek-barra-de-labios-rosa-intenso-n3-42g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93198/s/interapothek-solar-tacto-seda-spf50-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93463/s/interapothek-gel-facial-limpiador-250-ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70297/s/interapothek-balsamo-labial-pi-a-15ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93192/s/interapothek-solar-gel-spf50-50-ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86694/s/interapothek-barra-de-labios-marron-n4-42g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93366/s/interapothek-solar-gel-crema-spf30-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94161/s/interapothek-crema-dia-bio-peptido-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/83685/s/interapothek-leche-hidratante-corporal-avena-con-dosificador-500ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92692/s/interapothek-lapiz-ojos-marron/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70249/s/interapothek-aceite-de-almendras-dulces-125ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86701/s/interapothek-esmalte-de-unas-lila-n12-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/93191/s/interapothek-solar-gel-crema-spf50-200ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92081/s/interapothek-barra-de-labios-n7-42g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84447/s/interapothek-serum-revitalizante-o2-30ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/92085/s/interapothek-esmalte-de-unas-coral-rojo-n26-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94018/s/interapothek-solar-spray-50-100ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94164/s/interapothek-crema-noche-bio-peptido-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84767/s/interapothek-leche-hidratante-corporal-seda-500ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/94163/s/interapothek-crema-dia-vitamina-c-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/70518/s/interapothek-locion-hidratante-para-piel-atopica-400ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/84766/s/interapothek-leche-hidratante-corporal-cero-500ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/86704/s/interapothek-esmalte-de-unas-fucsia-n20-10ml/category/1197706/",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=asc&max=0&min=0&order=name",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=asc&max=0&min=0&order=price",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=desc&max=0&min=0&order=price",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=asc&max=0&min=0&order=fmas_orden",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=desc&max=0&min=0&order=fmas_porcentaje_dto",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=asc&max=0&min=0&order=kiosko",
"https://www.farmaciauriartefmas.com/cosmetica.html?dir=asc&max=0&min=0&order=stock_kiosko",
"https://www.farmaciauriartefmas.com/cosmetica.html?limit=60&max=0&min=0",
"https://www.farmaciauriartefmas.com/cosmetica.html?limit=120&max=0&min=0",
"https://www.farmaciauriartefmas.com/cosmetica.html?limit=180&max=0&min=0",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&mode=list",
"https://www.farmaciauriartefmas.com/cosmetica.html#",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&p=2&id=1197706",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&p=3&id=1197706",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&p=4&id=1197706",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&p=5&id=1197706",
"https://www.farmaciauriartefmas.com/cosmetica.html?max=0&min=0&p=2&id=1197706",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/13940/s/babe-fotop-facial-fluido-color-sfp50-50ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/14081/s/rizapestanas-automatico-beter/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62186/s/aderma-protect-xtrem-stick-spf50-8g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62196/s/weleda-aceite-anticelulitico-de-abedul-100ml/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62208/s/abe-ula-blanca-grande/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62209/s/abe-ula-blanca/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62210/s/abe-ula-descanso-ojos-4-5-gr/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62211/s/abe-ula-negra/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62212/s/abe-ula-perfilador-ojos-marron/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62213/s/abe-ula-perfilador-ojos-negro/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62216/s/abradermol-crema-exfoliante-45g/category/1197706/",
"https://www.farmaciauriartefmas.com/catalog/product/view/id/62267/s/vicorva-aceite-arbol-del-te-30ml/category/1197706/",
"https://www.farmaciauriartefmas.com/sales/guest/form",

  // ...más enlaces que tengas
];

// --- Función de búsqueda fuzzy para los links de Uriarte ---
function url_producto_uriarte(producto) {
  if (!producto?.nombre) return "";
  const nombreNorm = producto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
  const found = LINKS_URIARTE.find(url => 
    url.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").includes(nombreNorm)
  );
  return found || "";
}

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
    tipo: "carrito",
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
    url_producto: url_producto_uriarte, // <-- AÑADE ESTA LÍNEA
  }
};

const STOCK = [
  { nombre: "Ibuprofeno 400mg", codigo_nacional: "654777", receta: false },
  { nombre: "Frenadol descongestivo (capsulas)", codigo_nacional: "541234", receta: false },
  { nombre: "Naproxeno 500mg", codigo_nacional: "890800", receta: true },
  { nombre: "La roche posay effaclar duo", codigo_nacional: "223365", receta: false },
  { nombre: "Babe fotop facial fluido color SFP50 50ml", codigo_nacional: "100001", receta: false },
  { nombre: "Rizapestanas automatico beter", codigo_nacional: "100002", receta: false },
  { nombre: "Aderma protect xtrem stick spf50 8g", codigo_nacional: "100003", receta: false },
  { nombre: "Weleda aceite anticelulitico de abedul 100ml", codigo_nacional: "100004", receta: false },
  { nombre: "Abe ula blanca grande", codigo_nacional: "100005", receta: false },
  { nombre: "Abe ula blanca", codigo_nacional: "100006", receta: false },
  { nombre: "Abe ula descanso ojos 4.5gr", codigo_nacional: "100007", receta: false },
  { nombre: "Abe ula negra", codigo_nacional: "100008", receta: false },
  { nombre: "Abe ula perfilador ojos marron", codigo_nacional: "100009", receta: false },
  { nombre: "Abe ula perfilador ojos negro", codigo_nacional: "100010", receta: false },
  { nombre: "Abradermol crema exfoliante 45g", codigo_nacional: "100011", receta: false },
  { nombre: "Vicorva aceite arbol del te 30ml", codigo_nacional: "100012", receta: false },
  { nombre: "Interapothek lapiz ojos marron", codigo_nacional: "100013", receta: false },
  { nombre: "Interapothek aceite de almendras dulces 125ml", codigo_nacional: "100014", receta: false },
  { nombre: "Interapothek esmalte de unas lila n12 10ml", codigo_nacional: "100015", receta: false },
  { nombre: "Interapothek solar gel crema spf50 200ml", codigo_nacional: "100016", receta: false },
  { nombre: "Interapothek barra de labios n7 4.2g", codigo_nacional: "100017", receta: false },
  { nombre: "Interapothek serum revitalizante o2 30ml", codigo_nacional: "100018", receta: false },
  { nombre: "Interapothek esmalte de unas coral rojo n26 10ml", codigo_nacional: "100019", receta: false },
  { nombre: "Interapothek solar spray 50 100ml", codigo_nacional: "100020", receta: false },
  { nombre: "Interapothek crema noche bio peptido 50ml", codigo_nacional: "100021", receta: false },
  { nombre: "Interapothek leche hidratante corporal seda 500ml", codigo_nacional: "100022", receta: false },
  { nombre: "Interapothek crema dia vitamina c 50ml", codigo_nacional: "100023", receta: false },
  { nombre: "Interapothek locion hidratante para piel atopica 400ml", codigo_nacional: "100024", receta: false },
  { nombre: "Interapothek leche hidratante corporal cero 500ml", codigo_nacional: "100025", receta: false },
  { nombre: "Interapothek esmalte de unas fucsia n20 10ml", codigo_nacional: "100026", receta: false }
];

// ------- MANEJO DE CORS UNIVERSAL -------
function setCORS(res, origin) {
  const allowedOrigins = [
    "https://farmacia-frontend-eight.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
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
  ipAccess[ip] = ipAccess[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (ipAccess[ip].length >= RATE_LIMIT) {
    res.status(429).json({ error: "Demasiadas peticiones, espera un minuto" });
    return;
  }
  ipAccess[ip].push(now);

  // ------ PARTE IMPORTANTE: MEMORIA CONVERSACIÓN ------
  // Recibimos todo el historial desde frontend
  const { messages = [], farmacia_id = "riera" } = req.body || {};
  const farmacia = FARMACIAS[farmacia_id] || FARMACIAS.riera;

  // Buscamos el producto más reciente del historial
  let posibleProducto = null;
  let posibleLink = "";

  // Busca el último producto mencionado en el historial
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    for (const p of STOCK) {
      // fuzzy: incluye el nombre principal (mejorable con librería fuzzy)
      if (msg.content.toLowerCase().includes(p.nombre.toLowerCase().split(" ")[0])) {
        posibleProducto = p;
        break;
      }
    }
    if (posibleProducto) break;
  }
  if (posibleProducto && farmacia.url_producto) {
    posibleLink = farmacia.url_producto(posibleProducto);
  }

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
  const promptSystem = `
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
${farmacia.tipo === "carrito" && posibleLink ? `Si tienes que mostrar un enlace de compra del producto consultado, usa este enlace: ${posibleLink}` : ""}
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
        messages: [
          { role: "system", content: promptSystem },
          ...messages // el historial de usuario y bot
        ],
        max_tokens: 350,
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
