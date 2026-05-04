import {MissionDef} from '../game/types.js';

const MISSION_INTRO = document.getElementById('mission-intro');
const MISSION_TITLE = document.getElementById('mission-title');
const MISSION_GOAL = document.getElementById('mission-goal');

let activeTimeout: ReturnType<typeof setTimeout> | null = null;

export async function showIntro(mission: MissionDef): Promise<void> {
  if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  return new Promise(resolve => {
    if (MISSION_INTRO) MISSION_INTRO.classList.remove('hidden');
    if (MISSION_TITLE) MISSION_TITLE.textContent = mission.name;
    if (MISSION_GOAL) MISSION_GOAL.textContent = mission.goal;

    activeTimeout = setTimeout(() => {
      activeTimeout = null;
      if (MISSION_INTRO) MISSION_INTRO.classList.add('hidden');
      resolve();
    }, 2500);
  });
}

export function hideIntro(): void {
  if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  if (MISSION_INTRO) MISSION_INTRO.classList.add('hidden');
}
