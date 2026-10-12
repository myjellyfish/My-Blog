const openExitButton = document.querySelector("#open-exit-dialog");
const exitDialog = document.querySelector("#exit-dialog");
const confirmExitButton = document.querySelector("#confirm-exit");
const cancelExitButton = document.querySelector("#cancel-exit");

let previouslyFocusedElement = null;

function openExitDialog() {
  previouslyFocusedElement = document.activeElement;
  exitDialog.hidden = false;
  cancelExitButton.focus();
}

function closeExitDialog() {
  exitDialog.hidden = true;

  if (previouslyFocusedElement instanceof HTMLElement) {
    previouslyFocusedElement.focus();
  } else {
    openExitButton.focus();
  }
}

function leaveWebsite() {
  // Browsers normally block scripts from closing a tab they did not open.
  // Try to close it first, then reliably leave the website by replacing it
  // with a blank page if the tab remains open.
  window.close();
  window.setTimeout(() => {
    window.location.replace("about:blank");
  }, 120);
}

if (openExitButton && exitDialog && confirmExitButton && cancelExitButton) {
  openExitButton.addEventListener("click", openExitDialog);
  cancelExitButton.addEventListener("click", closeExitDialog);
  confirmExitButton.addEventListener("click", leaveWebsite);

  document.addEventListener("keydown", (event) => {
  if (exitDialog.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeExitDialog();
    return;
  }

  if (event.key !== "Tab") return;

  const buttons = [confirmExitButton, cancelExitButton];
  const currentIndex = buttons.indexOf(document.activeElement);

  if (event.shiftKey && currentIndex <= 0) {
    event.preventDefault();
    buttons.at(-1).focus();
  } else if (!event.shiftKey && currentIndex === buttons.length - 1) {
    event.preventDefault();
    buttons[0].focus();
  }
  });
}

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const customCursor = document.querySelector("#custom-cursor");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let cursorFrame = 0;
let pointerX = -100;
let pointerY = -100;
let lastGlitterX = -100;
let lastGlitterY = -100;
let lastGlitterTime = 0;
let glitterIndex = 0;

function drawCursor() {
  customCursor.style.setProperty("--cursor-x", `${pointerX}px`);
  customCursor.style.setProperty("--cursor-y", `${pointerY}px`);
  cursorFrame = 0;
}

function createCursorGlitter(x, y) {
  const glitter = document.createElement("span");
  const size = 3 + Math.random() * 4;

  glitter.className = "cursor-sparkle";
  glitter.style.left = `${x + (Math.random() - 0.5) * 13}px`;
  glitter.style.top = `${y + 10 + Math.random() * 7}px`;
  glitter.style.setProperty("--glitter-size", `${size}px`);
  glitter.style.setProperty("--glitter-x", `${(Math.random() - 0.5) * 8}px`);
  glitter.style.setProperty("--glitter-drift", `${(Math.random() - 0.5) * 18}px`);
  glitter.style.setProperty("--glitter-fall", `${20 + Math.random() * 20}px`);
  glitter.style.setProperty("--glitter-turn", `${(Math.random() - 0.5) * 60}deg`);
  glitter.style.setProperty("--glitter-life", `${950 + Math.random() * 420}ms`);
  document.body.append(glitter);
  glitter.addEventListener("animationend", () => glitter.remove(), { once: true });
}

function updateCustomCursor(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  customCursor.classList.add("is-visible");

  if (!cursorFrame) {
    cursorFrame = window.requestAnimationFrame(drawCursor);
  }

  if (reduceMotion.matches) return;

  const now = performance.now();
  const distance = Math.hypot(pointerX - lastGlitterX, pointerY - lastGlitterY);

  if (distance >= 11 && now - lastGlitterTime >= 42) {
    createCursorGlitter(pointerX, pointerY);
    if (glitterIndex % 3 === 0) {
      createCursorGlitter(pointerX - 5, pointerY + 2);
    }
    glitterIndex += 1;
    lastGlitterX = pointerX;
    lastGlitterY = pointerY;
    lastGlitterTime = now;
  }
}

function enableCustomCursor() {
  document.documentElement.classList.add("has-custom-cursor");
  document.addEventListener("pointermove", updateCustomCursor, { passive: true });
  document.addEventListener("pointerdown", () => customCursor.classList.add("is-pressed"));
  document.addEventListener("pointerup", () => customCursor.classList.remove("is-pressed"));
  document.addEventListener("pointerover", (event) => {
    customCursor.classList.toggle("is-hovering", Boolean(event.target.closest("a, button")));
  });
  document.documentElement.addEventListener("mouseleave", () => customCursor.classList.remove("is-visible"));
}

if (finePointer.matches) {
  enableCustomCursor();
}
