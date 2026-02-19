import { type AppLang } from '@/lib/i18n';
import CartPage from '@/components/cart/cart-page';

interface CartPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Cart({ searchParams }: CartPageProps) {
  const params = await searchParams;
  const lang = (params.lang as AppLang) || 'en';
  
  return <CartPage lang={lang} />;
}

export const metadata = {
  title: 'Shopping Cart - MyShop',
  description: 'Review your items and proceed to checkout',
};