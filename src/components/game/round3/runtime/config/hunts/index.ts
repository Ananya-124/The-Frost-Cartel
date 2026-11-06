import type { Hunt, HuntIndex } from '../../types';
import { HUNT_1 } from './hunt1';
import { HUNT_2 } from './hunt2';
import { HUNT_3 } from './hunt3';

export const HUNTS: readonly [Hunt, Hunt, Hunt] = [HUNT_1, HUNT_2, HUNT_3];

export const getHunt = (index: HuntIndex): Hunt => HUNTS[index];
