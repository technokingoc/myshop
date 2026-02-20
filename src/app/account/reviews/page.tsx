import { Metadata } from "next";
import AccountReviewsPage from "./account-reviews-page";

export const metadata: Metadata = {
  title: "My Reviews - MyShop Account",
  description: "View and manage all your product reviews and ratings",
  robots: "noindex", // Private user content
};

export default function AccountReviewsRoute() {
  return <AccountReviewsPage />;
}