import { useEffect, useState } from 'react';

type VersionPayload = {
  name: string;
  version: string;
  env?: string;
  commit?: string | null;
};

export default function VersionInfo() {
  const [info, setInfo] = useState<VersionPayload | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchVersion = () =>
      fetch('/api/version', { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (mounted && data) setInfo(data);
        })
        .catch(() => {});

    fetchVersion();
    const interval = window.setInterval(fetchVersion, 5 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!info) return null;

  const commit = info.commit ? ` ${info.commit}` : '';

  return (
    <span title={`env: ${info.env || 'unknown'}`}
      className="text-xs text-muted-foreground">
      {info.name} v{info.version}{commit}
    </span>
  );
}

