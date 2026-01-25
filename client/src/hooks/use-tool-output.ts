import { useCallback, useEffect, useMemo, useState } from "react";
import { getChatGptToolOutput, invokeTool, ToolName } from "@/lib/toolBridge";

type UseToolOutputOptions<T> = {
  toolName: ToolName;
  params?: Record<string, unknown>;
  enabled?: boolean;
  initialData?: T | null;
};

export function useToolOutput<T>({
  toolName,
  params,
  enabled = true,
  initialData = null,
}: UseToolOutputOptions<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(enabled && !initialData);
  const [error, setError] = useState<string | null>(null);

  const serializedParams = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const stableParams = useMemo(
    () => (params ? JSON.parse(serializedParams) : {}),
    [params, serializedParams]
  );

  const load = useCallback(async () => {
    if (!enabled) return;

    const toolOutput = getChatGptToolOutput<T>();
    if (toolOutput) {
      setData(toolOutput);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await invokeTool<T>(toolName, stableParams);
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, stableParams, toolName]);

  useEffect(() => {
    if (!enabled) return;
    if (!initialData) {
      load();
    } else {
      setIsLoading(false);
    }
  }, [enabled, initialData, load]);

  return {
    data,
    isLoading,
    error,
    reload: load,
  };
}
