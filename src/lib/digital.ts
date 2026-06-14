export type DigitalFile = {
  name: string;
  description: string;
  url: string;
  type: "excel" | "pdf" | "video" | "other";
};

export type DigitalProduct = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  features: string[];
  ideal_for: string | null;
  price_usd: number;
  price_pen: number;
  paypal_link: string;
  culqi_link: string;
  files: DigitalFile[];
  sort_order: number;
};

export type DigitalPurchase = {
  id: string;
  email: string;
  customer_name: string;
  product_id: string;
  product_name?: string;
  product_slug?: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  confirmed_at: string | null;
  download_token: string | null;
  files?: DigitalFile[];
};

export const FALLBACK_PRODUCTS: DigitalProduct[] = [
  {
    id: "basic",
    name: "Mi Catálogo al Día",
    slug: "basico",
    subtitle: "NIVEL BÁSICO",
    description: "Ordena tus ventas y clientes sin complicarte",
    features: [
      "14 hojas listas para usar",
      "Inventario de hasta 50 productos con precios",
      "Registro de ventas diarias, mes a mes (enero a diciembre)",
      "Control de clientes, productos, pagos y estado de pedidos",
      "Totales mensuales automáticos",
    ],
    ideal_for: "Emprendedoras que recién comienzan y necesitan tener control básico de sus ventas y clientes.",
    price_usd: 6,
    price_pen: 18,
    paypal_link: "https://www.paypal.com/ncp/payment/CFRCBPCMBYMWJ",
    culqi_link: "https://express.culqi.com/pago/C049DDA931",
    files: [
      { name: "Mi Catálogo al Día.xlsx", description: "Plantilla de Excel", url: "", type: "excel" },
      { name: "Guía de uso básico.pdf", description: "Instrucciones paso a paso", url: "", type: "pdf" },
    ],
    sort_order: 1,
  },
  {
    id: "intermedio",
    name: "Gestión de Ventas por Catálogo",
    slug: "intermedio",
    subtitle: "NIVEL INTERMEDIO",
    description: "Conoce tu ganancia real y controla comisiones",
    features: [
      "16 hojas profesionales",
      "Inventario inteligente que calcula automáticamente precio, ganancia y comisión",
      "Calculadora de campaña para conocer tu ganancia al instante",
      "Control de comisiones para tus vendedoras",
      "Resumen anual con dashboard y gráficos",
      "Ganancia real por producto",
      "Compatible con todos los catálogos",
    ],
    ideal_for: "Consultoras y líderes que manejan campañas por catálogo y desean conocer exactamente cuánto ganan.",
    price_usd: 11,
    price_pen: 35,
    paypal_link: "https://www.paypal.com/ncp/payment/ZD6XAMR8VS94E",
    culqi_link: "https://express.culqi.com/pago/9B49AFCF52",
    files: [
      { name: "Gestión de Ventas por Catálogo.xlsx", description: "Plantilla de Excel", url: "", type: "excel" },
      { name: "Guía de uso intermedio.pdf", description: "Manual de uso completo", url: "", type: "pdf" },
      { name: "Video tutorial.mp4", description: "Video explicativo de funciones", url: "", type: "video" },
    ],
    sort_order: 2,
  },
  {
    id: "pro",
    name: "Gestión de Ventas PRO",
    slug: "pro",
    subtitle: "NIVEL PRO",
    description: "El sistema completo para escalar tu negocio",
    features: [
      "19 hojas profesionales",
      "Calculadora de costo unitario (costos fijos + variables + empaque)",
      "Gestión de precios e inventario con cálculo de inversión y margen de ganancia",
      "Calculadora automática de campañas",
      'Módulo "¿Cuánto me pago?" para calcular tu sueldo real y rentabilidad',
      "Monitoreo por catálogo: facturación, ventas y ganancia neta",
      "Control de facturas",
      "Resumen anual con gráficos y métricas",
      "Sistema integral para gestionar tu negocio como una profesional",
    ],
    ideal_for: "Emprendedoras, líderes de equipos y negocios que buscan escalar, controlar costos y medir su rentabilidad real.",
    price_usd: 17,
    price_pen: 55,
    paypal_link: "https://www.paypal.com/ncp/payment/RFRK4CMTZENZQ",
    culqi_link: "https://express.culqi.com/pago/B11C573E1D",
    files: [
      { name: "Gestión de Ventas PRO.xlsx", description: "Plantilla de Excel", url: "", type: "excel" },
      { name: "Guía de uso PRO.pdf", description: "Manual completo del sistema", url: "", type: "pdf" },
      { name: "Guía de rentabilidad.pdf", description: "Cómo calcular tu sueldo y margen", url: "", type: "pdf" },
      { name: "Video tutorial PRO.mp4", description: "Video completo del sistema", url: "", type: "video" },
    ],
    sort_order: 3,
  },
];
