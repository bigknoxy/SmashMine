import { GameState } from './GameState.js';
import type { InputState, UpgradeId, MissionProgress, LootType, Vec3, MetaUpgradeId } from './types.js';
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
import * as FailedScreen from '../ui/FailedScreen.js';
import * as MissionSelect from '../ui/MissionSelect.js';
import * as Shop from '../ui/Shop.js';
import * as UpgradeScreen from '../ui/UpgradeScreen.js';
import { Joystick } from '../ui/Joystick.js';
import { showIntro } from '../ui/MissionIntro.js';
import { Vector3 } from 'three';

import { MISSIONS } from '../data/missions.js';
import type { MissionDef } from './types.js';
import { telemetry } from './Telemetry.js';
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

  private terrainDirty = false;
  private smashCooldown = 0;
  private lastTargetPos: Vec3 = { x: 0, y: 0, z: 0 };
  private cachedTarget: Vec3 | null = null;

  // Phase 2: Smash Juice
  private hitStopTimer = 0;
  private floatingTexts: { x: number; y: number; z: number; text: string; age: number; maxAge: number }[] = [];
  
   // Phase 2: Combo Meter
   private lastSmashTime = 0;
   private comboCount = 0;
   
   // Phase 2: Daily Seed
   private daySeed = '';
   // Track streak across sessions
   private lastPlayedSession: number = 0;
   
   // Phase 2: Streak (Saved) - tracked in SaveSystem

  // Phase3: Meta Progression
  private blocksSmashed = 0;
  private sessionStartTime = 0;
  private missionStartTime = 0;


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

    // Set up global UI callbacks once
    this.setupUICallbacks();
  }

  private setupUICallbacks(): void {
    RewardScreen.onReplayClick(() => {
      RewardScreen.hide();
      if (this.currentMission) this.startMission(this.currentMission);
    });

    RewardScreen.onHomeClick(() => {
      RewardScreen.hide();
      this.goToHome();
    });

    FailedScreen.onRetryClick(() => {
      FailedScreen.hide();
      if (this.currentMission) this.startMission(this.currentMission);
    });

    FailedScreen.onHomeClick(() => {
      FailedScreen.hide();
      this.goToHome();
    });
  }

  private goToHome(): void {
    this.gameState = GameState.TITLE;
    this.applyStateToUI(this.gameState);
    // Clean up any active mission state if needed
    // The startMission method handles re-init of world/player
  }

  start(): void {
    // Phase 2: Daily Seed - Initialize today's date
    this.daySeed = saveSystem.getTodayDateString();
    saveSystem.updatePlayedDate();

    this.titleScreen.show();
    this.titleScreen.onStart(() => {
      this.titleScreen.hide();
      this.showMissionSelect();
    });
    
    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) {
      shopBtn.onclick = () => {
        this.titleScreen.hide();
        Shop.show(() => this.titleScreen.show());
      };
    }

    const metaUpgradeBtn = document.getElementById('meta-upgrade-btn');
    if (metaUpgradeBtn) {
      metaUpgradeBtn.onclick = () => {
        this.titleScreen.hide();
        UpgradeScreen.show(() => this.titleScreen.show());
      };
    }

    this.gameState = GameState.TITLE;
    this.applyStateToUI(this.gameState);
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private showMissionSelect(): void {
    MissionSelect.show(
      (mission) => this.startMission(mission),
      () => this.titleScreen.show()
    );
  }

  private loop(timestamp: number): void {
    // Calculate delta time with a reasonable upper bound to prevent large jumps
    let delta = (timestamp - this.lastTime) / 1000;
    
    // If this is the first frame or a large jump occurred (likely from tab switching, etc.)
    // reset the timer to prevent physics from jumping forward too far
    if (this.lastTime === 0 || delta > 0.1) {
      this.lastTime = timestamp;
      requestAnimationFrame((t) => this.loop(t));
      return;
    }
    
    this.lastTime = timestamp;

    // Phase 2: Smash Juice - Hit-stop (freeze simulation ~50ms)
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= delta;
      // Still render during hit-stop for visual feedback
      this.renderer.render();
      this.particleSystem.update(0); // Don't advance particles during hit-stop
      requestAnimationFrame((t) => this.loop(t));
      return;
    }

    if (!this.paused) {
      this.update(delta);
    }
    this.renderer.render();
    this.particleSystem.update(delta);
    this.updateFloatingTexts(delta);

    // Phase 2: Timer tension - ticking SFX last 10s
    const progress = this.missionManager.getProgress();
    if (progress.elapsed > 0 && this.currentMission) {
      const remaining = Math.max(0, this.currentMission.timeLimit - progress.elapsed);
      if (remaining <= 10 && remaining > 0 && Math.floor(remaining) !== Math.floor(remaining + delta)) {
        this.audioEngine.playTimerTick();
      }
      // Near-miss messaging on 24/25 shards
      if (!progress.surpriseTriggered && progress.shards >= 24 && this.missionManager.getTargetShards() === 25) {
        HUD.showNearMiss();
      }
    }

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
      case GameState.MISSION_FAILED:
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
    const collectedLoot = this.lootSystem.getAndClearCollected();
    this.processLootCollection(collectedLoot);
    this.updateMission(delta, collectedLoot);

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
    HUD.updateTokens(saveSystem.getTokens());

    if (this.tutorialManager.isActive()) {
      HUD.showTutorial(this.tutorialManager.message(), this.tutorialManager.progress());
    }

    this.renderer.setPlayerPos(this.player.getPosition(), delta);
    this.renderer.updatePlayerMesh(this.player.getPosition(), { x: this.inputState.moveX, y: this.inputState.moveY }, delta);
    
    // Update target highlighting
    const target = this.findSmashTarget(this.player.getPosition());
    this.renderer.setTargetBlock(target, this.smashCooldown > 0);
  }

  private findSmashTarget(pos: Vec3): Vec3 | null {
    if (!this.world) return null;

    // Use cached target if player hasn't moved much and terrain isn't dirty
    const dx = pos.x - this.lastTargetPos.x;
    const dy = pos.y - this.lastTargetPos.y;
    const dz = pos.z - this.lastTargetPos.z;
    const moved = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (moved < 0.2 && !this.terrainDirty && this.cachedTarget) {
      // Still need to verify the cached block hasn't been removed (just in case)
      const block = this.world.getBlock(this.cachedTarget.x, this.cachedTarget.y, this.cachedTarget.z);
      if (block !== 'air' && block !== 'bedrock') {
        return this.cachedTarget;
      }
    }

    const level = saveSystem.getShopLevel('permanent_range');
    const range = 3.5 + level * 0.5;
    let closestBlock: Vec3 | null = null;
    let minDist = range;

    const px = Math.floor(pos.x);
    const py = Math.floor(pos.y - 0.9);
    const pz = Math.floor(pos.z);

    const scanRadius = Math.ceil(range);

    for (let x = -scanRadius; x <= scanRadius; x++) {
      for (let y = -3; y <= 3; y++) {
        for (let z = -scanRadius; z <= scanRadius; z++) {
          const bx = px + x;
          const by = py + y;
          const bz = pz + z;
          
          if (!this.world.isInside(bx, by, bz)) continue;

          const block = this.world.getBlock(bx, by, bz);
          if (block !== 'air' && block !== 'bedrock') {
            const bdx = (bx + 0.5) - pos.x;
            const bdy = (by + 0.5) - (pos.y - 0.9);
            const bdz = (bz + 0.5) - pos.z;
            const dist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
            if (dist < minDist) {
              minDist = dist;
              closestBlock = { x: bx, y: by, z: bz };
            }
          }
        }
      }
    }

    this.lastTargetPos = { ...pos };
    this.cachedTarget = closestBlock;
    return closestBlock;
  }

  private processLootCollection(collected: { type: LootType; amount: number }[]): void {
    if (collected.length === 0) return;

    // Phase 2: Combo meter - loot multiplier (1 + comboCount * 0.1, cap x3.0)
    const comboMult = Math.min(1 + this.comboCount * 0.1, 3);
    
    this.audioEngine.playPickup();
    this.particleSystem.emitBurst(this.player.getPosition(), '#44ff88');
    this.tutorialManager.onAction('collect');

    for (const item of collected) {
      const amount = Math.round(item.amount * comboMult);
      if (item.type === 'power_shards') saveSystem.addShards(amount);
      if (item.type === 'coins') saveSystem.addCoins(amount);
    }
  }

  private updateMission(delta: number, collected: { type: LootType; amount: number }[]): void {
    const result = this.missionManager.update(delta, collected);

    if (result.completed) {
      this.missionComplete();
    }
    if (result.surprise) {
      this.audioEngine.playCelebration();
      this.terrainDirty = true;
    }
    if (result.failed) {
      this.missionFailed();
    }
  }

  private handleSmash(): void {
    const pos = this.player.getPosition();
    const target = this.findSmashTarget(pos);
    if (!target) return;

    this.tutorialManager.onAction('smash');

    // Phase 2: Smash Juice - Hit-stop (freeze simulation ~50ms)
    this.hitStopTimer = 0.05;

    // Phase 2: Combo meter update
    const now = performance.now();
    const comboWindow = 1500; // 1.5s window
    if (now - this.lastSmashTime <= comboWindow) {
      this.comboCount = Math.min(this.comboCount + 1, 20); // Cap combo count
    } else {
      this.comboCount = 0;
    }
    this.lastSmashTime = now;
    HUD.updateCombo(this.comboCount, comboWindow);

    const broken = this.smashSystem.smash(this.world, target, this.player);
    if (broken && broken.length > 0) {
      this.audioEngine.playSmash();
      this.renderer.addShake(0.15);
      this.particleSystem.emitBurst(target, '#ff4400');

      // Phase 2: Smash Juice - Floating text +1 (use combo count for display)
      const displayText = this.comboCount > 0 ? `+${this.comboCount + 1}` : '+1';
      this.floatingTexts.push({
        x: target.x + 0.5,
        y: target.y + 1.0,
        z: target.z + 0.5,
        text: displayText,
        age: 0,
        maxAge: 0.5
      });

      for (const block of broken) {
        this.lootSystem.spawnBlockLoot(block.type, block.pos);
        this.world.removeBlock(block.pos);
      }
      this.terrainDirty = true;
      telemetry.lootCollected += broken.length;
      
      // Phase3: Track blocks smashed and update best combo
      this.blocksSmashed += broken.length;
      if (this.comboCount > 0) {
        const stats = saveSystem.getStatistics();
        if (this.comboCount > stats.bestCombo) {
          saveSystem.updateStatistics({ bestCombo: this.comboCount });
        }
      }
    }
  }

  /**
   * Hide gameplay UI elements (HUD, joystick, smash button).
   * Called when transitioning to any overlay screen.
   */
  // Fix 3: state-gate HUD and overlays to prevent overlap
  private applyStateToUI(state: GameState): void {
    // Hide all overlays first
    this.titleScreen.hide();
    MissionSelect.hide();
    RewardScreen.hide();
    FailedScreen.hide();
    Shop.hide();
    document.getElementById('mission-intro')?.classList.add('hidden');
    document.getElementById('rotate-prompt')?.classList.add('hidden');

    // Toggle gameplay UI (HUD, controls)
    const isPlaying = state === GameState.PLAYING || state === GameState.MISSION_INTRO;
    if (isPlaying) {
      HUD.show();
      document.getElementById('smash-btn')?.classList.remove('hidden');
      document.getElementById('joystick-zone')?.classList.remove('hidden');
    } else {
      HUD.hide();
      document.getElementById('smash-btn')?.classList.add('hidden');
      document.getElementById('joystick-zone')?.classList.add('hidden');
    }

    // Show state-specific overlays
    switch (state) {
      case GameState.TITLE:
        this.titleScreen.show();
        this.checkOrientation(); // Show rotate prompt if in portrait
        break;
      case GameState.MISSION_INTRO:
        // Intro is shown via showIntro() separately
        break;
      case GameState.MISSION_COMPLETE:
        RewardScreen.show(this.missionManager.getProgress(), (upg) => this.pickUpgrade(upg));
        break;
      case GameState.MISSION_FAILED:
        FailedScreen.show(this.missionManager.getProgress());
        break;
      case GameState.UPGRADE_PICK:
        // Handled after reward screen timeout
        break;
    }
  }

  private checkOrientation(): void {
    if (window.innerHeight > window.innerWidth) {
      document.getElementById('rotate-prompt')?.classList.remove('hidden');
      this.pause();
    } else {
      document.getElementById('rotate-prompt')?.classList.add('hidden');
      this.resume();
    }
  }

  private hideGameplayUI(): void {
    HUD.hide();
    document.getElementById('smash-btn')?.classList.add('hidden');
    document.getElementById('joystick-zone')?.classList.add('hidden');
  }

  private currentMission: MissionDef | null = null;

  startMission(mission: MissionDef): void {
    telemetry.missionStarted++;
    // Phase 2: Streak - Track when replaying within 10s
    const streakContinued = saveSystem.updateStreakOnReplay();
    if (streakContinued) {
      console.log(`🔥 Streak: ${saveSystem.getStreak()} consecutive runs!`);
    }
    
    // Phase 2: Streak - Display streak counter
    this.updateStreakDisplay();
    
    this.currentMission = mission;
    // Phase 3: Apply mine depth to world generation
    const mineDepth = saveSystem.getMineDepth();
    // Phase 2: Daily seed - pass daily seed for consistent daily worlds
    this.world = this.renderer.initWorld(mission.id, this.daySeed, mineDepth);
    this.player = new Player(this.world);
    this.lootSystem = new LootSystem(this.world);
    this.terrainDirty = false;

    // Phase 3: Reset session stats and start timing
    this.blocksSmashed = 0;
    this.missionStartTime = performance.now();

    // Initialize camera position based on player spawn
    this.renderer.initializeCameraPos(this.player.getPosition());

    this.renderer.createPlayerMesh();

    this.missionManager.startMission(mission);

    this.titleScreen.hide();
    MissionSelect.hide();
    HUD.show();

    document.getElementById('smash-btn')?.classList.remove('hidden');
    document.getElementById('joystick-zone')?.classList.remove('hidden');

    this.gameState = GameState.MISSION_INTRO;
    this.applyStateToUI(this.gameState);
    showIntro(mission).then(() => {
      this.gameState = GameState.PLAYING;
      this.applyStateToUI(this.gameState);
    });
  }

  // Phase 2: Streak - Update streak display
  private updateStreakDisplay(): void {
    const el = document.getElementById('streak-display');
    if (!el) return;
    
    const streak = saveSystem.getStreak();
    if (streak > 0) {
      el.textContent = `🔥 ${streak}`;
      el.classList.add('streak-active');
    } else {
      el.textContent = '';
      el.classList.remove('streak-active');
    }
  }

  private missionComplete(): void {
    telemetry.missionCompleted++;
    this.audioEngine.playMissionComplete();
    this.gameState = GameState.MISSION_COMPLETE;
    this.applyStateToUI(this.gameState);

    saveSystem.incrementMissions();
    
    // Phase3: Calculate token reward
    const progress = this.missionManager.getProgress();
    const baseTokens = Math.floor(progress.shards * 2); // 2 tokens per shard
    const timeBonus = Math.max(0, Math.floor((this.currentMission!.timeLimit - progress.elapsed) * 10)); // 10 tokens per second remaining
    const totalTokens = baseTokens + timeBonus;
    
    saveSystem.addTokens(totalTokens);
    
    // Phase3: Update statistics
    const playTime = this.missionStartTime > 0 ? (performance.now() - this.missionStartTime) / 1000 : 0;
    saveSystem.updateStatistics({
      totalBlocksSmashed: this.blocksSmashed,
      totalPlayTime: playTime,
    });
    
    // Phase3: Increase mine depth on successful completion
    const newDepth = saveSystem.getMineDepth() + 1;
    saveSystem.setMineDepth(newDepth);
    
    if (saveSystem.needsSave()) saveSystem.save();

    // Phase 2: Daily Seed - Record personal best
    saveSystem.recordBest(progress.shards, progress.elapsed);

    RewardScreen.show(progress, (upgradeId: UpgradeId) => {
      this.pickUpgrade(upgradeId);
    });

    setTimeout(() => {
      this.gameState = GameState.UPGRADE_PICK;
      this.applyStateToUI(this.gameState);
    }, 1500);
  }

  private missionFailed(): void {
    telemetry.missionFailed = (telemetry.missionFailed || 0) + 1;
    this.audioEngine.playMissionFailed();
    this.gameState = GameState.MISSION_FAILED;
    this.applyStateToUI(this.gameState);

    const progress = this.missionManager.getProgress();
    FailedScreen.show(progress);
  }

  private pickUpgrade(upgradeId: UpgradeId): void {
    this.upgradeSystem.applyUpgrade(upgradeId, this.player);
    this.audioEngine.playUpgrade();
    telemetry.upgradesPicked++;
    RewardScreen.hide();
    this.showMissionSelect();
  }

  onCanvasClick(e: PointerEvent): void {
    if (this.gameState !== GameState.PLAYING) return;
    if (this.smashCooldown > 0) return;
    
    this.inputState.smash = true;
  }

  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
    this.checkOrientation(); // Check orientation on all resize events
  }

  /** Called when the device orientation changes (e.g., user rotates phone) */
  onOrientationChange(): void {
    this.checkOrientation();
  }

  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; this.lastTime = performance.now(); }

  // Phase 2: Smash Juice - Floating text animation
  private updateFloatingTexts(delta: number): void {
    if (this.floatingTexts.length === 0) {
      // Remove any leftover DOM elements
      const container = document.getElementById('floating-texts');
      if (container) container.innerHTML = '';
      return;
    }
    
    let aliveCount = 0;
    let container = document.getElementById('floating-texts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'floating-texts';
      container.className = 'floating-texts-container';
      document.body.appendChild(container);
    }
    
    // Get camera for 3D to 2D projection
    const camera = this.renderer.camera;
    
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.age += delta;
      
      if (ft.age < ft.maxAge) {
        // Drift up 500ms
        ft.y += delta * 2; // Float upward
        
        // Project 3D position to 2D screen coordinates
        const vec = new Vector3(ft.x, ft.y, ft.z);
        vec.project(camera);
        
        const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
        
        // Create or update DOM element
        let el = document.getElementById(`floating-${i}`);
        if (!el) {
          el = document.createElement('div');
          el.id = `floating-${i}`;
          el.className = 'floating-text';
          container.appendChild(el);
        }
        
        const alpha = 1 - (ft.age / ft.maxAge);
        el.textContent = ft.text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.opacity = alpha.toString();
        el.style.transform = `scale(${1 + ft.age / ft.maxAge})`;
        
        this.floatingTexts[aliveCount++] = ft;
      } else {
        // Remove DOM element
        const el = document.getElementById(`floating-${i}`);
        if (el) el.remove();
      }
    }
    this.floatingTexts.length = aliveCount;
  }
}