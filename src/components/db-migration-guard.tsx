"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/language";

type DbHealth = {
  ok: boolean;
  connected: boolean;
  missingTables: string[];
  errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY";
};

const dict = {
  en: {
    title: "Database setup required",
    dbUnavailable: "Cannot connect to the database right now.",
    tablesMissing: "Required tables are missing:",
    help: "Run: psql \"$DATABASE_URL\" -f db/migrations/0001_init_myshop.sql",
    retry: "Retry",
  },
  pt: {
    title: "Configuração da base de dados necessária",
    dbUnavailable: "Não foi possível ligar à base de dados neste momento.",
    tablesMissing: "Faltam tabelas obrigatórias:",
    help: "Execute: psql \"$DATABASE_URL\" -f db/migrations/0001_init_myshop.sql",
    retry: "Tentar novamente",
  },
};

export function DbMigrationGuard({ health, onRetry }: { health: DbHealth | null; onRetry: () => Promise<void> | void }) {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [retrying, setRetrying] = useState(false);

  if (!health || health.ok) return null;

  const retry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t.title}</p>
          {health.errorCode === "DB_UNAVAILABLE" ? (
            <p className="mt-1 text-sm">{t.dbUnavailable}</p>
          ) : (
            <>
              <p className="mt-1 text-sm">{t.tablesMissing} <span className="font-medium">{health.missingTables.join(", ") || "-"}</span></p>
              <code className="mt-2 block rounded border border-amber-200 bg-white px-2 py-1 text-xs">{t.help}</code>
            </>
          )}
        </div>
        <button
          onClick={retry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {t.retry}
        </button>
      </div>
    </div>
  );
}
