import { Metadata } from "next";
import { getSessionFromCookie } from "@/lib/session";
import { redirect } from "next/navigation";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Notifications - MyShop Dashboard",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const session = await getSessionFromCookie();
  
  if (!session?.sellerId) {
    redirect("/login");
  }

  const lang = (searchParams.lang as "en" | "pt") || "en";
  const dict = getDict(lang);
  const t = dict.notifications;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {t.title || "Notifications"}
        </h1>
        <p className="text-slate-600">
          {t.description || "Manage your notifications and preferences"}
        </p>
      </div>

      <NotificationCenter 
        t={t}
        userId={session.userId}
        sellerId={session.sellerId}
        lang={lang}
      />
    </div>
  );
}