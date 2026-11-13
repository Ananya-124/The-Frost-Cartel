import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from './InputManager';

describe('Round 3 split-screen keyboard input', () => {
  let input: InputManager | undefined;
  afterEach(() => { input?.dispose(); input = undefined; });

  it('tracks both investigators independently while the game canvas has focus', () => {
    input = new InputManager(vi.fn());
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));

    expect(input.isDown('KeyD')).toBe(true);
    expect(input.isDown('ArrowUp')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
    expect(input.isDown('KeyD')).toBe(false);
    expect(input.isDown('ArrowUp')).toBe(true);
  });

  it('does not treat form navigation keys as world movement', () => {
    input = new InputManager(vi.fn());
    const select = document.createElement('select');
    document.body.append(select);
    select.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
    expect(input.isDown('ArrowRight')).toBe(false);
    select.remove();
  });

  it('allows world movement keys when a button is clicked or focused and blurs the button', () => {
    input = new InputManager(vi.fn());
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    button.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
    expect(input.isDown('KeyW')).toBe(true);
    expect(document.activeElement).not.toBe(button);
    button.remove();
  });
});
