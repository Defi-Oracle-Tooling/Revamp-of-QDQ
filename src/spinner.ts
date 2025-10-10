import cliSpinners, { Spinner as CLISpinner, SpinnerName } from "cli-spinners";
import logUpdate from "log-update";

export class Spinner {
  public text: string;
  private _spinner: CLISpinner;
  private _intervalHandle: NodeJS.Timeout | null;
  private _isSettled: boolean;

  constructor(text: string, spinnerName: SpinnerName = "dots3") {
    this.text = text;
    this._isSettled = false;
    if (!cliSpinners[spinnerName]) {
      const spinnerNames = Object.keys(cliSpinners).join(", ");
      throw new Error(`Invalid spinner name ${spinnerName} specified. Expected one of the following: ${spinnerNames}`);
    }
    this._spinner = cliSpinners[spinnerName];
    this._intervalHandle = null;
    // Ensure spinner is always cleaned up on process exit
    process.on('exit', () => this.forceStop());
    process.on('SIGINT', () => this.forceStop());
    process.on('SIGTERM', () => this.forceStop());
    process.on('uncaughtException', () => this.forceStop());
  }

  public get isRunning(): boolean {
    return this._intervalHandle !== null && !this._isSettled;
  }

  public get isSettled(): boolean {
    return this._isSettled;
  }

  public start(): Spinner {
    if (this._intervalHandle !== null) {
      return this;
    }
    let i = 0;
    this._intervalHandle = setInterval(() => {
      const spinnerFrame = this._spinner.frames[i = ++i % this._spinner.frames.length];
      const line = `${spinnerFrame} ${this.text}`;
      logUpdate(line);
    }, this._spinner.interval);
    return this;
  }

  public stop(finalText?: string): Promise<void> {
    if (this._intervalHandle === null || this._isSettled) {
      return Promise.resolve();
    }
    const handle = this._intervalHandle;
    this._intervalHandle = null;
    this._isSettled = true;
    clearInterval(handle!);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          logUpdate.clear();
          if (finalText) {
            logUpdate(finalText);
          }
          logUpdate.done();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, this._spinner.interval);
    });
  }

  public forceStop(): void {
    if (this._intervalHandle !== null) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
    this._isSettled = true;
    try {
      logUpdate.clear();
      logUpdate.done();
    } catch {
      // Ignore errors during forced cleanup
    }
  }

  public succeed(finalText: string): Promise<void> {
    return this.stop(`✅ ${finalText}`);
  }

  public fail(finalText: string): Promise<void> {
    return this.stop(`❌ ${finalText}`);
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