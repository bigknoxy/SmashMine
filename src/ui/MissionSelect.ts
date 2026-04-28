import { MISSIONS } from '../data/missions.js';
import type { MissionDef } from '../game/types.js';
import { saveSystem } from '../game/SaveSystem.js';

const MISSION_SELECT = document.getElementById('mission-select');
const MISSION_LIST = document.getElementById('mission-list');
const BACK_BTN = document.getElementById('mission-back-btn');

let selectCallback: ((mission: MissionDef) => void) | null = null;
let backCallback: (() => void) | null = null;

export function show(onSelect: (mission: MissionDef) => void, onBack: () => void): void {
  selectCallback = onSelect;
  backCallback = onBack;
  
  if (MISSION_SELECT) MISSION_SELECT.classList.remove('hidden');
  renderMissions();

  if (BACK_BTN) {
    BACK_BTN.onclick = () => {
      hide();
      if (backCallback) backCallback();
    };
  }
}

export function hide(): void {
  if (MISSION_SELECT) MISSION_SELECT.classList.add('hidden');
}

function renderMissions(): void {
  if (!MISSION_LIST) return;

  const completedCount = saveSystem.getMissionsCompleted();
  let html = '';

  MISSIONS.forEach((m, index) => {
    const isLocked = index > completedCount;
    const isNew = index === completedCount;
    const isDone = index < completedCount;

    html += `
      <div class="mission-card ${isLocked ? 'locked' : ''}" data-index="${index}">
        <div class="mission-info">
          <span class="m-name">${m.name} ${isLocked ? '🔒' : ''}</span>
          <span class="m-goal">${m.goal}</span>
        </div>
        <div class="mission-status">
          ${isDone ? '✅ DONE' : isNew ? '⭐ NEXT' : ''}
        </div>
      </div>
    `;
  });

  MISSION_LIST.innerHTML = html;

  MISSION_LIST.querySelectorAll('.mission-card').forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt((card as HTMLElement).dataset.index || '0');
      if (index <= completedCount) {
        hide();
        if (selectCallback) selectCallback(MISSIONS[index]);
      }
    });
  });
}
