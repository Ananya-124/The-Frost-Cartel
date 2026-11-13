/** Tracks held keys and forwards key presses. Removes every listener on dispose. */
export class InputManager {
  private down = new Set<string>();
  private readonly onPress: (event: KeyboardEvent) => void;

  constructor(onPress: (event: KeyboardEvent) => void) {
    this.onPress = onPress;
    window.addEventListener('keydown', this.handleDown);
    window.addEventListener('keyup', this.handleUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('click', this.handleClick, true);
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  clearHeldKeys(): void { this.down.clear(); }

  dispose(): void {
    window.removeEventListener('keydown', this.handleDown);
    window.removeEventListener('keyup', this.handleUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('click', this.handleClick, true);
    this.down.clear();
  }

  private handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.closest('button'))) {
      const btn = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLElement;
      btn.blur();
    }
  };

  private isFormNavigationTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true;
    if (target.tagName === 'INPUT') {
      const type = (target as HTMLInputElement).type.toLowerCase();
      return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color'].includes(type);
    }
    return false;
  }

  private handleDown = (event: KeyboardEvent): void => {
    const target = event.target;

    // Only text inputs and dropdowns capture keyboard events so players can type or select.
    if (this.isFormNavigationTarget(target)) {
      this.down.delete(event.code);
      this.onPress(event);
      return;
    }

    // If a button or other element held focus, release it so movement is never trapped.
    if (target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.closest('button'))) {
      const btn = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLElement;
      btn.blur();
    }

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
