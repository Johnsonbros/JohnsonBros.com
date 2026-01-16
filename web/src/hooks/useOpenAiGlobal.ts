import { useSyncExternalStore, useCallback, useState, useEffect } from 'react';

export interface OpenAiGlobals {
  toolOutput?: unknown;
  toolInput?: unknown;
  toolResponseMetadata?: Record<string, unknown>;
  widgetState?: Record<string, unknown>;
  locale?: string;
  theme?: 'light' | 'dark';
  displayMode?: 'inline' | 'pip' | 'fullscreen';
  callTool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  sendFollowUpMessage?: (options: { prompt: string }) => Promise<void>;
  setWidgetState?: (state: Record<string, unknown>) => void;
  requestDisplayMode?: (options: { mode: 'inline' | 'pip' | 'fullscreen' }) => Promise<void>;
  requestClose?: () => void;
  uploadFile?: (file: File) => Promise<{ fileId: string }>;
  getFileDownloadUrl?: (options: { fileId: string }) => Promise<{ downloadUrl: string }>;
}

declare global {
  interface Window {
    openai?: OpenAiGlobals;
  }
  interface WindowEventMap {
    'openai:set_globals': CustomEvent<{ globals: Partial<OpenAiGlobals> }>;
  }
}

const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] {
  return useSyncExternalStore(
    (onChange) => {
      const handleSetGlobal = (event: CustomEvent<{ globals: Partial<OpenAiGlobals> }>) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }
        onChange();
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);
      };
    },
    () => window.openai?.[key]
  );
}

export function useToolOutput<T = unknown>(): T | undefined {
  return useOpenAiGlobal('toolOutput') as T | undefined;
}

export function useToolInput<T = unknown>(): T | undefined {
  return useOpenAiGlobal('toolInput') as T | undefined;
}

export function useDisplayMode(): 'inline' | 'pip' | 'fullscreen' | undefined {
  return useOpenAiGlobal('displayMode');
}

export function useTheme(): 'light' | 'dark' {
  return useOpenAiGlobal('theme') ?? 'light';
}

export function useLocale(): string {
  return useOpenAiGlobal('locale') ?? 'en-US';
}

type WidgetState = Record<string, unknown>;
type SetStateAction<T> = T | ((prevState: T | null) => T | null);

export function useWidgetState<T extends WidgetState>(
  defaultState: T | (() => T)
): readonly [T, (state: SetStateAction<T>) => void];
export function useWidgetState<T extends WidgetState>(
  defaultState?: T | (() => T | null) | null
): readonly [T | null, (state: SetStateAction<T | null>) => void];
export function useWidgetState<T extends WidgetState>(
  defaultState?: T | (() => T | null) | null
): readonly [T | null, (state: SetStateAction<T | null>) => void] {
  const widgetStateFromWindow = useOpenAiGlobal('widgetState') as T | undefined;

  const [widgetState, _setWidgetState] = useState<T | null>(() => {
    if (widgetStateFromWindow != null) {
      return widgetStateFromWindow;
    }
    return typeof defaultState === 'function'
      ? defaultState()
      : (defaultState ?? null);
  });

  useEffect(() => {
    if (widgetStateFromWindow != null) {
      _setWidgetState(widgetStateFromWindow);
    }
  }, [widgetStateFromWindow]);

  const setWidgetState = useCallback(
    (state: SetStateAction<T | null>) => {
      _setWidgetState((prevState) => {
        const newState = typeof state === 'function' ? state(prevState) : state;
        if (newState != null && window.openai?.setWidgetState) {
          window.openai.setWidgetState(newState);
        }
        return newState;
      });
    },
    []
  );

  return [widgetState, setWidgetState] as const;
}

export async function callTool<T = unknown>(
  name: string,
  args?: Record<string, unknown>
): Promise<T | undefined> {
  if (window.openai?.callTool) {
    return window.openai.callTool(name, args) as Promise<T>;
  }
  return undefined;
}

export async function sendFollowUp(prompt: string): Promise<void> {
  if (window.openai?.sendFollowUpMessage) {
    await window.openai.sendFollowUpMessage({ prompt });
  }
}

export async function requestDisplayMode(
  mode: 'inline' | 'pip' | 'fullscreen'
): Promise<void> {
  if (window.openai?.requestDisplayMode) {
    await window.openai.requestDisplayMode({ mode });
  }
}

export function requestClose(): void {
  if (window.openai?.requestClose) {
    window.openai.requestClose();
  }
}

export function isInChatGPT(): boolean {
  return typeof window !== 'undefined' && window.openai !== undefined;
}
