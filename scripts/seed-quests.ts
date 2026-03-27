// T125: Database seed script for initial quests

import { db } from '../src/lib/db/client';
import { quests } from '../src/lib/db/schema';
import type { QuestRequirements } from '../src/lib/db/schema';

interface QuestSeed {
  name: string;
  description: string;
  type: 'one_time' | 'daily' | 'weekly' | 'achievement';
  requirements: QuestRequirements;
  xpReward: number;
}

const INITIAL_QUESTS: QuestSeed[] = [
  // Daily Quests
  {
    name: 'Daily Applicant',
    description: 'Submit at least one job application today.',
    type: 'daily',
    requirements: { action: 'application_created', count: 1 },
    xpReward: 15,
  },
  {
    name: 'Status Updater',
    description: 'Update the status of any application today.',
    type: 'daily',
    requirements: { action: 'status_updated', count: 1 },
    xpReward: 10,
  },

  // Weekly Quests
  {
    name: 'Weekly Warrior',
    description: 'Submit 5 job applications this week.',
    type: 'weekly',
    requirements: { action: 'application_created', count: 5 },
    xpReward: 75,
  },
  {
    name: 'Resume Master',
    description: 'Upload 2 different resumes this week.',
    type: 'weekly',
    requirements: { action: 'resume_uploaded', count: 2 },
    xpReward: 40,
  },
  {
    name: 'Active Tracker',
    description: 'Update application statuses 5 times this week.',
    type: 'weekly',
    requirements: { action: 'status_updated', count: 5 },
    xpReward: 50,
  },

  // One-Time Quests
  {
    name: 'First Steps',
    description: 'Submit your first job application.',
    type: 'one_time',
    requirements: { action: 'application_created', count: 1 },
    xpReward: 50,
  },
  {
    name: 'Resume Ready',
    description: 'Upload your first resume.',
    type: 'one_time',
    requirements: { action: 'resume_uploaded', count: 1 },
    xpReward: 30,
  },
  {
    name: 'Getting Started',
    description: 'Submit 10 total job applications.',
    type: 'one_time',
    requirements: { action: 'application_created', count: 10 },
    xpReward: 100,
  },
  {
    name: 'Dedicated Seeker',
    description: 'Submit 25 total job applications.',
    type: 'one_time',
    requirements: { action: 'application_created', count: 25 },
    xpReward: 200,
  },
  {
    name: 'Job Hunt Pro',
    description: 'Submit 50 total job applications.',
    type: 'one_time',
    requirements: { action: 'application_created', count: 50 },
    xpReward: 400,
  },

  // Achievement Quests (status-based)
  {
    name: 'Phone Screen Champion',
    description: 'Advance 3 applications to phone screen stage.',
    type: 'achievement',
    requirements: { action: 'status_updated', count: 3, targetStatus: 'phone_screen' },
    xpReward: 75,
  },
  {
    name: 'Interview Ready',
    description: 'Advance 3 applications to technical interview stage.',
    type: 'achievement',
    requirements: { action: 'status_updated', count: 3, targetStatus: 'technical_interview' },
    xpReward: 100,
  },
  {
    name: 'On-Site Expert',
    description: 'Advance 2 applications to on-site interview stage.',
    type: 'achievement',
    requirements: { action: 'status_updated', count: 2, targetStatus: 'onsite' },
    xpReward: 150,
  },
  {
    name: 'Offer Getter',
    description: 'Receive your first job offer!',
    type: 'achievement',
    requirements: { action: 'status_updated', count: 1, targetStatus: 'offer' },
    xpReward: 500,
  },
  {
    name: 'Success Story',
    description: 'Accept a job offer - congratulations!',
    type: 'achievement',
    requirements: { action: 'status_updated', count: 1, targetStatus: 'accepted' },
    xpReward: 1000,
  },
];

async function seedQuests() {
  console.log('Seeding quests...');

  for (const quest of INITIAL_QUESTS) {
    try {
      await db.insert(quests).values({
        name: quest.name,
        description: quest.description,
        type: quest.type,
        requirements: quest.requirements,
        xpReward: quest.xpReward,
        isActive: true,
      });
      console.log(`  Created quest: ${quest.name}`);
    } catch (error) {
      console.error(`  Failed to create quest: ${quest.name}`, error);
    }
  }

  console.log('Quest seeding complete!');
}

// Run the seed
seedQuests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
