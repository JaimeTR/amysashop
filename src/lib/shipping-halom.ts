export type ShippingDepartmentCatalog = {
  code: string;
  name: string;
  districts: string[];
  baseRate: number;
};

const DEPARTMENTS: ShippingDepartmentCatalog[] = [
  { code: "AMA", name: "AMAZONAS", districts: ["CHACHAPOYAS", "BAGUA", "BONGARA"], baseRate: 22 },
  { code: "ANC", name: "ANCASH", districts: ["HUARAZ", "CHIMBOTE", "CASMA"], baseRate: 18 },
  { code: "APU", name: "APURIMAC", districts: ["ABANCAY", "ANDAHUAYLAS", "CHINCHEROS"], baseRate: 21 },
  { code: "ARE", name: "AREQUIPA", districts: ["AREQUIPA", "CAMANA", "MOLLENDO"], baseRate: 16 },
  { code: "AYA", name: "AYACUCHO", districts: ["AYACUCHO", "HUANTA", "SAN MIGUEL"], baseRate: 22 },
  { code: "CAJ", name: "CAJAMARCA", districts: ["CAJAMARCA", "JAEN", "CUTERVO"], baseRate: 21 },
  { code: "CUS", name: "CUSCO", districts: ["CUSCO", "SICUANI", "URUBAMBA"], baseRate: 19 },
  { code: "HUV", name: "HUANCAVELICA", districts: ["HUANCAVELICA", "LIRCAY", "PAMPAS"], baseRate: 23 },
  { code: "HUC", name: "HUANUCO", districts: ["HUANUCO", "TINGO MARIA", "AMBO"], baseRate: 21 },
  { code: "ICA", name: "ICA", districts: ["ICA", "PISCO", "CHINCHA ALTA"], baseRate: 15 },
  { code: "JUN", name: "JUNIN", districts: ["HUANCAYO", "TARMA", "SATIPO"], baseRate: 18 },
  { code: "LAL", name: "LA LIBERTAD", districts: ["TRUJILLO", "CHEPEN", "PACASMAYO"], baseRate: 17 },
  { code: "LAM", name: "LAMBAYEQUE", districts: ["CHICLAYO", "LAMBAYEQUE", "FERRENAFE"], baseRate: 17 },
  { code: "LIM", name: "LIMA", districts: ["LIMA", "MIRAFLORES", "SAN ISIDRO", "SURCO", "COMAS", "LOS OLIVOS", "CALLAO"], baseRate: 12 },
  { code: "LOR", name: "LORETO", districts: ["IQUITOS", "NAUTA", "YURIMAGUAS"], baseRate: 26 },
  { code: "MDD", name: "MADRE DE DIOS", districts: ["PUERTO MALDONADO", "TAMBOPATA", "INAMBARI"], baseRate: 24 },
  { code: "MOQ", name: "MOQUEGUA", districts: ["MOQUEGUA", "ILO", "OMATE"], baseRate: 19 },
  { code: "PAS", name: "PASCO", districts: ["CERRO DE PASCO", "YANAHUANCA", "OXAPAMPA"], baseRate: 22 },
  { code: "PIU", name: "PIURA", districts: ["PIURA", "SULLANA", "TALARA"], baseRate: 18 },
  { code: "PUN", name: "PUNO", districts: ["PUNO", "JULIACA", "AZANGARO"], baseRate: 21 },
  { code: "SAM", name: "SAN MARTIN", districts: ["TARAPOTO", "MOYOBAMBA", "RIOJA"], baseRate: 22 },
  { code: "TAC", name: "TACNA", districts: ["TACNA", "ALTO DE LA ALIANZA", "CIUDAD NUEVA"], baseRate: 20 },
  { code: "TUM", name: "TUMBES", districts: ["TUMBES", "ZARUMILLA", "AGUAS VERDES"], baseRate: 19 },
  { code: "UCA", name: "UCAYALI", districts: ["PUCALLPA", "YARINACOCHA", "CAMPOVERDE"], baseRate: 23 },
];

const DISTRICT_MULTIPLIER: Record<string, number> = {
  MIRAFLORES: 0.9,
  "SAN ISIDRO": 0.92,
  SURCO: 0.95,
  CALLAO: 1.05,
  COMAS: 1.06,
  "LOS OLIVOS": 1.02,
};

export function getHalomDepartments() {
  return DEPARTMENTS;
}

export function getHalomDistricts(departmentName: string) {
  const department = DEPARTMENTS.find((item) => item.name === departmentName);
  return department ? department.districts : [];
}

export function resolveHalomShippingRate(input: {
  departmentName: string;
  districtName: string;
  cartSubtotal: number;
}) {
  const department = DEPARTMENTS.find((item) => item.name === input.departmentName);

  if (!department) {
    return 0;
  }

  const districtKey = String(input.districtName || "").trim().toUpperCase();
  const multiplier = DISTRICT_MULTIPLIER[districtKey] || 1;
  let rate = department.baseRate * multiplier;

  if (input.cartSubtotal >= 300) {
    rate = Math.max(0, rate - 6);
  } else if (input.cartSubtotal >= 200) {
    rate = Math.max(0, rate - 4);
  }

  return Number(rate.toFixed(2));
}
