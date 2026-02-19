-- Migration for Sprint S48: Payment Integration
-- Add payment system tables to support M-Pesa, bank transfers, and revenue settlement

-- Create payments table
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
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller_id ON payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_settled ON payments(settled);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create payment status history table
CREATE TABLE IF NOT EXISTS payment_status_history (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    previous_status VARCHAR(32) DEFAULT '',
    reason TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(64) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for payment status history
CREATE INDEX IF NOT EXISTS idx_payment_status_history_payment_id ON payment_status_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_history_created_at ON payment_status_history(created_at);

-- Create payment instructions table
CREATE TABLE IF NOT EXISTS payment_instructions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    method VARCHAR(32) NOT NULL CHECK (method IN ('bank_transfer', 'mpesa', 'mobile_money')),
    
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
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Unique constraint for seller + method combination
    UNIQUE(seller_id, method)
);

-- Create indexes for payment instructions
CREATE INDEX IF NOT EXISTS idx_payment_instructions_seller_id ON payment_instructions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_method ON payment_instructions(method);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_active ON payment_instructions(active);

-- Create settlements table
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
    payment_ids TEXT DEFAULT '', -- comma-separated payment IDs
    
    -- Metadata
    notes TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for settlements
CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period_start ON settlements(period_start);
CREATE INDEX IF NOT EXISTS idx_settlements_period_end ON settlements(period_end);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at);

-- Add helpful comments
COMMENT ON TABLE payments IS 'Payment transactions for orders supporting M-Pesa, bank transfers, and cash on delivery';
COMMENT ON TABLE payment_status_history IS 'Audit trail for payment status changes';
COMMENT ON TABLE payment_instructions IS 'Seller-specific payment instructions for different payment methods';
COMMENT ON TABLE settlements IS 'Revenue settlement records for seller payouts';

-- Create a function to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_instructions_updated_at ON payment_instructions;
CREATE TRIGGER update_payment_instructions_updated_at BEFORE UPDATE ON payment_instructions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;
CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();