import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.removeAttribute('open');
  };
}
