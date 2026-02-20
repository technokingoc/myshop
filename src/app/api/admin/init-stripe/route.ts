import { NextRequest } from 'next/server';
import { initializeStripeProducts } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with proper authorization
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!isDevelopment && (!adminSecret || authHeader !== `Bearer ${adminSecret}`)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Initializing Stripe products and prices...');
    
    const result = await initializeStripeProducts();
    
    if (result) {
      return Response.json({
        success: true,
        message: 'Stripe products and prices initialized successfully',
        products: {
          pro: {
            productId: result.proProduct.id,
            priceId: result.proPrice.id,
          },
          business: {
            productId: result.businessProduct.id,
            priceId: result.businessPrice.id,
          },
        },
      });
    } else {
      return Response.json({
        success: true,
        message: 'Stripe products and prices already exist',
      });
    }
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}