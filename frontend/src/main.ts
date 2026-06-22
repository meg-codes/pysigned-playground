import "./style.css";
import { initTheme } from "./theme";

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

initTheme($<HTMLButtonElement>("theme-btn"));

const mintBtn = $<HTMLButtonElement>("mint-btn");
const mintOut = $<HTMLPreElement>("mint-out");
const urlInput = $<HTMLInputElement>("url-input");
const tamperBtn = $<HTMLButtonElement>("tamper-btn");
const followBtn = $<HTMLButtonElement>("follow-btn");
const followOut = $<HTMLDivElement>("follow-out");

/** Show text in an output panel, tagged success or error. */
function showText(el: HTMLElement, text: string, ok: boolean) {
  el.hidden = false;
  el.classList.toggle("err", !ok);
  el.textContent = text;
}

/** A signed URL is always an absolute URL; reduce it to a same-origin path so
 * the browser fetches it back through the Vite proxy (keeping the host stable
 * for signature verification). */
function toLocalPath(signed: string): string {
  try {
    const u = new URL(signed);
    return u.pathname + u.search;
  } catch {
    return signed; // already a relative path
  }
}

async function mint() {
  mintBtn.disabled = true;
  try {
    const res = await fetch("/signed");
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const signed: string = data.signed;
    showText(mintOut, signed, true);
    urlInput.value = signed;
  } catch (err) {
    showText(mintOut, `Request failed: ${(err as Error).message}`, false);
  } finally {
    mintBtn.disabled = false;
  }
}

/** Flip one character of the `sig` param to forge an invalid signature. */
function tamper() {
  const raw = urlInput.value.trim();
  if (!raw) {
    showText(followOut, "Mint a URL first, then tamper with it.", false);
    return;
  }
  const marker = "sig=";
  const i = raw.indexOf(marker);
  if (i === -1) {
    showText(followOut, "No `sig` param to tamper with.", false);
    return;
  }
  const pos = i + marker.length;
  const c = raw[pos];
  const flipped = c === "a" ? "b" : "a";
  urlInput.value = raw.slice(0, pos) + flipped + raw.slice(pos + 1);
}

async function follow() {
  const raw = urlInput.value.trim();
  if (!raw) {
    showText(followOut, "Nothing to fetch — mint a URL first.", false);
    return;
  }
  followBtn.disabled = true;
  followOut.hidden = false;
  followOut.classList.remove("err");
  followOut.textContent = "Fetching…";
  try {
    const res = await fetch(toLocalPath(raw));
    const type = res.headers.get("content-type") ?? "";
    const status = `${res.status} ${res.statusText}`;

    if (res.ok && type.startsWith("image/")) {
      const url = URL.createObjectURL(await res.blob());
      followOut.classList.remove("err");
      followOut.innerHTML = `<div class="status ok">${status}</div>`;
      const img = document.createElement("img");
      img.src = url;
      img.alt = "signed resource";
      followOut.appendChild(img);
      return;
    }

    const body = type.includes("json")
      ? JSON.stringify(await res.json(), null, 2)
      : await res.text();
    followOut.classList.toggle("err", !res.ok);
    followOut.innerHTML = `<div class="status ${res.ok ? "ok" : "bad"}">${status}</div>`;
    const pre = document.createElement("pre");
    pre.textContent = body;
    followOut.appendChild(pre);
  } catch (err) {
    showText(followOut, `Request failed: ${(err as Error).message}`, false);
  } finally {
    followBtn.disabled = false;
  }
}

mintBtn.addEventListener("click", mint);
tamperBtn.addEventListener("click", tamper);
followBtn.addEventListener("click", follow);
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") follow();
});
