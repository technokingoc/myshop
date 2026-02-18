import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Stores",
  description: "Browse stores and discover products from local sellers on MyShop.",
  openGraph: {
    title: "Browse Stores — MyShop",
    description: "Browse stores and discover products from local sellers on MyShop.",
  },
};

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
