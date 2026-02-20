import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const s58MigrationSQL = `
-- S58 Message Moderation and Enhancement Tables

-- Message reports for flagging inappropriate content
CREATE TABLE IF NOT EXISTS message_reports (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Report details
  reason VARCHAR(32) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fraud', 'other')),
  description TEXT DEFAULT '',
  category VARCHAR(32) DEFAULT 'inappropriate' CHECK (category IN ('inappropriate', 'safety', 'fraud', 'spam')),
  
  -- Moderation status
  status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderated_by INTEGER REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  moderator_notes TEXT DEFAULT '',
  action_taken VARCHAR(64) DEFAULT '',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User blocking system
CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Block details
  reason VARCHAR(32) DEFAULT '',
  notes TEXT DEFAULT '',
  block_type VARCHAR(32) DEFAULT 'messages' CHECK (block_type IN ('messages', 'orders', 'all')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can't block the same person twice
  UNIQUE(blocker_id, blocked_user_id)
);

-- Content filtering rules
CREATE TABLE IF NOT EXISTS content_filters (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE, -- null = global
  
  -- Filter configuration
  name VARCHAR(256) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  filter_type VARCHAR(32) NOT NULL CHECK (filter_type IN ('phone', 'email', 'url', 'keyword', 'regex')),
  
  -- Filter patterns (JSON array)
  patterns JSONB DEFAULT '[]'::jsonb,
  case_sensitive BOOLEAN DEFAULT false,
  whole_words_only BOOLEAN DEFAULT false,
  
  -- Actions
  action VARCHAR(32) DEFAULT 'flag' CHECK (action IN ('flag', 'block', 'replace', 'warn')),
  replacement TEXT DEFAULT '[FILTERED]',
  severity VARCHAR(16) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  
  -- Statistics
  match_count INTEGER DEFAULT 0,
  last_match TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message filter matches (audit trail)
CREATE TABLE IF NOT EXISTS message_filter_matches (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filter_id INTEGER NOT NULL REFERENCES content_filters(id) ON DELETE CASCADE,
  
  -- Match details
  matched_text TEXT NOT NULL,
  filter_pattern TEXT NOT NULL,
  action_taken VARCHAR(32) NOT NULL,
  
  -- Context
  original_content TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message file uploads
CREATE TABLE IF NOT EXISTS message_files (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- File details
  file_name VARCHAR(256) NOT NULL,
  file_type VARCHAR(64) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  
  -- File metadata
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for videos/audio in seconds
  
  -- Security
  virus_scanned BOOLEAN DEFAULT false,
  scan_result VARCHAR(32) DEFAULT 'pending' CHECK (scan_result IN ('pending', 'clean', 'infected', 'error')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation moderation flags
CREATE TABLE IF NOT EXISTS conversation_flags (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  flagged_by INTEGER REFERENCES users(id), -- null = auto-flagged
  
  -- Flag details
  reason VARCHAR(64) NOT NULL,
  description TEXT DEFAULT '',
  severity VARCHAR(16) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Auto-flag metadata
  auto_flagged BOOLEAN DEFAULT false,
  trigger_rules JSONB DEFAULT '[]'::jsonb, -- Filter IDs that triggered flag
  
  -- Moderation status
  status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderated_by INTEGER REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  moderator_notes TEXT DEFAULT '',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_created_at ON message_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reports_conversation ON message_reports(conversation_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_content_filters_store ON content_filters(store_id);
CREATE INDEX IF NOT EXISTS idx_content_filters_enabled ON content_filters(enabled);
CREATE INDEX IF NOT EXISTS idx_content_filters_type ON content_filters(filter_type);

CREATE INDEX IF NOT EXISTS idx_message_filter_matches_message ON message_filter_matches(message_id);
CREATE INDEX IF NOT EXISTS idx_message_filter_matches_filter ON message_filter_matches(filter_id);

CREATE INDEX IF NOT EXISTS idx_message_files_message ON message_files(message_id);
CREATE INDEX IF NOT EXISTS idx_message_files_uploaded_by ON message_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_conversation_flags_conversation ON conversation_flags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_flags_status ON conversation_flags(status);
CREATE INDEX IF NOT EXISTS idx_conversation_flags_severity ON conversation_flags(severity);
CREATE INDEX IF NOT EXISTS idx_conversation_flags_created_at ON conversation_flags(created_at DESC);

-- Add updated_at trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_message_reports_updated_at BEFORE UPDATE ON message_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_filters_updated_at BEFORE UPDATE ON content_filters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_flags_updated_at BEFORE UPDATE ON conversation_flags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function runS58Migration() {
  try {
    console.log('🚀 Starting S58 messaging enhancement migration...');
    
    // Run the migration SQL
    await sql`${s58MigrationSQL}`;
    
    console.log('✅ S58 messaging enhancement tables created successfully!');
    
    // Check if we should also create the base messaging tables (S57)
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'typing_indicators')
    `;
    
    if (tablesCheck.length < 3) {
      console.log('⚠️  Base messaging tables (S57) not found. Creating them...');
      
      // Create base messaging tables
      await sql`
        -- Base messaging tables from S57
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          
          -- Conversation metadata
          subject VARCHAR(256) DEFAULT '',
          status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
          
          -- Last message info for quick access
          last_message_id INTEGER,
          last_message_at TIMESTAMPTZ,
          last_message_preview VARCHAR(150) DEFAULT '',
          
          -- Unread counts
          unread_by_customer INTEGER DEFAULT 0,
          unread_by_seller INTEGER DEFAULT 0,
          
          -- Related entities (optional)
          product_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL,
          order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
          
          -- Timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          
          -- Message content
          content TEXT NOT NULL,
          message_type VARCHAR(32) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
          
          -- File attachments (JSON array)
          attachments JSONB DEFAULT '[]'::jsonb,
          
          -- Message metadata (JSON)
          metadata JSONB DEFAULT '{}'::jsonb,
          
          -- Read receipts (simplified approach)
          read_by_customer BOOLEAN DEFAULT false,
          read_by_customer_at TIMESTAMPTZ,
          read_by_seller BOOLEAN DEFAULT false,
          read_by_seller_at TIMESTAMPTZ,
          
          -- Soft delete
          deleted_at TIMESTAMPTZ,
          deleted_by INTEGER REFERENCES users(id),
          
          -- Timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS typing_indicators (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          
          -- Typing state
          is_typing BOOLEAN DEFAULT true,
          last_typing_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          
          -- Auto-cleanup old indicators (handled by app logic)
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_conversations_store ON conversations(store_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
        CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);

        CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON typing_indicators(user_id);

        -- Add triggers for updated_at
        CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      
      console.log('✅ Base messaging tables (S57) created successfully!');
    } else {
      console.log('✅ Base messaging tables (S57) already exist');
    }
    
    console.log('\n📊 Migration Summary:');
    console.log('   ✅ Message reports and blocking system');
    console.log('   ✅ Content filtering infrastructure');
    console.log('   ✅ File upload support');
    console.log('   ✅ Conversation moderation flags');
    console.log('   ✅ Database indexes for performance');
    console.log('   ✅ Auto-updating timestamps');
    
  } catch (error) {
    console.error('❌ S58 messaging migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await runS58Migration();
    console.log('\n🎉 S58 messaging enhancement migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up default content filters: node scripts/setup-default-filters.mjs');
    console.log('2. Test the messaging features in the application');
    console.log('3. Configure admin users for moderation access');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}