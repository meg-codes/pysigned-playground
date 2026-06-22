// Light/dark toggle. Defaults to the OS preference on first visit, then
// remembers the user's explicit choice. Setting data-theme on <html> pins
// color-scheme, which drives every light-dark() value in the stylesheet.

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const LABEL: Record<Theme, string> = { light: "☀️ Light", dark: "🌙 Dark" };

function read(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(theme: Theme, btn: HTMLButtonElement) {
  document.documentElement.setAttribute("data-theme", theme);
  btn.textContent = LABEL[theme];
}

/** Wire up the toggle button and restore the saved preference. */
export function initTheme(btn: HTMLButtonElement) {
  let current = read();
  apply(current, btn);

  btn.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, current);
    apply(current, btn);
  });
}
