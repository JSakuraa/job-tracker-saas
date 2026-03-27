// T170: Database seed script for initial rewards

import { db } from '@/lib/db/client';
import { rewards } from '@/lib/db/schema';
import type { UnlockCriteria } from '@/lib/db/schema';

interface RewardSeed {
  name: string;
  description: string;
  type: 'badge' | 'avatar' | 'theme';
  assetKey: string;
  unlockCriteria: UnlockCriteria;
}

const REWARDS: RewardSeed[] = [
  // Badges
  {
    name: 'First Steps',
    description: 'Reach level 2 - You\'ve started your journey!',
    type: 'badge',
    assetKey: 'badge-first-steps',
    unlockCriteria: { type: 'level', value: 2 },
  },
  {
    name: 'Job Seeker',
    description: 'Reach level 5 - You\'re getting serious!',
    type: 'badge',
    assetKey: 'badge-job-seeker',
    unlockCriteria: { type: 'level', value: 5 },
  },
  {
    name: 'Application Pro',
    description: 'Reach level 10 - A true professional!',
    type: 'badge',
    assetKey: 'badge-application-pro',
    unlockCriteria: { type: 'level', value: 10 },
  },
  {
    name: 'Career Hunter',
    description: 'Reach level 15 - On the hunt for success!',
    type: 'badge',
    assetKey: 'badge-career-hunter',
    unlockCriteria: { type: 'level', value: 15 },
  },
  {
    name: 'Job Master',
    description: 'Reach level 20 - Master of the job market!',
    type: 'badge',
    assetKey: 'badge-job-master',
    unlockCriteria: { type: 'level', value: 20 },
  },

  // Avatars
  {
    name: 'Default Pixel',
    description: 'The classic pixel avatar',
    type: 'avatar',
    assetKey: 'avatar-default',
    unlockCriteria: { type: 'level', value: 1 },
  },
  {
    name: 'Cool Shades',
    description: 'Looking cool with those shades',
    type: 'avatar',
    assetKey: 'avatar-shades',
    unlockCriteria: { type: 'level', value: 5 },
  },
  {
    name: 'Business Pro',
    description: 'Suited up and ready for interviews',
    type: 'avatar',
    assetKey: 'avatar-business',
    unlockCriteria: { type: 'level', value: 10 },
  },
  {
    name: 'Tech Wizard',
    description: 'The coding wizard look',
    type: 'avatar',
    assetKey: 'avatar-wizard',
    unlockCriteria: { type: 'level', value: 15 },
  },
  {
    name: 'Golden Champion',
    description: 'The ultimate achievement look',
    type: 'avatar',
    assetKey: 'avatar-golden',
    unlockCriteria: { type: 'level', value: 20 },
  },

  // Themes
  {
    name: 'Classic Dark',
    description: 'The default dark theme',
    type: 'theme',
    assetKey: 'theme-dark',
    unlockCriteria: { type: 'level', value: 1 },
  },
  {
    name: 'Retro Green',
    description: 'Old-school terminal green vibes',
    type: 'theme',
    assetKey: 'theme-retro-green',
    unlockCriteria: { type: 'level', value: 3 },
  },
  {
    name: 'Ocean Blue',
    description: 'Calm and professional blue tones',
    type: 'theme',
    assetKey: 'theme-ocean',
    unlockCriteria: { type: 'level', value: 7 },
  },
  {
    name: 'Sunset Orange',
    description: 'Warm sunset colors',
    type: 'theme',
    assetKey: 'theme-sunset',
    unlockCriteria: { type: 'level', value: 12 },
  },
  {
    name: 'Neon Purple',
    description: 'Cyberpunk-inspired neon colors',
    type: 'theme',
    assetKey: 'theme-neon',
    unlockCriteria: { type: 'level', value: 18 },
  },
];

async function seedRewards() {
  console.log('🎁 Seeding rewards...');

  for (const reward of REWARDS) {
    try {
      await db.insert(rewards).values({
        name: reward.name,
        description: reward.description,
        type: reward.type,
        assetKey: reward.assetKey,
        unlockCriteria: reward.unlockCriteria,
      });
      console.log(`  ✓ Created reward: ${reward.name}`);
    } catch (error) {
      // Check if it's a duplicate key error
      if (error instanceof Error && error.message.includes('duplicate')) {
        console.log(`  - Reward already exists: ${reward.name}`);
      } else {
        console.error(`  ✗ Failed to create reward: ${reward.name}`, error);
      }
    }
  }

  console.log('🎁 Rewards seeding complete!');
}

// Run the seed
seedRewards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
