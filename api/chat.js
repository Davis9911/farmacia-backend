// /api/chat.js
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

// ------- NUEVO MANEJO DE CORS UNIVERSAL -------
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

export default function handler(req, res) {
  setCORS(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    // Siempre poner los headers CORS también en errores
    setCORS(res, req.headers.origin);
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  // Asegúrate de que el body siempre llega como JSON
  const { message, farmacia_tipo = "carrito" } = req.body || {};
  const farmacia = FARMACIAS[farmacia_tipo] || FARMACIAS.carrito;

  const producto = STOCK.find((p) =>
    message && message.toLowerCase().includes(p.nombre.split(" ")[0].toLowerCase())
  );

  let respuesta = "";

  if (producto) {
    if (farmacia.tipo === "carrito") {
      const url = farmacia.url_producto(producto);
      respuesta = `Tenemos ${producto.nombre} disponible. ${
        producto.receta ? "Requiere receta médica. " : ""
      }Puedes comprarlo online aquí: ${url}`;
    } else {
      respuesta = `Tenemos ${producto.nombre} disponible. ${
        producto.receta ? "Requiere receta médica. " : ""
      }Para encargarlo, puedes llamarnos al ${farmacia.telefono} o escribirnos por WhatsApp: https://wa.me/${farmacia.whatsapp}`;
    }
  } else {
    respuesta = "No hemos encontrado ese producto en nuestro stock. Si tienes dudas, consúltanos por WhatsApp.";
  }

  setCORS(res, req.headers.origin);
  res.status(200).json({ reply: respuesta });
}
