import { neon } from '@neondatabase/serverless';

async function runMessagingMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log('Starting S57 messaging system migration...');

    // Step 1: Create conversations table
    console.log('Creating conversations table...');
    await sql`
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
      )
    `;

    // Step 2: Create messages table
    console.log('Creating messages table...');
    await sql`
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
      )
    `;

    // Step 3: Create typing indicators table
    console.log('Creating typing indicators table...');
    await sql`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Typing state
        is_typing BOOLEAN DEFAULT TRUE,
        last_typing_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        -- Auto-cleanup old indicators (handled by app logic)
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 4: Add foreign key for last_message_id after messages table is created
    console.log('Adding last_message_id foreign key...');
    await sql`
      ALTER TABLE conversations 
      ADD CONSTRAINT conversations_last_message_id_fkey 
      FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL
    `;

    // Step 5: Create indexes for performance
    console.log('Creating indexes...');
    
    // Conversations indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON conversations(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)`;

    // Messages indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at)`;

    // Typing indicators indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_typing_indicators_last_typing_at ON typing_indicators(last_typing_at DESC)`;

    console.log('S57 messaging migration completed successfully! ✅');
    console.log('');
    console.log('Created tables:');
    console.log('- conversations (with metadata, unread counts, and relations)');
    console.log('- messages (with read receipts, attachments, soft delete)');
    console.log('- typing_indicators (for real-time typing status)');
    console.log('');
    console.log('Features enabled:');
    console.log('- Real-time messaging between customers and sellers');
    console.log('- Conversation threading and management');
    console.log('- Read receipts and message status');
    console.log('- File attachments support');
    console.log('- Typing indicators');
    console.log('- Unread message counts');
    console.log('- Product and order context linking');
    console.log('');
    console.log('Next: Implement API routes and UI components');

  } catch (error) {
    console.error('S57 messaging migration failed:', error);
    throw error;
  }
}

runMessagingMigration().catch(console.error);