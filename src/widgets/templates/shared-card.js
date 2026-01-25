export function getToolOutput() {
  return window.openai?.toolOutput || {};
}

export function getToolInput() {
  return window.openai?.toolInput || {};
}

export function notifyHeight(root, extraPadding = 32) {
  if (window.openai?.notifyIntrinsicHeight) {
    setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + extraPadding), 50);
  }
}

export async function callTool(name, args) {
  if (window.openai?.callTool) {
    return window.openai.callTool(name, args);
  }
  return null;
}

export async function sendFollowUp(prompt) {
  if (window.openai?.sendFollowUpMessage) {
    await window.openai.sendFollowUpMessage({ prompt });
  }
}

export function requestClose() {
  if (window.openai?.requestClose) {
    window.openai.requestClose();
  }
}

export function setWidgetState(state) {
  if (window.openai?.setWidgetState) {
    window.openai.setWidgetState(state);
  }
}

export function getWidgetState() {
  return window.openai?.widgetState || {};
}

export function getTheme() {
  return window.openai?.theme || 'light';
}

export function getLocale() {
  return window.openai?.locale || 'en-US';
}

export function isInChatGPT() {
  return typeof window !== 'undefined' && window.openai !== undefined;
}
