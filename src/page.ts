export const PAGE_HTML = /* html */ `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>注音キー変換</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #f7f7f8; --fg: #1d1d1f; --muted: #6b6b70; --card: #ffffff;
    --border: #d9d9de; --accent: #2563eb; --accent-fg: #ffffff; --error: #b42318;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #141416; --fg: #ececf0; --muted: #9a9aa2; --card: #1f1f23;
      --border: #3a3a40; --accent: #60a5fa; --accent-fg: #0b1220; --error: #f97066;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Noto Sans TC", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 1.4rem; margin: 0 0 16px; }
  form, section { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  textarea { width: 100%; min-height: 96px; padding: 10px; font: inherit; color: inherit;
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px; resize: vertical; }
  .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px; }
  label { display: inline-flex; gap: 4px; align-items: center; }
  button { font: inherit; padding: 8px 16px; border: 0; border-radius: 8px; cursor: pointer;
    background: var(--accent); color: var(--accent-fg); }
  button:disabled { opacity: .6; cursor: wait; }
  button.secondary { background: transparent; color: var(--accent); border: 1px solid var(--accent); padding: 4px 12px; }
  h2 { font-size: .9rem; color: var(--muted); margin: 0 0 8px; font-weight: 600; }
  .hant { font-size: 1.5rem; margin-bottom: 16px; }
  .ruby { display: flex; flex-wrap: wrap; gap: 6px 4px; }
  .cell { display: flex; flex-direction: column; align-items: center; min-width: 2.2em; }
  .cell .z { font-size: .85rem; color: var(--muted); min-height: 1.3em; }
  .cell .c { font-size: 1.6rem; line-height: 1.2; }
  .cell .k { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .8rem; white-space: pre;
    color: var(--accent); min-height: 1.3em; }
  .keys { display: flex; gap: 8px; align-items: center; margin-top: 16px; }
  .keys code { flex: 1; font-family: ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; word-break: break-all;
    background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px; }
  .hint { font-size: .8rem; color: var(--muted); }
  .error { color: var(--error); }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<main>
  <h1>日本語・英語 → 繁体字 → 注音 → 大千配列キー</h1>
  <form id="form">
    <textarea id="text" placeholder="こんにちは / Hello, how are you?" required></textarea>
    <div class="row">
      <label><input type="radio" name="lang" value="ja" checked> 日本語</label>
      <label><input type="radio" name="lang" value="en"> 英語</label>
      <button id="submit" type="submit">変換</button>
      <span class="hint">Ctrl + Enter(Mac は ⌘ + Enter)でも変換</span>
    </div>
  </form>
  <p id="error" class="error" role="alert" hidden></p>
  <section id="result" hidden>
    <h2>繁体字</h2>
    <div id="hant" class="hant"></div>
    <h2>注音 / キー</h2>
    <div id="ruby" class="ruby"></div>
    <div class="keys">
      <code id="keys"></code>
      <button id="copy" class="secondary" type="button">コピー</button>
    </div>
  </section>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const form = $("form"), errorEl = $("error"), result = $("result");

  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

  function render(data) {
    $("hant").textContent = data.hant;
    const ruby = $("ruby");
    ruby.replaceChildren();
    Array.from(data.hant).forEach((ch, i) => {
      const isConverted = data.zhuyin[i] !== ch;
      const cell = document.createElement("div");
      cell.className = "cell";
      for (const [cls, text] of [["z", isConverted ? data.zhuyin[i] : ""], ["c", ch], ["k", isConverted ? data.keysPerChar[i] : ""]]) {
        const el = document.createElement("span");
        el.className = cls;
        el.textContent = text;
        cell.append(el);
      }
      ruby.append(cell);
    });
    $("keys").textContent = data.keys;
    result.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const button = $("submit");
    button.disabled = true;
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: $("text").value, lang: form.lang.value }),
      });
      const data = await res.json().catch(() => ({ error: "サーバーの応答を読み取れませんでした (HTTP " + res.status + ")" }));
      if (!res.ok || data.error) throw new Error(data.error || "HTTP " + res.status);
      render(data);
    } catch (err) {
      result.hidden = true;
      showError(err.message);
    } finally {
      button.disabled = false;
    }
  });

  // Ctrl + Enter(Mac は ⌘ + Enter)で変換。IME 変換確定中の Enter は無視する
  $("text").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey) || e.isComposing) return;
    e.preventDefault();
    if (!$("submit").disabled) form.requestSubmit();
  });

  $("copy").addEventListener("click", async () => {
    const btn = $("copy");
    try {
      await navigator.clipboard.writeText($("keys").textContent);
      btn.textContent = "コピーしました";
    } catch {
      btn.textContent = "コピー失敗";
    }
    setTimeout(() => (btn.textContent = "コピー"), 1500);
  });
</script>
</body>
</html>`;
