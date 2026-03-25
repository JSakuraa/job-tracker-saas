# API Contract: Gamification (Quests, Goals, Rewards)

## User Stats

### GET /api/user/stats

Get user's gamification statistics.

### Response 200

```typescript
{
  data: {
    totalXp: number;
    level: number;
    xpForCurrentLevel: number;   // XP required to reach current level
    xpForNextLevel: number;      // XP required to reach next level
    xpProgress: number;          // XP earned toward next level
    loginStreakCount: number;
    lastLoginDate: string | null;
    activeQuestCount: number;
    activeGoalCount: number;
    unlockedRewardCount: number;
  };
}
```

---

## Quests

### GET /api/quests

List all available quests.

### Response 200

```typescript
{
  data: Array<{
    id: string;
    name: string;
    description: string;
    type: QuestType;
    requirements: {
      action: string;
      count: number;
      targetStatus?: string;
      timeframe?: 'day' | 'week' | 'all_time';
    };
    xpReward: number;
    userStatus: UserQuestStatus | null;  // null if not started
    progress: number;                     // Current progress count
    expiresAt: string | null;            // For daily/weekly quests
  }>;
}
```

### GET /api/quests/active

List user's in-progress quests.

### Response 200

```typescript
{
  data: Array<{
    id: string;
    questId: string;
    quest: {
      name: string;
      description: string;
      type: QuestType;
      requirements: object;
      xpReward: number;
    };
    status: 'in_progress';
    progress: number;
    startedAt: string;
    expiresAt: string | null;
  }>;
}
```

### GET /api/quests/completed

List user's completed/claimed quests.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 20) |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    questId: string;
    quest: {
      name: string;
      description: string;
      type: QuestType;
      xpReward: number;
    };
    status: 'completed' | 'claimed' | 'expired';
    completedAt: string | null;
    claimedAt: string | null;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

### POST /api/quests/:id/claim

Claim reward for a completed quest.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | UserQuest UUID |

### Response 200

```typescript
{
  data: {
    id: string;
    status: 'claimed';
    claimedAt: string;
  };
  xpAwarded: number;
}
```

### Response 400

```typescript
{
  error: {
    code: "QUEST_NOT_COMPLETE";
    message: "Quest is not complete and cannot be claimed";
  };
}
```

### Response 409

```typescript
{
  error: {
    code: "ALREADY_CLAIMED";
    message: "Quest reward has already been claimed";
  };
}
```

---

## Personal Goals

### GET /api/goals

List user's personal goals.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: `active`, `achieved`, `abandoned` |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    title: string;
    description: string | null;
    targetType: string;
    targetCount: number;
    currentCount: number;
    progressPercent: number;
    deadline: string | null;
    status: GoalStatus;
    createdAt: string;
    achievedAt: string | null;
  }>;
}
```

### POST /api/goals

Create a personal goal.

### Request Body

```typescript
{
  title: string;           // Required, 1-255 chars
  description?: string;    // Optional
  targetType: string;      // Required: 'applications', 'interviews', 'offers', etc.
  targetCount: number;     // Required, positive integer
  deadline?: string;       // Optional, ISO 8601, must be future
}
```

### Response 201

```typescript
{
  data: {
    id: string;
    title: string;
    description: string | null;
    targetType: string;
    targetCount: number;
    currentCount: number;
    deadline: string | null;
    status: 'active';
    createdAt: string;
  };
}
```

### GET /api/goals/:id

Get goal details.

### Response 200

```typescript
{
  data: {
    id: string;
    title: string;
    description: string | null;
    targetType: string;
    targetCount: number;
    currentCount: number;
    progressPercent: number;
    deadline: string | null;
    status: GoalStatus;
    createdAt: string;
    achievedAt: string | null;
  };
}
```

### PATCH /api/goals/:id

Update a goal.

### Request Body

```typescript
{
  title?: string;
  description?: string | null;
  targetCount?: number;
  deadline?: string | null;
}
```

### Response 200

Same as GET response.

### POST /api/goals/:id/achieve

Mark goal as achieved.

### Response 200

```typescript
{
  data: {
    id: string;
    status: 'achieved';
    achievedAt: string;
  };
  xpAwarded: number;
}
```

### POST /api/goals/:id/abandon

Abandon a goal.

### Response 200

```typescript
{
  data: {
    id: string;
    status: 'abandoned';
  };
}
```

### DELETE /api/goals/:id

Delete a goal.

### Response 204

No content.

---

## Rewards

### GET /api/rewards

List all rewards with unlock status.

### Response 200

```typescript
{
  data: Array<{
    id: string;
    name: string;
    description: string;
    type: RewardType;
    assetKey: string;
    unlockCriteria: {
      type: 'level' | 'achievement' | 'quest';
      value: number | string;
    };
    isUnlocked: boolean;
    isEquipped: boolean;
    unlockedAt: string | null;
  }>;
}
```

### GET /api/rewards/unlocked

List only unlocked rewards.

### Response 200

```typescript
{
  data: Array<{
    id: string;
    name: string;
    description: string;
    type: RewardType;
    assetKey: string;
    isEquipped: boolean;
    unlockedAt: string;
  }>;
}
```

### POST /api/rewards/:id/equip

Equip a reward (avatar or theme).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Reward UUID |

### Response 200

```typescript
{
  data: {
    id: string;
    isEquipped: true;
    previousEquipped: string | null;  // ID of previously equipped reward of same type
  };
}
```

### Response 400

```typescript
{
  error: {
    code: "NOT_UNLOCKED";
    message: "Reward has not been unlocked";
  };
}
```

### POST /api/rewards/:id/unequip

Unequip a reward.

### Response 200

```typescript
{
  data: {
    id: string;
    isEquipped: false;
  };
}
```

---

## Types

```typescript
type QuestType = 'one_time' | 'daily' | 'weekly' | 'achievement';

type UserQuestStatus = 'in_progress' | 'completed' | 'claimed' | 'expired';

type GoalStatus = 'active' | 'achieved' | 'abandoned';

type RewardType = 'badge' | 'avatar' | 'theme';
```
