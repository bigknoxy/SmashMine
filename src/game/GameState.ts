export enum GameState {
  TITLE,
  MISSION_INTRO,
  PLAYING,
  MISSION_COMPLETE,
  UPGRADE_PICK
}

export function transitionTo(newState: GameState): void {
  // This is a placeholder for future state transition logic
  console.log(`Transitioning to ${GameState[newState]}`);
}
