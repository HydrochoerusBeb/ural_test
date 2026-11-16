const UPSTREAM = "https://api.favorit-parts.ru/hs/hsprice/";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Метод не поддерживается." });
    return;
  }
  const incoming = new URL(req.url, "https://127.0.0.1");
  const upstream = new URL(UPSTREAM);
  upstream.search = incoming.search;
  try {
    const response = await fetch(upstream, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    const type = response.headers.get("content-type") || "application/json; charset=utf-8";
    res.status(response.status);
    res.setHeader("Content-Type", type);
    res.send(text);
  } catch {
    res.status(502).json({ error: "Не удалось связаться с сервером. Проверьте соединение и повторите запрос." });
  }
}