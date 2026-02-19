import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured");
    }
    
    const sql = neon(url);
    console.log('Starting payment system migration (S48)...');

    // Step 1: Create payments table
    console.log('Creating payments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          
          -- Payment details
          method VARCHAR(32) NOT NULL CHECK (method IN ('mpesa', 'bank_transfer', 'cash_on_delivery')),
          provider VARCHAR(64) DEFAULT '',
          status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          
          -- Amounts
          amount DECIMAL(12,2) NOT NULL,
          fees DECIMAL(10,2) DEFAULT 0,
          net_amount DECIMAL(12,2) NOT NULL,
          currency VARCHAR(8) DEFAULT 'MZN',
          
          -- External references
          external_id VARCHAR(128) UNIQUE,
          external_reference VARCHAR(256) DEFAULT '',
          confirmation_code VARCHAR(64) DEFAULT '',
          
          -- Payment details
          payer_phone VARCHAR(32) DEFAULT '',
          payer_name VARCHAR(256) DEFAULT '',
          payer_email VARCHAR(256) DEFAULT '',
          
          -- Settlement tracking
          settled BOOLEAN DEFAULT FALSE,
          settled_at TIMESTAMP WITH TIME ZONE,
          settled_amount DECIMAL(12,2) DEFAULT 0,
          
          -- Metadata
          metadata JSONB DEFAULT '{}',
          
          -- Timestamps
          initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          processed_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          failed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 2: Create indexes for payments table
    console.log('Creating indexes for payments table...');
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_seller_id ON payments(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON payments(completed_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_settled ON payments(settled)`;

    // Step 3: Create payment status history table
    console.log('Creating payment status history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payment_status_history (
          id SERIAL PRIMARY KEY,
          payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          status VARCHAR(32) NOT NULL,
          previous_status VARCHAR(32) DEFAULT '',
          reason TEXT DEFAULT '',
          metadata JSONB DEFAULT '{}',
          created_by VARCHAR(64) DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_payment_status_history_payment_id ON payment_status_history(payment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_status_history_created_at ON payment_status_history(created_at)`;

    // Step 4: Create payment instructions table
    console.log('Creating payment instructions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payment_instructions (
          id SERIAL PRIMARY KEY,
          seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
          method VARCHAR(32) NOT NULL,
          
          -- Bank transfer details
          bank_name VARCHAR(256) DEFAULT '',
          account_number VARCHAR(64) DEFAULT '',
          account_name VARCHAR(256) DEFAULT '',
          swift_code VARCHAR(32) DEFAULT '',
          iban VARCHAR(64) DEFAULT '',
          
          -- Mobile money details
          mobile_number VARCHAR(32) DEFAULT '',
          network_provider VARCHAR(64) DEFAULT '',
          
          -- Instructions text
          instructions_en TEXT DEFAULT '',
          instructions_pt TEXT DEFAULT '',
          
          -- Settings
          active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_payment_instructions_seller_id ON payment_instructions(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_instructions_method ON payment_instructions(method)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_instructions_seller_method ON payment_instructions(seller_id, method)`;

    // Step 5: Create settlements table
    console.log('Creating settlements table...');
    await sql`
      CREATE TABLE IF NOT EXISTS settlements (
          id SERIAL PRIMARY KEY,
          seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
          
          -- Settlement period
          period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          
          -- Amounts
          gross_amount DECIMAL(12,2) NOT NULL,
          platform_fees DECIMAL(10,2) DEFAULT 0,
          payment_fees DECIMAL(10,2) DEFAULT 0,
          net_amount DECIMAL(12,2) NOT NULL,
          
          -- Payment details
          payment_method VARCHAR(32) DEFAULT '',
          payment_reference VARCHAR(256) DEFAULT '',
          
          -- Status
          status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          payment_ids TEXT DEFAULT '',
          
          -- Metadata
          notes TEXT DEFAULT '',
          metadata JSONB DEFAULT '{}',
          
          -- Timestamps
          processed_at TIMESTAMP WITH TIME ZONE,
          paid_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON settlements(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end)`;

    // Step 6: Create payment methods configuration table
    console.log('Creating payment methods configuration table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
          id SERIAL PRIMARY KEY,
          seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
          
          -- Method configuration
          method VARCHAR(32) NOT NULL,
          enabled BOOLEAN DEFAULT true,
          
          -- Bank transfer configuration
          bank_name VARCHAR(256) DEFAULT '',
          bank_account VARCHAR(128) DEFAULT '',
          bank_account_name VARCHAR(256) DEFAULT '',
          bank_swift_code VARCHAR(32) DEFAULT '',
          bank_branch VARCHAR(256) DEFAULT '',
          bank_instructions TEXT DEFAULT '',
          
          -- M-Pesa configuration
          mpesa_business_number VARCHAR(64) DEFAULT '',
          mpesa_business_name VARCHAR(256) DEFAULT '',
          mpesa_api_key VARCHAR(512) DEFAULT '',
          mpesa_public_key TEXT DEFAULT '',
          mpesa_service_provider_code VARCHAR(64) DEFAULT '',
          mpesa_environment VARCHAR(32) DEFAULT 'sandbox',
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_seller_method ON payment_methods(seller_id, method)`;

    // Step 7: Create payment receipts table
    console.log('Creating payment receipts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payment_receipts (
          id SERIAL PRIMARY KEY,
          payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          receipt_number VARCHAR(64) NOT NULL UNIQUE,
          receipt_data JSONB NOT NULL,
          receipt_url TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_id ON payment_receipts(payment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON payment_receipts(receipt_number)`;

    console.log('Payment system migration (S48) completed successfully!');

    return NextResponse.json({ 
      success: true,
      message: 'Payment system tables created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during migration'
      },
      { status: 500 }
    );
  }
}