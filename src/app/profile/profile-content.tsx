"use client";

import { User } from "lucide-react";

interface AuthSession {
  sellerId: number;
  email: string;
  sellerSlug: string;
  storeName: string;
  role?: string;
}

export function ProfileContent({
  session,
  lang = "en",
}: {
  session: AuthSession;
  lang: "en" | "pt";
}) {
  const t = {
    en: {
      title: "Profile",
      email: "Email",
      store: "Store",
      role: "Role",
    },
    pt: {
      title: "Perfil",
      email: "Email",
      store: "Loja",
      role: "Função",
    },
  };

  const labels = t[lang];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{labels.title}</h1>
            <p className="text-slate-600">{session.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {labels.email}
            </label>
            <div className="text-sm text-slate-900">{session.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {labels.store}
            </label>
            <div className="text-sm text-slate-900">{session.storeName}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {labels.role}
            </label>
            <div className="text-sm text-slate-900 capitalize">
              {session.role || "seller"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}