import {MissionDef} from '../game/types.js';

const MISSION_INTRO = document.getElementById('mission-intro');
const MISSION_TITLE = document.getElementById('mission-title');
const MISSION_GOAL = document.getElementById('mission-goal');

export async function showIntro(mission: MissionDef): Promise<void> {
  return new Promise(resolve => {
    if (MISSION_INTRO) MISSION_INTRO.classList.remove('hidden');
    if (MISSION_TITLE) MISSION_TITLE.textContent = mission.name;
    if (MISSION_GOAL) MISSION_GOAL.textContent = mission.goal;

    setTimeout(() => {
      if (MISSION_INTRO) MISSION_INTRO.classList.add('hidden');
      resolve();
    }, 2500);
  });
}

export function hideIntro(): void {
  if (MISSION_INTRO) MISSION_INTRO.classList.add('hidden');
}
