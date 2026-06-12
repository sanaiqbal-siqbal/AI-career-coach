declare global {
  interface PromiseConstructor {
    try?<T>(fn: (...args: unknown[]) => T | PromiseLike<T>, ...args: unknown[]): Promise<T>;
  }

  interface Uint8Array {
    toHex?(): string;
  }
}

if (typeof Promise.try !== "function") {
  Promise.try = function <T>(
    fn: (...args: unknown[]) => T | PromiseLike<T>,
    ...args: unknown[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (error) {
        reject(error);
      }
    });
  };
}

if (typeof Uint8Array.prototype.toHex !== "function") {
  Uint8Array.prototype.toHex = function toHex(): string {
    let hex = "";
    for (let i = 0; i < this.length; i += 1) {
      hex += this[i].toString(16).padStart(2, "0");
    }
    return hex;
  };
}

export {};
