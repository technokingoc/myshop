import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

const defaultFilters = [
  {
    name: 'Phone Numbers',
    filterType: 'phone',
    patterns: [
      '\\+?\\d{1,3}[-\\s]?\\(?\\d{2,3}\\)?[-\\s]?\\d{3,4}[-\\s]?\\d{3,4}',
      '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
      '\\b\\d{2,3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}\\b' // Mozambique format
    ],
    action: 'flag',
    severity: 'medium',
    description: 'Detects phone numbers in messages for moderation review'
  },
  {
    name: 'Email Addresses',
    filterType: 'email', 
    patterns: ['[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],
    action: 'flag',
    severity: 'medium',
    description: 'Flags email addresses to prevent contact info sharing'
  },
  {
    name: 'External URLs',
    filterType: 'url',
    patterns: [
      'https?://[^\\s]+',
      'www\\.[^\\s]+',
      '[a-zA-Z0-9-]+\\.(com|org|net|edu|gov|mil|int|co|io|me|ly|app)[/\\w]*'
    ],
    action: 'flag',
    severity: 'low',
    description: 'Flags external URLs and websites'
  },
  {
    name: 'WhatsApp References',
    filterType: 'keyword',
    patterns: ['whatsapp', 'whatapp', 'zap', 'watsapp'],
    caseSensitive: false,
    wholeWordsOnly: false,
    action: 'warn',
    severity: 'medium',
    description: 'Warns about WhatsApp references to discourage off-platform communication'
  },
  {
    name: 'Contact Me Outside',
    filterType: 'keyword',
    patterns: [
      'contact me outside',
      'reach me at',
      'call me at',
      'text me',
      'send me sms',
      'my number is',
      'contacte-me',
      'liga-me',
      'manda sms'
    ],
    caseSensitive: false,
    wholeWordsOnly: false,
    action: 'flag',
    severity: 'high',
    description: 'Flags attempts to move communication off-platform'
  },
  {
    name: 'Profanity Filter',
    filterType: 'keyword',
    patterns: [
      // English profanity (sample - add more as needed)
      '\\bfuck\\b', '\\bshit\\b', '\\bbitch\\b', '\\basshole\\b',
      // Portuguese profanity (sample - add more as needed) 
      '\\bmerda\\b', '\\bcabrão\\b', '\\bputa\\b', '\\bfoda\\b'
    ],
    caseSensitive: false,
    wholeWordsOnly: true,
    action: 'replace',
    replacement: '[***]',
    severity: 'low',
    description: 'Replaces profanity with asterisks'
  },
  {
    name: 'Scam Keywords',
    filterType: 'keyword',
    patterns: [
      'guaranteed profit',
      'risk free',
      'make money fast',
      'no experience needed',
      'work from home',
      'easy money',
      'click here now',
      'limited time offer',
      'act now',
      'winner',
      'congratulations you won'
    ],
    caseSensitive: false,
    wholeWordsOnly: false,
    action: 'block',
    severity: 'high',
    description: 'Blocks messages containing common scam phrases'
  },
  {
    name: 'Cryptocurrency/Investment',
    filterType: 'keyword',
    patterns: [
      'bitcoin', 'crypto', 'investment opportunity',
      'forex', 'trading', 'profit guarantee',
      'high returns', 'quick profit', 'passive income'
    ],
    caseSensitive: false,
    wholeWordsOnly: false,
    action: 'flag',
    severity: 'high',
    description: 'Flags cryptocurrency and investment-related content for review'
  },
  {
    name: 'Social Media Platforms',
    filterType: 'keyword',
    patterns: [
      'facebook', 'instagram', 'telegram', 'twitter',
      'tiktok', 'snapchat', 'linkedin', 'youtube',
      'follow me on', 'add me on', 'find me on'
    ],
    caseSensitive: false,
    wholeWordsOnly: false,
    action: 'warn',
    severity: 'low',
    description: 'Warns about social media platform references'
  }
];

async function setupDefaultFilters() {
  try {
    console.log('Setting up default content filters...');

    // Check if filters already exist to avoid duplicates
    const existingFilters = await sql`
      SELECT name FROM content_filters WHERE store_id IS NULL
    `;
    const existingNames = existingFilters.map(f => f.name);

    let inserted = 0;
    let skipped = 0;

    for (const filter of defaultFilters) {
      if (existingNames.includes(filter.name)) {
        console.log(`⏭️  Skipping existing filter: ${filter.name}`);
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO content_filters (
          store_id, name, enabled, filter_type, patterns,
          case_sensitive, whole_words_only, action, replacement, severity
        ) VALUES (
          null, ${filter.name}, true, ${filter.filterType}, ${JSON.stringify(filter.patterns)},
          ${filter.caseSensitive || false}, ${filter.wholeWordsOnly || false},
          ${filter.action}, ${filter.replacement || '[FILTERED]'}, ${filter.severity}
        )
      `;

      console.log(`✅ Created filter: ${filter.name} (${filter.action})`);
      inserted++;
    }

    console.log(`\n📊 Setup completed:`);
    console.log(`   Created: ${inserted} filters`);
    console.log(`   Skipped: ${skipped} existing filters`);
    console.log(`   Total available: ${inserted + skipped} content filters`);

  } catch (error) {
    console.error('❌ Error setting up default filters:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupDefaultFilters();
    console.log('\n🎉 Default content filters setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}