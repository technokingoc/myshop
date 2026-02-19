import { type AppLang } from '@/lib/i18n';
import CheckoutFlow from '@/components/checkout/checkout-flow';

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Checkout({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const lang = (params.lang as AppLang) || 'en';
  
  return <CheckoutFlow lang={lang} />;
}

export const metadata = {
  title: 'Checkout - MyShop',
  description: 'Complete your purchase securely',
};