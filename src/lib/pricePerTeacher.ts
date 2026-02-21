const STORAGE_KEY = "stemify_price_per_teacher";
const DEFAULT_PRICE = 20;

export function getPriceForTeacher(teacherId: string | null | undefined): number {
  if (!teacherId) return DEFAULT_PRICE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRICE;
    const obj = JSON.parse(raw) as Record<string, number>;
    const v = obj[teacherId];
    if (typeof v === "number" && !Number.isNaN(v) && v >= 0) return v;
  } catch (_) {}
  return DEFAULT_PRICE;
}

export function setPriceForTeacher(teacherId: string | null | undefined, value: number): void {
  if (!teacherId || value < 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    obj[teacherId] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (_) {}
}

export function getAllPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, number>;
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch (_) {}
  return {};
}

export { DEFAULT_PRICE };
