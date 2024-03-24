export type ICallback = (...arg: any[]) => void;

export class Debounce {
  private static frame: number;

  public static debounce(callback: ICallback): ICallback {
    return (...params: any[]) => {
      // If the frame variable has been defined, clear it now, and queue for next frame
      if (this.frame) {
        cancelAnimationFrame(this.frame);
      }

      // Queue our function call for the next frame
      this.frame = requestAnimationFrame(() => {
        // Call our function and pass any params we received
        callback(...params);
      });
    };
  }
}
