export function getToolOutput() {
  return window.openai?.toolOutput || {};
}

export function notifyHeight(root, extraPadding = 32) {
  if (window.openai?.notifyIntrinsicHeight) {
    setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + extraPadding), 50);
  }
}
