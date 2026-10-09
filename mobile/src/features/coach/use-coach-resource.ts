import { useCallback, useEffect, useState } from 'react';

export function useCoachResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this coach view.');
    } finally {
      setLoading(false);
    }
  }, [load]);

  // The request lifecycle intentionally owns these loading/error state updates.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}
