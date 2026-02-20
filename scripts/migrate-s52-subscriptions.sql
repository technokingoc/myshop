-- Migration S52: Subscription Billing System
-- Creates tables for Stripe integration, subscriptions, usage tracking, and invoicing

-- Subscription billing tables for S52
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(128) UNIQUE,
    stripe_subscription_id VARCHAR(128) UNIQUE,
    stripe_price_id VARCHAR(128),
    
    -- Plan information
    plan VARCHAR(32) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'business'
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
    
    -- Billing details
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Trial information
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Grace period for failed payments
    grace_period_start TIMESTAMPTZ,
    grace_period_end TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Usage tracking for subscription limits
CREATE TABLE IF NOT EXISTS usage_records (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Usage period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Usage metrics
    products_used INTEGER DEFAULT 0,
    orders_processed INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    
    -- Limits for this period (captured from plan at time of creation)
    products_limit INTEGER DEFAULT -1, -- -1 = unlimited
    orders_limit INTEGER DEFAULT -1, -- -1 = unlimited
    storage_limit_mb INTEGER DEFAULT -1, -- -1 = unlimited
    
    -- Status
    limit_exceeded BOOLEAN DEFAULT FALSE,
    warnings_sent JSONB DEFAULT '[]', -- ['products_80', 'orders_90']
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Monthly invoices with line items
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(128) UNIQUE,
    
    -- Invoice details
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft', 'open', 'paid', 'void', 'uncollectible'
    
    -- Amounts in cents
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    amount_paid INTEGER DEFAULT 0,
    amount_remaining INTEGER DEFAULT 0,
    
    currency VARCHAR(8) DEFAULT 'USD',
    
    -- Billing period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Important dates
    invoice_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    
    -- PDF generation
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_url TEXT DEFAULT '',
    pdf_generated_at TIMESTAMPTZ,
    
    -- Customer details (snapshot at time of invoice)
    customer_details JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS subscription_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
    stripe_invoice_item_id VARCHAR(128),
    
    -- Line item details
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount INTEGER NOT NULL, -- in cents
    amount INTEGER NOT NULL, -- quantity * unit_amount, in cents
    currency VARCHAR(8) DEFAULT 'USD',
    
    -- Plan information for this line item
    plan VARCHAR(32) DEFAULT '', -- 'pro', 'business'
    pricing_type VARCHAR(32) DEFAULT 'subscription', -- 'subscription', 'usage', 'one_time'
    
    -- Usage details if applicable
    usage_start TIMESTAMPTZ,
    usage_end TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment methods for subscriptions
CREATE TABLE IF NOT EXISTS subscription_payment_methods (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(128) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(128) NOT NULL,
    
    -- Card details
    type VARCHAR(32) NOT NULL, -- 'card', 'bank_account', etc.
    brand VARCHAR(32) DEFAULT '', -- 'visa', 'mastercard', etc.
    last4 VARCHAR(4) DEFAULT '',
    exp_month INTEGER,
    exp_year INTEGER,
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Billing events log for audit trail
CREATE TABLE IF NOT EXISTS billing_events (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(64) NOT NULL, -- 'subscription.created', 'payment.succeeded', etc.
    stripe_event_id VARCHAR(128) UNIQUE,
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    processed_successfully BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT '',
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plan change requests (for handling upgrades/downgrades)
CREATE TABLE IF NOT EXISTS plan_change_requests (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Change details
    from_plan VARCHAR(32) NOT NULL,
    to_plan VARCHAR(32) NOT NULL,
    change_type VARCHAR(32) NOT NULL, -- 'upgrade', 'downgrade'
    effective_date TIMESTAMPTZ,
    
    -- Request status
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    requested_by INTEGER REFERENCES users(id),
    
    -- Proration details
    proration_amount INTEGER DEFAULT 0, -- in cents
    proration_description TEXT DEFAULT '',
    
    -- Stripe information
    stripe_subscription_schedule_id VARCHAR(128),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_seller_id ON subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period_end ON subscriptions(grace_period_end) WHERE grace_period_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_records_seller_id ON usage_records(seller_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON usage_records(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_seller_id ON subscription_invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_stripe_id ON subscription_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_date ON subscription_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_subscription_invoice_items_invoice_id ON subscription_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payment_methods_seller_id ON subscription_payment_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payment_methods_stripe_id ON subscription_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payment_methods_customer_id ON subscription_payment_methods(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_events_seller_id ON billing_events(seller_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);

CREATE INDEX IF NOT EXISTS idx_plan_change_requests_seller_id ON plan_change_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_requests_status ON plan_change_requests(status);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_records_updated_at ON usage_records;
CREATE TRIGGER update_usage_records_updated_at 
    BEFORE UPDATE ON usage_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_invoices_updated_at ON subscription_invoices;
CREATE TRIGGER update_subscription_invoices_updated_at 
    BEFORE UPDATE ON subscription_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_payment_methods_updated_at ON subscription_payment_methods;
CREATE TRIGGER update_subscription_payment_methods_updated_at 
    BEFORE UPDATE ON subscription_payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_change_requests_updated_at ON plan_change_requests;
CREATE TRIGGER update_plan_change_requests_updated_at 
    BEFORE UPDATE ON plan_change_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a comment to track this migration
INSERT INTO admin_activities (action, target_type, target_id, notes, created_at)
VALUES (
    'database_migration',
    'schema',
    52,
    'S52: Created subscription billing system tables with Stripe integration, usage tracking, and invoice generation capabilities',
    NOW()
) ON CONFLICT DO NOTHING;