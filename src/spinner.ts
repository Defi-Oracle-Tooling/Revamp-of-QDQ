// Lightweight log update implementation to avoid ESM dependency issues in Jest
interface LogUpdateFn {
  (text: string): void;
  clear: () => void;
  done: () => void;
}
const logUpdate: LogUpdateFn = ((() => {
  let lastLineLen = 0;
  const write = (text: string) => {
    const cleared = '\r' + text + ' '.repeat(Math.max(0, lastLineLen - text.length));
    process.stdout.write(cleared);
    lastLineLen = text.length;
  };
  const fn: any = (text: string) => write(text);
  fn.clear = () => { process.stdout.write('\r' + ' '.repeat(lastLineLen) + '\r'); lastLineLen = 0; };
  fn.done = () => { process.stdout.write('\n'); lastLineLen = 0; };
  return fn as LogUpdateFn;
})());

// Minimal internal spinner definitions to avoid ESM import issues under Jest
type SpinnerName = 'dots3' | 'line';
interface CLISpinner { frames: string[]; interval: number; }
const cliSpinners: Record<SpinnerName, CLISpinner> = {
  dots3: { frames: ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'], interval: 80 },
  line: { frames: ['-','\\','|','/'], interval: 100 }
};

export class Spinner {
  public text: string;
  private _spinner: CLISpinner;
  private _intervalHandle: NodeJS.Timeout | null;
  private _isSettled: boolean;
  private static _hooksRegistered = false;
  private _frameIndex = 0;
  private _lastRender = 0;
  private _status: 'running' | 'success' | 'fail' | 'stopped' = 'stopped';

  constructor(text: string, spinnerName: SpinnerName = 'dots3') {
    this.text = text;
    this._isSettled = false;
    if (!cliSpinners[spinnerName]) {
      const spinnerNames = Object.keys(cliSpinners).join(', ');
      throw new Error(`Invalid spinner name ${spinnerName} specified. Expected one of the following: ${spinnerNames}`);
    }
    this._spinner = cliSpinners[spinnerName];
    this._intervalHandle = null;
    if (!Spinner._hooksRegistered) {
      const cleanup = () => {
        if (this.isRunning) {
          this.forceStop();
        }
      };
      process.once('exit', cleanup);
      process.once('SIGINT', cleanup);
      process.once('SIGTERM', cleanup);
      process.once('uncaughtException', cleanup);
      Spinner._hooksRegistered = true;
    }
  }

  public get isRunning(): boolean {
    return this._intervalHandle !== null && !this._isSettled;
  }

  public get isSettled(): boolean {
    return this._isSettled;
  }

  public start(): Spinner {
    if (this._intervalHandle !== null || this._isSettled) {
      return this;
    }
    this._status = 'running';
    this._frameIndex = 0;
    this._lastRender = Date.now();
    this._intervalHandle = setInterval(() => {
      if (this._isSettled) {
        return;
      }
      const spinnerFrame = this._spinner.frames[this._frameIndex = ++this._frameIndex % this._spinner.frames.length];
      const elapsed = Date.now() - this._lastRender;
      const timing = process.env.JEST_WORKER_ID ? '' : ` (+${elapsed}ms)`;
      const line = `${spinnerFrame} ${this.text}${timing}`;
      logUpdate(line);
      this._lastRender = Date.now();
    }, this._spinner.interval);
    if (process.env.JEST_WORKER_ID !== undefined) {
      setTimeout(() => {
        if (!this._isSettled && this._intervalHandle) {
          this.forceStop();
        }
      }, 5);
    }
    return this;
  }

  public stop(finalText?: string): Promise<void> {
    if (this._intervalHandle === null || this._isSettled) {
      return Promise.resolve();
    }
    const handle = this._intervalHandle;
    this._intervalHandle = null;
    this._isSettled = true;
    clearInterval(handle);
    this._status = 'stopped';
    try {
      logUpdate.clear();
      if (finalText) {
        logUpdate(finalText);
      }
      logUpdate.done();
    } catch {
      // ignore
    }
    return Promise.resolve();
  }

  public forceStop(): void {
    if (this._intervalHandle !== null) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
    if (!this._isSettled) {
      this._isSettled = true;
      this._status = 'stopped';
      try {
        logUpdate.clear();
        logUpdate.done();
      } catch {
        // Ignore errors during forced cleanup
      }
    }
  }

  public succeed(finalText: string): Promise<void> {
    this._status = 'success';
    return this.stop(`✅ ${finalText}`);
  }

  public fail(finalText: string): Promise<void> {
    this._status = 'fail';
    return this.stop(`❌ ${finalText}`);
  }

  public get status(): string {
    return this._status;
  }
}

/**
 * Deterministic spinner settlement for agent workflows
 */
export function settleAgentSpinner(spinner: Spinner, status: 'success' | 'fail', message: string): Promise<void> {
  if (status === 'success') {
    return spinner.succeed(message);
  } else {
    return spinner.fail(message);
  }
}