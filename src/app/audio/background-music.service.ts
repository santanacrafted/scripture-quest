import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class BackgroundMusicService implements OnDestroy {
  private readonly mutedKey = 'scriptureQuest.musicMuted';
  private readonly volumeKey = 'scriptureQuest.musicVolume';
  private readonly audio = new Audio('/audio/the-journey-begins.mp3');
  private started = false;
  private userPaused = false;
  private muted = false;
  private volume = 0.5;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioGraphReady = false;
  private unlockBound = false;
  private appStateListener: PluginListenerHandle | null = null;
  private pauseListener: PluginListenerHandle | null = null;
  private resumeListener: PluginListenerHandle | null = null;

  constructor(private readonly zone: NgZone) {
    this.loadSettings();
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.applySettings();
    this.audio.load();
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await this.bindAppLifecycle();
    this.bindDocumentVisibility();
    this.tryPlay();
    this.bindUnlockOnFirstGesture();
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    if (!this.userPaused && !this.muted) {
      this.tryPlay();
    }
  }

  getVolume(): number {
    return Math.round(this.volume * 100);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume)) / 100;
    localStorage.setItem(this.volumeKey, String(this.volume));
    this.applySettings();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem(this.mutedKey, String(muted));
    this.applySettings();

    if (muted) {
      this.audio.pause();
    } else if (this.started) {
      this.resume();
    }
  }

  async ngOnDestroy(): Promise<void> {
    this.audio.pause();
    await this.audioContext?.close();
    await this.appStateListener?.remove();
    await this.pauseListener?.remove();
    await this.resumeListener?.remove();
  }

  private tryPlay(): void {
    if (this.muted) {
      return;
    }

    this.ensureAudioGraph();
    void this.audioContext?.resume();
    void this.audio.play().catch(() => {
      this.bindUnlockOnFirstGesture();
    });
  }

  private loadSettings(): void {
    const savedVolume = Number(localStorage.getItem(this.volumeKey));
    const savedMuted = localStorage.getItem(this.mutedKey);

    if (!Number.isNaN(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
      this.volume = savedVolume;
    }

    this.muted = savedMuted === 'true';
  }

  private applySettings(): void {
    this.audio.volume = this.volume;
    this.audio.muted = false;
    this.updateGain();
  }

  private ensureAudioGraph(): void {
    if (this.audioGraphReady) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    this.audioContext = new AudioContextConstructor();
    const source = this.audioContext.createMediaElementSource(this.audio);
    this.gainNode = this.audioContext.createGain();
    source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.audioGraphReady = true;
    this.updateGain();
  }

  private updateGain(): void {
    if (!this.gainNode) {
      return;
    }

    this.gainNode.gain.value = this.muted ? 0 : this.volume;
  }

  private async bindAppLifecycle(): Promise<void> {
    this.appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.resume();
      } else {
        this.pause();
      }
    });

    this.pauseListener = await App.addListener('pause', () => {
      this.pause();
    });

    this.resumeListener = await App.addListener('resume', () => {
      this.resume();
    });
  }

  private bindDocumentVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private bindUnlockOnFirstGesture(): void {
    if (this.unlockBound) {
      return;
    }

    this.unlockBound = true;
    this.zone.runOutsideAngular(() => {
      const unlock = (): void => {
        void this.audioContext?.resume();
        this.tryPlay();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
        this.unlockBound = false;
      };

      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    });
  }
}
