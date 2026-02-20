-- S57: Add messaging/chat infrastructure tables
-- Date: 2025-02-20

-- Chat/messaging system tables
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  subject VARCHAR(256) DEFAULT '',
  status VARCHAR(32) DEFAULT 'active',
  
  -- Last message info for quick access
  last_message_id INTEGER,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview VARCHAR(150) DEFAULT '',
  
  -- Unread counts
  unread_by_customer INTEGER DEFAULT 0,
  unread_by_seller INTEGER DEFAULT 0,
  
  -- Related entities (optional)
  product_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  message_type VARCHAR(32) DEFAULT 'text',
  
  -- File attachments (JSON array)
  attachments JSONB DEFAULT '[]',
  
  -- Message metadata (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Read receipts
  read_by_customer BOOLEAN DEFAULT FALSE,
  read_by_customer_at TIMESTAMP WITH TIME ZONE,
  read_by_seller BOOLEAN DEFAULT FALSE,
  read_by_seller_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by INTEGER REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Typing indicators for real-time chat
CREATE TABLE IF NOT EXISTS typing_indicators (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Typing state
  is_typing BOOLEAN DEFAULT TRUE,
  last_typing_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Auto-cleanup old indicators (handled by app logic)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_typing_at ON typing_indicators(last_typing_at DESC);

-- Add foreign key for last_message_id after messages table is created
ALTER TABLE conversations 
ADD CONSTRAINT conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;