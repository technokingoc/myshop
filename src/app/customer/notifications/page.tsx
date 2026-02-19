import { Metadata } from "next";
import { getCustomerSession } from "@/lib/customer-session";
import { redirect } from "next/navigation";
import { CustomerNotificationCenter } from "@/components/notifications/customer-notification-center";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Notifications - MyShop",
};

export default async function CustomerNotificationsPage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const session = await getCustomerSession();
  
  if (!session) {
    redirect("/customer/login");
  }

  const lang = (searchParams.lang as "en" | "pt") || "en";
  const dict = getDict(lang);
  const t = dict.notifications;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Notifications
          </h1>
          <p className="text-slate-600">
            Stay updated on your orders and account activity
          </p>
        </div>

        <CustomerNotificationCenter 
          t={t}
          customerId={session.customerId}
          lang={lang}
        />
      </div>
    </div>
  );
}