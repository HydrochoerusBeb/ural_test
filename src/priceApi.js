import apiConfig, { hasCustomerKey } from "./apiConfig.js";

export class PriceError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = "PriceError";
    this.kind = kind;
  }
}

const CONFIG_MESSAGE = "Не задан ключ покупателя: укажите customerKey в src/apiConfig.js";
const NETWORK_MESSAGE = "Не удалось связаться с сервером. Проверьте соединение и повторите запрос.";
const BAD_RESPONSE_MESSAGE = "Сервер вернул некорректный ответ.";

export function buildPriceUrl({ number, brand, analogues }) {
  const params = new URLSearchParams();
  const key = typeof apiConfig.customerKey === "string" ? apiConfig.customerKey.trim() : "";
  if (key) params.set("key", key);
  params.set("number", number);
  if (brand) params.set("brand", brand);
  if (brand && analogues) params.set("analogues", "on");
  return "/api/price?" + params.toString();
}

export function errorMessage(data) {
  if (!data || typeof data !== "object" || data.error == null || data.error === "") return "";
  if (Array.isArray(data.error)) {
    return data.error.map((item) => String(item).trim()).filter(Boolean).join("; ");
  }
  if (typeof data.error === "string") return data.error.trim();
  return String(data.error);
}

export function isEmptyGood(good) {
  if (!good || typeof good !== "object") return true;
  const brand = String(good.brand || "").trim();
  const name = String(good.name || "").trim();
  const number = String(good.number || "").trim();
  return brand.length === 0 && name.length === 0 && number.length === 0;
}

function finiteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function toBrandChoices(goods) {
  if (!Array.isArray(goods)) return [];
  const choices = [];
  goods.forEach((good, index) => {
    if (isEmptyGood(good)) return;
    const goodsID = String(good.goodsID || "").trim();
    const brand = String(good.brand || "").trim();
    const number = String(good.number || "").trim();
    choices.push({
      id: [goodsID, brand, number, index].join("|"),
      brand,
      name: String(good.name || "").trim(),
      number,
      count: finiteNumber(good.count) ?? 0,
    });
  });
  return choices;
}

function rowsForPart(part, source, partIndex) {
  const goodsID = String(part.goodsID || "").trim();
  const brand = String(part.brand || "").trim();
  const name = String(part.name || "").trim();
  const number = String(part.number || "").trim();
  const warehouses = Array.isArray(part.warehouses) ? part.warehouses : [];
  if (warehouses.length === 0) {
    return [
      {
        rowKey: [goodsID, source, partIndex, "empty"].join("|"),
        source,
        brand,
        name,
        number,
        warehouse: "",
        price: null,
        stock: 0,
      },
    ];
  }
  return warehouses.map((warehouse, index) => ({
    rowKey: [goodsID, source, partIndex, warehouse && warehouse.id ? warehouse.id : index, index].join("|"),
    source,
    brand,
    name,
    number,
    warehouse: String((warehouse && warehouse.code) || "").trim(),
    price: finiteNumber(warehouse && warehouse.price),
    stock: finiteNumber(warehouse && warehouse.stock) ?? 0,
  }));
}

export function toOfferRows(goods) {
  if (!Array.isArray(goods)) return [];
  const rows = [];
  goods.forEach((good, goodIndex) => {
    if (!isEmptyGood(good)) {
      rows.push(...rowsForPart(good, "part", goodIndex));
    }
    const analogues = good && Array.isArray(good.analogues) ? good.analogues : [];
    analogues.forEach((analog, analogIndex) => {
      if (!isEmptyGood(analog)) rows.push(...rowsForPart(analog, "analog", goodIndex + ":" + analogIndex));
    });
  });
  return rows;
}

export function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

export async function loadGoods(params, signal) {
  if (!hasCustomerKey()) {
    throw new PriceError("config", CONFIG_MESSAGE);
  }
  const url = buildPriceUrl(params);
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error && error.name === "AbortError") throw error;
    throw new PriceError("network", NETWORK_MESSAGE);
  }
  let text = "";
  try {
    text = await response.text();
  } catch (error) {
    if (error && error.name === "AbortError") throw error;
    throw new PriceError("network", NETWORK_MESSAGE);
  }
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new PriceError("api", "Сервер ответил с ошибкой (" + response.status + ").");
      }
      throw new PriceError("api", BAD_RESPONSE_MESSAGE);
    }
  }
  const message = errorMessage(data);
  if (message) throw new PriceError("api", message);
  if (!response.ok) {
    throw new PriceError("api", "Сервер ответил с ошибкой (" + response.status + ").");
  }
  if (!data || !Array.isArray(data.goods)) {
    throw new PriceError("api", BAD_RESPONSE_MESSAGE);
  }
  return data.goods;
}
