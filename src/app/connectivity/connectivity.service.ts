import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConnectionOverlayState {
  visible: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly stateSubject = new BehaviorSubject<ConnectionOverlayState>({
    visible: typeof navigator !== 'undefined' && !navigator.onLine,
    message: 'Reconnecting…',
  });
  readonly state$ = this.stateSubject.asObservable();

  private slowRequests = 0;
  private connectionProblem = false;
  private probeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    window.addEventListener('offline', () => this.showConnectionProblem());
    window.addEventListener('online', () => this.checkRecovered());
  }

  // Firebase callable functions commonly take a few seconds on mobile even
  // with a healthy connection. Only interrupt play when the delay is abnormal.
  beginRequest(delayMs = 8000): () => void {
    let slow = false;
    let finished = false;
    const timer = window.setTimeout(() => {
      if (finished) return;
      slow = true;
      this.slowRequests += 1;
      this.publish();
    }, delayMs);

    return () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (slow) this.slowRequests = Math.max(0, this.slowRequests - 1);
      this.publish();
    };
  }

  reportRequestError(error: unknown): void {
    const value = error as { code?: string; message?: string };
    const text = `${value?.code || ''} ${value?.message || ''}`.toLowerCase();
    if (!navigator.onLine || /unavailable|network|deadline|timeout|offline/.test(text)) {
      this.showConnectionProblem();
    }
  }

  private showConnectionProblem(): void {
    this.connectionProblem = true;
    this.publish();
    this.scheduleProbe();
  }

  private scheduleProbe(): void {
    clearTimeout(this.probeTimer);
    this.probeTimer = setTimeout(() => this.checkRecovered(), 2500);
  }

  private async checkRecovered(): Promise<void> {
    if (!navigator.onLine) {
      this.scheduleProbe();
      return;
    }
    try {
      await fetch(`/?connection-check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      this.connectionProblem = false;
      this.publish();
    } catch {
      this.scheduleProbe();
    }
  }

  private publish(): void {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    this.stateSubject.next({
      visible: offline || this.connectionProblem || this.slowRequests > 0,
      message: offline || this.connectionProblem ? 'Reconnecting…' : 'Connecting…',
    });
  }
}
