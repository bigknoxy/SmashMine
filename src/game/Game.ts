import { GameState } from './GameState.js';
import type { InputState, UpgradeId, MissionProgress, LootType } from './types.js';
import { World } from '../world/World.js';
import { Player } from './Player.js';
import { MissionManager } from './MissionManager.js';
import { LootSystem } from './LootSystem.js';
import { SmashSystem } from './SmashSystem.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { Renderer } from '../rendering/Renderer.js';
import { ParticleSystem } from '../rendering/ParticleSystem.js';
import { TitleScreen } from '../ui/TitleScreen.js';
import * as HUD from '../ui/HUD.js';
import * as RewardScreen from '../ui/RewardScreen.js';
import { Joystick } from '../ui/Joystick.js';
import { showIntro } from '../ui/MissionIntro.js';

import { MISSIONS } from '../data/missions.js';
import { Telemetry, telemetry } from './Telemetry.js';
import { saveSystem } from './SaveSystem.js';
import { TutorialManager } from './TutorialManager.js';

export class Game {
  private renderer: Renderer;
  private gameState: GameState = GameState.TITLE;
  private paused = false;
  private lastTime = 0;

  private inputState: InputState = { moveX: 0, moveY: 0, smash: false, special: false, jump: false };
  private world: World = new World();
  private player: Player;
  private missionManager: MissionManager;
  private lootSystem: LootSystem;
  private smashSystem: SmashSystem;
  private upgradeSystem: UpgradeSystem;
  private particleSystem: ParticleSystem;
  private audioEngine: AudioEngine;
  private joystick: Joystick;
  private titleScreen: TitleScreen;
  private tutorialManager: TutorialManager;

  private collectedLoot: { type: LootType; amount: number }[] = [];
  private terrainDirty = false;
  private smashCooldown = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.player = new Player(this.world);
    this.missionManager = new MissionManager();
    this.lootSystem = new LootSystem(this.world);
    this.smashSystem = new SmashSystem();
    this.upgradeSystem = new UpgradeSystem();
    this.audioEngine = new AudioEngine();
    this.titleScreen = new TitleScreen();
    this.particleSystem = new ParticleSystem(this.renderer.scene);
    this.joystick = new Joystick(this.inputState);
    this.tutorialManager = new TutorialManager();
  }

  start(): void {
    this.titleScreen.show();
    this.titleScreen.onStart(() => this.startMission());
    this.gameState = GameState.TITLE;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (!this.paused) {
      this.update(delta);
    }
    this.renderer.render();
    this.particleSystem.update(delta);

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(delta: number): void {
    switch (this.gameState) {
      case GameState.TITLE:
        break;
      case GameState.MISSION_INTRO:
        break;
      case GameState.PLAYING:
        this.handlePlaying(delta);
        break;
      case GameState.MISSION_COMPLETE:
        break;
      case GameState.UPGRADE_PICK:
        break;
    }
  }

  private handlePlaying(delta: number): void {
    this.joystick.updateInput();
    this.smashCooldown = Math.max(0, this.smashCooldown - delta);

    const wasMoving = this.inputState.moveX !== 0 || this.inputState.moveY !== 0;
    this.player.update(delta, this.inputState, this.world);
    const isMoving = this.inputState.moveX !== 0 || this.inputState.moveY !== 0;
    if (wasMoving || isMoving) {
      this.tutorialManager.onAction('move');
    }

    if (this.inputState.smash && this.smashCooldown <= 0) {
      this.inputState.smash = false;
      this.smashCooldown = 0.2;
      this.handleSmash();
    }
    if (this.inputState.jump) {
      this.inputState.jump = false;
    }

    this.lootSystem.update(this.player.getPosition(), delta);
    const collected = this.lootSystem.getAndClearCollected();
    if (collected.length > 0) {
      this.audioEngine.playPickup();
      this.particleSystem.emitBurst(this.player.getPosition(), '#44ff88');
      this.tutorialManager.onAction('collect');
    }
    for (const item of collected) {
      this.collectedLoot.push(item);
      if (item.type === 'power_shards') saveSystem.addShards(item.amount);
      if (item.type === 'coins') saveSystem.addCoins(item.amount);
    }

    const result = this.missionManager.update(delta, collected);

    if (result.completed) {
      this.missionComplete();
    }
    if (result.surprise) {
      this.audioEngine.playCelebration();
      this.terrainDirty = true;
    }

    if (this.terrainDirty) {
      this.renderer.rebuildTerrain();
      this.terrainDirty = false;
    }

    const progress = this.missionManager.getProgress();
    HUD.updateShards(progress.shards, this.missionManager.getTargetShards());
    HUD.updateCoins(progress.coins);
    HUD.updateTimer(progress.elapsed, this.missionManager.getTimeLimit());
    HUD.updateLifetime(
      saveSystem.getTotalShards(),
      saveSystem.getTotalCoins(),
      saveSystem.getMissionsCompleted()
    );

    if (this.tutorialManager.isActive()) {
      HUD.showTutorial(this.tutorialManager.message(), this.tutorialManager.progress());
    }

    this.renderer.setPlayerPos(this.player.getPosition(), delta);
    this.renderer.updatePlayerMesh(this.player.getPosition());
  }

  private handleSmash(): void {
    const pos = this.player.getPosition();
    const target = this.findSmashTarget(pos);
    if (!target) return;

    this.tutorialManager.onAction('smash');

    const broken = this.smashSystem.smash(this.world, target, this.player);
    if (broken && broken.length > 0) {
      this.audioEngine.playSmash();
      this.renderer.addShake(0.15);
      this.particleSystem.emitBurst(target, '#ff4400');

      for (const block of broken) {
        this.lootSystem.spawnBlockLoot(block.type, block.pos);
        this.world.removeBlock(block.pos);
      }
      this.terrainDirty = true;
      telemetry.lootCollected += broken.length;
    }
  }

  private findSmashTarget(pos: { x: number; y: number; z: number }): { x: number; y: number; z: number } | null {
    const px = Math.round(pos.x);
    const py = Math.round(pos.y);
    const pz = Math.round(pos.z);
    const range = 2;

    for (let y = py + 1; y >= py - range; y--) {
      for (let x = px - range; x <= px + range; x++) {
        for (let z = pz - range; z <= pz + range; z++) {
          if (!this.world.isInside(x, y, z)) continue;
          const block = this.world.getBlock(x, y, z);
          if (block !== 'air' && block !== 'bedrock') {
            return { x, y, z };
          }
        }
      }
    }
    return null;
  }

  startMission(): void {
    telemetry.missionStarted++;
    const mission = MISSIONS[0];
    this.world = this.renderer.initWorld(mission.id);
    this.player = new Player(this.world);
    this.lootSystem = new LootSystem(this.world);
    this.collectedLoot = [];
    this.terrainDirty = false;

    this.renderer.createPlayerMesh();

    this.missionManager.startMission(mission);

    this.titleScreen.hide();
    HUD.show();

    document.getElementById('smash-btn')?.classList.remove('hidden');
    document.getElementById('joystick-zone')?.classList.remove('hidden');

    this.gameState = GameState.MISSION_INTRO;
    showIntro(mission).then(() => {
      this.gameState = GameState.PLAYING;
    });
  }

  private missionComplete(): void {
    telemetry.missionCompleted++;
    this.audioEngine.playMissionComplete();
    this.gameState = GameState.MISSION_COMPLETE;
    HUD.hide();

    saveSystem.incrementMissions();
    if (saveSystem.needsSave()) saveSystem.save();

    document.getElementById('smash-btn')?.classList.add('hidden');
    document.getElementById('joystick-zone')?.classList.add('hidden');

    const progress = this.missionManager.getProgress();
    RewardScreen.show(progress, (upgradeId: UpgradeId) => {
      this.pickUpgrade(upgradeId);
    });

    setTimeout(() => {
      this.gameState = GameState.UPGRADE_PICK;
    }, 1500);
  }

  private pickUpgrade(upgradeId: UpgradeId): void {
    this.upgradeSystem.applyUpgrade(upgradeId, this.player);
    this.audioEngine.playUpgrade();
    telemetry.upgradesPicked++;
    RewardScreen.hide();
    this.startMission();
  }

  onCanvasClick(e: PointerEvent): void {
    if (this.gameState !== GameState.PLAYING) return;
    if (this.smashCooldown > 0) return;
    
    this.inputState.smash = true;
  }

  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; this.lastTime = performance.now(); }
}
