import { convert, workersAiTranslator, type Lang } from "./convert.ts";
import { PAGE_HTML } from "./page.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleConvert(request: Request, env: Env): Promise<Response> {
  let body: { text?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "リクエストの JSON が不正です" }, 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang = body.lang;
  if (!text) return json({ error: "text が空です" }, 400);
  if (lang !== "ja" && lang !== "en") return json({ error: "lang は ja または en を指定してください" }, 400);

  try {
    return json(await convert(text, lang as Lang, workersAiTranslator(env.AI)));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: `翻訳に失敗しました: ${message}` }, 502);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/" && request.method === "GET") {
      return new Response(PAGE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (pathname === "/api/convert") {
      if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
      return handleConvert(request, env);
    }
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
