/** Tracks held keys and forwards key presses. Removes every listener on dispose. */
export class InputManager {
  private down = new Set<string>();
  private readonly onPress: (event: KeyboardEvent) => void;

  constructor(onPress: (event: KeyboardEvent) => void) {
    this.onPress = onPress;
    window.addEventListener('keydown', this.handleDown);
    window.addEventListener('keyup', this.handleUp);
    window.addEventListener('blur', this.handleBlur);
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  clearHeldKeys(): void { this.down.clear(); }

  dispose(): void {
    window.removeEventListener('keydown', this.handleDown);
    window.removeEventListener('keyup', this.handleUp);
    window.removeEventListener('blur', this.handleBlur);
    this.down.clear();
  }

  private handleDown = (event: KeyboardEvent): void => {
    this.down.add(event.code);
    this.onPress(event);
  };

  private handleUp = (event: KeyboardEvent): void => {
    this.down.delete(event.code);
  };

  private handleBlur = (): void => {
    this.down.clear();
  };
}
