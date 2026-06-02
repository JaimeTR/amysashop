import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

type ChatBody = {
  sessionId?: string;
  message?: string;
};

type ProductLite = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: unknown;
  brand: string | null;
  sub_brand: string | null;
  categories: { name: string }[] | { name: string } | null;
};

type RecommendationItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

type LeadState = {
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
  lead_interest: string | null;
  lead_category: string | null;
  lead_brand: string | null;
  lead_stage: string;
  status: string;
};

type SalesPlan = {
  reply: string;
  leadStage: "nuevo" | "contactado" | "en_seguimiento" | "cerrado" | "descartado";
  status: "active" | "lead" | "closed";
  leadScore: number;
  leadSummary: string;
  recommendations: RecommendationItem[];
  leadUpdates: Partial<LeadState>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getCategoryName(value: ProductLite["categories"]) {
  if (Array.isArray(value)) return value[0]?.name || "Sin categoria";
  if (value && typeof value === "object") return value.name || "Sin categoria";
  return "Sin categoria";
}

function normalizeMessage(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(images: unknown) {
  const normalized = normalizeImages(images);
  const image = normalized.find(isSafeImageSrc);
  return image || DEFAULT_PRODUCT_IMAGE;
}

function normalizeLower(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function extractEmail(message: string) {
  const normalized = normalizeMessage(message).replace(/[<>()[\]{}"'`,;:]+/g, " ");
  const match = normalized.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return match?.[0] || null;
}

function extractPhone(message: string) {
  const normalized = message.replace(/[^\d+]/g, " ");
  const match = normalized.match(/(?:\+?51\s*)?(9\d{8})/);
  return match?.[1] || null;
}

function extractName(message: string) {
  const normalized = normalizeMessage(message);
  const patterns = [
    /(?:me llamo|mi nombre es|soy)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,2})/i,
    /(?:soy la|soy el)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,2})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const directName = normalized
    .replace(/[.,;:!?]+$/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (
    directName.length >= 1 &&
    directName.length <= 3 &&
    directName.every((part) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+$/.test(part))
  ) {
    const lower = normalized.toLowerCase();
    const blocked = [
      "hola",
      "buenas",
      "buen dia",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "precio",
      "quiero",
      "busco",
      "necesito",
      "categoria",
      "marca",
      "pedido",
    ];

    if (!blocked.some((word) => lower === word || lower.startsWith(`${word} `))) {
      return directName.join(" ");
    }
  }

  return null;
}

function buildCatalogIndex(products: ProductLite[]) {
  const normalized = products.map((item) => ({
    ...item,
    categoryName: getCategoryName(item.categories),
    brandName: String(item.brand || item.sub_brand || "").trim(),
  }));

  return {
    categories: uniqueValues(normalized.map((item) => item.categoryName)),
    brands: uniqueValues(normalized.map((item) => item.brandName)),
    items: normalized,
  };
}

function findTermInText(text: string, terms: string[]) {
  const normalized = normalizeLower(text);
  return terms.find((term) => term && normalized.includes(normalizeLower(term))) || null;
}

function isOffTopicMessage(message: string) {
  const normalized = normalizeLower(message);
  const businessWords = /(compr|precio|cotiz|quiero|busco|necesito|categoria|categor[aí]a|marca|producto|pedido|env[ií]o|reclamo|devoluci|cambio|garant|perfume|maquill|crema|shampoo|cabello|piel|corporal|rostro)/i;
  const unrelatedWords = /(futbol|pol[ií]tica|receta|clima|historia|programaci[oó]n|codigo|c[áa]lculo|tarea|examen|salud|medicina|viaje|pel[ií]cula|musica|hor[oó]scopo|noticia)/i;
  const greetingOnly = /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hi|hello|hey)$/i.test(normalized);

  return Boolean(normalized) && !greetingOnly && !businessWords.test(normalized) && unrelatedWords.test(normalized);
}

function getBrandsForCategory(category: string, products: ReturnType<typeof buildCatalogIndex>["items"]) {
  const normalizedCategory = normalizeLower(category);
  return uniqueValues(
    products
      .filter((item) => normalizeLower(item.categoryName).includes(normalizedCategory))
      .map((item) => item.brandName)
  );
}

function pickRecommendations(
  message: string,
  products: ProductLite[],
  filters?: { category?: string | null; brand?: string | null }
) {
  const query = normalizeMessage(message).toLowerCase();
  const index = buildCatalogIndex(products);

  const scoped = index.items.filter((item) => {
    const categoryMatch = filters?.category ? normalizeLower(item.categoryName).includes(normalizeLower(filters.category)) : true;
    const brandMatch = filters?.brand
      ? normalizeLower(item.brandName).includes(normalizeLower(filters.brand)) ||
        normalizeLower(item.name).includes(normalizeLower(filters.brand))
      : true;

    return categoryMatch && brandMatch;
  });

  const source = scoped.length > 0 ? scoped : index.items;

  const scored = source
    .map((item) => {
      const bag = [item.name, item.description || "", item.brand || "", item.sub_brand || "", item.categoryName]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (query && bag.includes(query)) score += 4;
      const queryWords = query.split(/\s+/).filter((word) => word.length > 2);
      for (const word of queryWords) {
        if (bag.includes(word)) score += 1;
      }

      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, 6).map((entry) => entry.item);

  return selected.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    category: item.categoryName,
    image: getSafeImageSrc(item.images),
  })) as RecommendationItem[];
}

function buildSalesPlan(
  message: string,
  products: ProductLite[],
  conversation: Array<{ sender: string; content: string }>,
  currentSession: LeadState
): SalesPlan {
  const query = normalizeLower(message);
  const catalog = buildCatalogIndex(products);
  const supportIntent = /(reclamo|devoluci|cambio|garant|queja|pedido|env[ií]o|demora|entrega)/i.test(query);
  const purchaseIntent = /(compr|quiero|busco|necesito|precio|cotiz|llevar|opci[oó]n|recomiend)/i.test(query);
  const extractedName = extractName(message);
  const extractedEmail = extractEmail(message);
  const extractedPhone = extractPhone(message);
  const extractedCategory = findTermInText(message, catalog.categories);
  const extractedBrand = findTermInText(message, catalog.brands);

  const leadName = currentSession.lead_name || extractedName;
  const leadPhone = currentSession.lead_phone || extractedPhone;
  const leadEmail = currentSession.lead_email || extractedEmail;
  const leadCategory = currentSession.lead_category || extractedCategory;
  const leadBrand = currentSession.lead_brand || extractedBrand;
  const hasContact = Boolean(leadPhone || leadEmail);
  const hasIdentity = Boolean(leadName && hasContact);
  const offTopic = isOffTopicMessage(message);
  const categoryBrands = leadCategory ? getBrandsForCategory(leadCategory, catalog.items).slice(0, 4) : [];
  const recommendations = pickRecommendations(message, products, {
    category: leadCategory,
    brand: leadBrand,
  });
  const leadInterest = leadCategory || leadBrand || currentSession.lead_interest || null;

  if (offTopic) {
    return {
      reply:
        "Soy un asesor de ventas de AMYSA y solo puedo ayudarte con productos, compras, marcas, categorías, pedidos, envíos, reclamos o devoluciones.",
      leadStage: "nuevo",
      status: "active",
      leadScore: 0,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_interest: leadInterest,
      },
    };
  }

  if (!hasIdentity) {
    if (!leadName) {
      return {
        reply: "Para empezar, dime tu nombre.",
        leadStage: "nuevo",
        status: "active",
        leadScore: 10,
        leadSummary: message.slice(0, 160),
        recommendations: [],
        leadUpdates: {
          lead_name: null,
          lead_phone: leadPhone,
          lead_email: leadEmail,
        },
      };
    }

    return {
      reply: `Gracias, ${leadName}. Ahora compárteme tu número de celular o correo para seguir.`,
      leadStage: "nuevo",
      status: "active",
      leadScore: 10,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
      },
    };
  }

  if (leadName && !hasContact) {
    return {
      reply: `Gracias, ${leadName}. Ahora compárteme tu número de celular o correo para seguir.`,
      leadStage: "nuevo",
      status: "active",
      leadScore: 15,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
      },
    };
  }

  if (leadName && hasContact && !leadInterest && !leadCategory && !leadBrand && !purchaseIntent) {
    const categoryList = catalog.categories.slice(0, 5).join(", ");
    return {
      reply: `Perfecto, ${leadName}. ¿Qué deseas comprar hoy? Puedes elegir una categoría como ${categoryList}.`,
      leadStage: "contactado",
      status: "lead",
      leadScore: 20,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
        lead_interest: leadInterest,
      },
    };
  }

  if (supportIntent) {
    return {
      reply: `Gracias, ${leadName}. Te ayudo con tu caso como asesor de AMYSA. Compárteme el número de pedido, la fecha aproximada y el detalle para revisarlo bien.`,
      leadStage: "contactado",
      status: "lead",
      leadScore: 35,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
        lead_interest: leadInterest,
      },
    };
  }

  const activeInterest = leadInterest || extractedCategory || extractedBrand;

  if (!activeInterest) {
    const categoryList = catalog.categories.slice(0, 5).join(", ");
    return {
      reply: `Gracias, ${leadName}. ¿Qué deseas comprar hoy? Puedes orientarte por una categoría como ${categoryList}.`,
      leadStage: "contactado",
      status: "lead",
      leadScore: 20,
      leadSummary: message.slice(0, 160),
      recommendations: [],
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
      },
    };
  }

  if (leadCategory && !leadBrand) {
    const brandList = categoryBrands.length > 0 ? categoryBrands.join(", ") : catalog.brands.slice(0, 5).join(", ");
    return {
      reply: brandList
        ? `Para ${leadCategory}, manejamos marcas como ${brandList}. ¿Cuál prefieres?`
        : `Ya tengo registrada la categoría ${leadCategory}. ¿Qué marca te interesa?`,
      leadStage: "en_seguimiento",
      status: "lead",
      leadScore: 55,
      leadSummary: message.slice(0, 160),
      recommendations: recommendations.slice(0, 3),
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
        lead_category: leadCategory,
        lead_interest: leadInterest,
      },
    };
  }

  if (recommendations.length > 0) {
    const lines = recommendations.slice(0, 3).map(
      (item, index) => `${index + 1}. ${item.name} (${item.category}) - S/ ${Number(item.price).toFixed(2)}`
    );

    return {
      reply: `Te dejo opciones${leadCategory ? ` de ${leadCategory}` : ""}${leadBrand ? ` de la marca ${leadBrand}` : ""}:\n${lines.join("\n")}\n\nSi quieres, te sigo filtrando por presupuesto o te paso más marcas de esa categoría.`,
      leadStage: "en_seguimiento",
      status: "lead",
      leadScore: 75,
      leadSummary: message.slice(0, 160),
      recommendations: recommendations.slice(0, 3),
      leadUpdates: {
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail,
        lead_category: leadCategory,
        lead_brand: leadBrand,
        lead_interest: leadInterest,
      },
    };
  }

  return {
    reply: `Puedo ayudarte con ${catalog.categories.slice(0, 4).join(", ")}. ¿Qué categoría o marca estás buscando?`,
    leadStage: "en_seguimiento",
    status: "lead",
    leadScore: 45,
    leadSummary: message.slice(0, 160),
    recommendations: recommendations.slice(0, 3),
    leadUpdates: {
      lead_name: leadName,
      lead_phone: leadPhone,
      lead_email: leadEmail,
      lead_category: leadCategory,
      lead_brand: leadBrand,
      lead_interest: leadInterest,
    },
  };
}

async function askGroq(input: {
  apiKey: string;
  model: string;
  message: string;
  conversation: Array<{ sender: string; content: string }>;
  products: ProductLite[];
  salesPlan: SalesPlan;
}) {
  const catalog = input.products.slice(0, 25).map((item) => ({
    id: item.id,
    name: item.name,
    category: getCategoryName(item.categories),
    price: Number(item.price).toFixed(2),
    image: getSafeImageSrc(item.images),
    brand: item.brand || item.sub_brand || "",
    description: (item.description || "").slice(0, 120),
  }));

  const recommendations = input.salesPlan.recommendations.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price).toFixed(2),
    category: item.category,
  }));

  const history = input.conversation
    .slice(-8)
    .map((msg) => `${msg.sender === "client" ? "Cliente" : "Asistente"}: ${msg.content}`)
    .join("\n");

  const prompt = [
    "Eres AMYSA AI, asesora de ventas de AMYSA SHOP en español. Tu nombre es AMYSA AI.",
    "RESPONDE SOLO SOBRE PRODUCTOS, PRECIOS Y LA TIENDA.",
    "Sé amable, respetuosa y cálida como una asesora de ventas. Saluda si te saludan. Da las gracias cuando corresponda.",
    "Máximo 2 oraciones. Sé breve pero amable.",
    "Reglas:",
    "- PRESENTASTE como AMYSA AI cuando sea la primera interacción o te saluden.",
    "- SOLO puedes hablar de productos, precios, marcas y categorías del catálogo.",
    "- Si preguntan algo fuera de la tienda, responde con amabilidad: 'Solo puedo ayudarte con productos de AMYSA SHOP, pero con gusto te atiendo en lo que necesites de la tienda.'",
    "- Si el plan de negocio indica pedir nombre, celular o correo, hazlo con amabilidad.",
    "- Si el cliente dice que quiere comprar o agregar un producto, responde con el marcador [AGREGAR:id] al final, donde id es el ID del producto. Ejemplo: '¡Claro! Lo agrego a tu carrito [AGREGAR:prod-123]'.",
    "- Los precios son en soles peruanos (S/). Siempre muestra el precio con S/.",
    "- No inventes productos, precios ni stock.",
    "Catálogo JSON:",
    JSON.stringify(catalog),
    "Recomendaciones del flujo:",
    JSON.stringify(recommendations),
    "Estado del lead:",
    JSON.stringify({
      lead_name: input.salesPlan.leadUpdates.lead_name ?? null,
      lead_phone: input.salesPlan.leadUpdates.lead_phone ?? null,
      lead_email: input.salesPlan.leadUpdates.lead_email ?? null,
      lead_interest: input.salesPlan.leadUpdates.lead_interest ?? null,
      lead_category: input.salesPlan.leadUpdates.lead_category ?? null,
      lead_brand: input.salesPlan.leadUpdates.lead_brand ?? null,
      lead_stage: input.salesPlan.leadStage,
      status: input.salesPlan.status,
      lead_score: input.salesPlan.leadScore,
    }),
    "Historial:",
    history || "(sin historial)",
    "Mensaje del cliente:",
    input.message,
  ].join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 350,
      top_p: 0.9,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Groq error: ${raw}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | null };
    }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Groq sin contenido");
  }

  return text;
}

async function getAssistantReply(input: {
  message: string;
  conversation: Array<{ sender: string; content: string }>;
  products: ProductLite[];
  salesPlan: SalesPlan;
}) {
  const groqApiKey = process.env.GROQ_API_KEY || "";
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!groqApiKey) {
    return { reply: input.salesPlan.reply, provider: "business_flow" as const };
  }

  try {
    const reply = await askGroq({
      apiKey: groqApiKey,
      model: groqModel,
      message: input.message,
      conversation: input.conversation,
      products: input.products,
      salesPlan: input.salesPlan,
    });

    return { reply, provider: "groq" as const };
  } catch {
    return { reply: input.salesPlan.reply, provider: "business_flow" as const };
  }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonError("Faltan variables de Supabase para procesar el asistente", 500);
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return jsonError("Payload inválido", 400);
  }

  const message = normalizeMessage(String(body.message || ""));
  if (!message) {
    return jsonError("El mensaje no puede estar vacío", 400);
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return jsonError("No autorizado", 401);
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return jsonError("Sesión inválida", 401);
  }

  const userId = user.id;

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let sessionId = String(body.sessionId || "").trim();
  let advisorJoinedBy: string | null = null;
  let currentSession: LeadState | null = null;

  if (sessionId) {
    const { data: existingSession } = await service
      .from("chat_sessions")
      .select("id,client_id,joined_by_admin_id,lead_name,lead_phone,lead_email,lead_interest,lead_category,lead_brand,lead_stage,status")
      .eq("id", sessionId)
      .maybeSingle();

    if (!existingSession) {
      sessionId = "";
      advisorJoinedBy = null;
      currentSession = null;
    } else if (userId && existingSession.client_id !== userId) {
      sessionId = "";
      advisorJoinedBy = null;
      currentSession = null;
    } else {
      advisorJoinedBy = (existingSession as { joined_by_admin_id?: string | null }).joined_by_admin_id ?? null;
      currentSession = {
        lead_name: (existingSession as { lead_name?: string | null }).lead_name ?? null,
        lead_phone: (existingSession as { lead_phone?: string | null }).lead_phone ?? null,
        lead_email: (existingSession as { lead_email?: string | null }).lead_email ?? null,
        lead_interest: (existingSession as { lead_interest?: string | null }).lead_interest ?? null,
        lead_category: (existingSession as { lead_category?: string | null }).lead_category ?? null,
        lead_brand: (existingSession as { lead_brand?: string | null }).lead_brand ?? null,
        lead_stage: (existingSession as { lead_stage?: string | null }).lead_stage ?? "nuevo",
        status: (existingSession as { status?: string | null }).status ?? "active",
      };
    }
  }

  if (!sessionId) {
    const { data: createdSession, error: createSessionError } = await service
      .from("chat_sessions")
      .insert({
        client_id: userId,
        status: "active",
        source: "amysa_ai",
        lead_stage: "nuevo",
      })
      .select("id")
      .single();

    if (createSessionError || !createdSession) {
      return jsonError(createSessionError?.message || "No se pudo crear la sesión de chat", 500);
    }

    sessionId = createdSession.id;
    advisorJoinedBy = null;
    currentSession = {
      lead_name: null,
      lead_phone: null,
      lead_email: null,
      lead_interest: null,
      lead_category: null,
      lead_brand: null,
      lead_stage: "nuevo",
      status: "active",
    };
  }

  const { error: insertClientMessageError } = await service.from("chat_messages").insert({
    session_id: sessionId,
    sender: "client",
    content: message,
  });

  if (insertClientMessageError) {
    return jsonError(insertClientMessageError.message, 500);
  }

  if (advisorJoinedBy) {
    const nowIso = new Date().toISOString();

    await service
      .from("chat_sessions")
      .update({
        status: "lead",
        lead_stage: "en_seguimiento",
        last_message_at: nowIso,
        updated_at: nowIso,
        lead_summary: message.slice(0, 160),
      })
      .eq("id", sessionId)

    return NextResponse.json({
      ok: true,
      sessionId,
      pausedByAdvisor: true,
      advisorJoined: true,
      reply: "",
      provider: "advisor",
      recommendations: [],
    });
  }

  const [{ data: conversationRows }, { data: productsRows }] = await Promise.all([
    service
      .from("chat_messages")
      .select("sender,content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20),
    service
      .from("products")
      .select("id,name,description,price,images,brand,sub_brand,categories(name)")
      .eq("active", true)
      .gt("stock", 0)
      .limit(80),
  ]);

  const conversation = (conversationRows || []) as Array<{ sender: string; content: string }>;
  const products = (productsRows || []) as ProductLite[];

  const salesPlan = buildSalesPlan(message, products, conversation, currentSession || {
    lead_name: null,
    lead_phone: null,
    lead_email: null,
    lead_interest: null,
    lead_category: null,
    lead_brand: null,
    lead_stage: "nuevo",
    status: "active",
  });

  const assistantReply = await getAssistantReply({
    message,
    conversation,
    products,
    salesPlan,
  });

  const { error: insertAssistantMessageError } = await service.from("chat_messages").insert({
    session_id: sessionId,
    sender: "assistant",
    content: assistantReply.reply,
    metadata: { provider: assistantReply.provider, recommendations: salesPlan.recommendations.slice(0, 3), stage: salesPlan.leadStage },
  });

  if (insertAssistantMessageError) {
    return jsonError(insertAssistantMessageError.message, 500);
  }

  const nowIso = new Date().toISOString();

  const sessionUpdates: Record<string, unknown> = {
    last_message_at: nowIso,
    updated_at: nowIso,
    status: salesPlan.status,
    lead_stage: salesPlan.leadStage,
    lead_score: salesPlan.leadScore,
    lead_summary: salesPlan.leadSummary,
  };

  Object.entries(salesPlan.leadUpdates).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      sessionUpdates[key] = value;
    }
  });

  await service
    .from("chat_sessions")
    .update(sessionUpdates)
    .eq("id", sessionId);

  return NextResponse.json({
    ok: true,
    sessionId,
    reply: assistantReply.reply,
    provider: assistantReply.provider,
    pausedByAdvisor: false,
    advisorJoined: false,
    recommendations: salesPlan.recommendations.slice(0, 3),
  });
}
