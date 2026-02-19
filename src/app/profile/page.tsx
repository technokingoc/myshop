import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/session";
import { ProfileContent } from "./profile-content";

export const metadata: Metadata = {
  title: "Profile - MyShop",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  // Check authentication using the unified session
  let session;
  try {
    session = await getSessionFromCookie();
  } catch (error) {
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  const lang = (searchParams.lang as "en" | "pt") || "en";

  return <ProfileContent session={session} lang={lang} />;
}