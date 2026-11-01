// @ts-nocheck
export const BOARD_SIZE = 7;

export const ANIMATION_TIMINGS = {
  QUEUE_STEP_MS: 450,
  TURN_TRANSITION_MS: 300,
  ENEMY_ACTION_MS: 420,
  MOVE_MS: 380,
  HIT_MS: 360,
  DEATH_MS: 640
};

export const TIMING = ANIMATION_TIMINGS;

export const NODE_TYPES = {
  BATTLE: 'battle',
  ELITE: 'elite',
  PUB: 'pub',
  WORKSHOP: 'workshop',
  EVENT: 'event',
  TREASURE: 'treasure',
  BOSS: 'boss'
};
