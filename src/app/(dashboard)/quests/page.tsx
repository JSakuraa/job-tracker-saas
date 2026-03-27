// T124: Quests page

import { auth } from '@/lib/auth';
import { getActiveQuests, getCompletedQuests } from '@/lib/services/quests';
import { QuestList } from '@/components/gamification';
import styles from './page.module.css';

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const [activeQuests, completedQuests] = await Promise.all([
    getActiveQuests(session.user.id),
    getCompletedQuests(session.user.id),
  ]);

  // Transform the data for the QuestList component
  const activeQuestItems = activeQuests.map((q) => ({
    quest: {
      id: q.id,
      name: q.name,
      description: q.description,
      type: q.type,
      requirements: q.requirements,
      xpReward: q.xpReward,
      isActive: q.isActive,
      createdAt: q.createdAt,
    },
    userQuest: q.userQuest,
    progressPercent: q.progressPercent,
  }));

  const completedQuestItems = completedQuests.map((q) => ({
    quest: {
      id: q.id,
      name: q.name,
      description: q.description,
      type: q.type,
      requirements: q.requirements,
      xpReward: q.xpReward,
      isActive: q.isActive,
      createdAt: q.createdAt,
    },
    userQuest: q.userQuest,
    progressPercent: q.progressPercent,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>QUESTS</h1>
        <p className={styles.subtitle}>
          Complete quests to earn XP and level up faster!
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ACTIVE QUESTS</h2>
        <QuestList
          quests={activeQuestItems}
          emptyMessage="No active quests. Check back soon for new challenges!"
        />
      </section>

      {completedQuestItems.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>COMPLETED</h2>
          <QuestList quests={completedQuestItems} />
        </section>
      )}
    </div>
  );
}
