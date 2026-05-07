export const BRAND_LABELS: Record<string, string> = {
  APPLE: "Apple",
  SAMSUNG: "Samsung",
  HUAWEI: "Huawei",
  XIAOMI: "Xiaomi",
  OPPO: "Oppo",
  VIVO: "Vivo",
  MOTOROLA: "Motorola",
  LG: "LG",
  GOOGLE: "Google",
  ONEPLUS: "OnePlus",
  NOKIA: "Nokia",
  SONY: "Sony",
  ZTE: "ZTE",
  OTHER: "Otra",
};

export const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Recibido",
  DIAGNOSING: "En diagnóstico",
  WAITING_PARTS: "Esperando piezas",
  REPAIRING: "En reparación",
  READY: "Listo para entrega",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  DIAGNOSING: "bg-yellow-100 text-yellow-800",
  WAITING_PARTS: "bg-orange-100 text-orange-800",
  REPAIRING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  TECHNICIAN: "Técnico",
};
