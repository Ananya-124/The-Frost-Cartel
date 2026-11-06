import { playTone } from '../../audio/sound';
import { ENTITY, ROOM_SIZE } from '../../config/constants';
import { CONTACT_COOLDOWN, SCORE } from '../../config/scoring';
import { ROOMS, ROOM_BY_ID } from '../../config/rooms';
import type { Entity, GameState, HuntIndex } from '../../types';
import { dist, randomInt } from '../../utils/math';
import { addScore } from '../scoring/scoring';
import { spawnPosition } from '../state/createInitialState';
import { showMessage } from '../state/messages';

/** Creates the three manifestations; one is real. */
export function spawnEntities(hunt: HuntIndex): Entity[] {
  const list: Entity[] = Array.from({ length: ENTITY.count }, (_, k) => {
    const room = ROOMS[randomInt(ROOMS.length)];
    return {
      x: room.x + room.w / 2,
      y: room.y + room.h / 2,
      targetX: 0,
      targetY: 0,
      real: false,
      leavesTrail: false,
      trail: [],
      trailTimer: 0,
      teleportTimer: ENTITY.teleportTimerBase + k * ENTITY.teleportTimerStep,
      penalized: false,
      marked: false,
      gone: false,
    };
  });
  const real = list[randomInt(list.length)];
  real.real = true;
  real.leavesTrail = hunt !== 1;
  return list;
}

/** Moves every manifestation and resolves contact with the Tracker. */
export function updateEntities(state: GameState, dt: number): void {
  const tracker = state.players[1];
  const chamber = ROOM_BY_ID.exp;

  for (const [entityIndex, e] of state.entities.entries()) {
    if (e.gone) continue;
    let speed: number = ENTITY.speedByHunt[state.huntIndex];
    let tx = e.targetX;
    let ty = e.targetY;

    if (state.huntIndex === 2 && state.hunt3Stage !== undefined) {
      const phase = state.time % 12;
      if (e.real && state.hunt3Stage >= 3 && phase >= 5 && phase < 7 && state.messageUntil[1] <= state.time) {
        showMessage(state, 1, 'The entity is drawing near. The chamber’s low hum will disrupt its approach.', 2200);
      }
      if (e.real && state.hunt3LureActive) {
        tx = chamber.x + ENTITY.captureTargetOffset.x;
        ty = chamber.y + ENTITY.captureTargetOffset.y;
      } else if (e.real && state.hunt3Stage >= 3 && phase >= 7) {
        tx = tracker.x; ty = tracker.y; speed = ENTITY.chaseSpeed;
      } else {
        const roomIndex = (Math.floor(state.time / 5) + entityIndex * 2 + (e.real ? 1 : 0)) % ROOMS.length;
        const room = ROOMS[roomIndex]; tx = room.x + room.w / 2; ty = room.y + room.h / 2;
      }
    } else if (e.real && state.flags.tape) {
      tx = chamber.x + ENTITY.captureTargetOffset.x;
      ty = chamber.y + ENTITY.captureTargetOffset.y;
      speed = ENTITY.tapeSpeed;
      if (dist(e, { x: tx, y: ty }) < 8) continue;
    } else if (
      e.real &&
      (state.surgeTimer > 0 ||
        (state.huntIndex === 1 && dist(e, tracker) < ENTITY.chaseRange))
    ) {
      tx = tracker.x;
      ty = tracker.y;
      speed = state.surgeTimer > 0 ? ENTITY.surgeChaseSpeed : ENTITY.chaseSpeed;
    } else if (!tx || dist(e, { x: tx, y: ty }) < 14) {
      const room = ROOMS[randomInt(ROOMS.length)];
      tx = room.x + 30 + randomInt(ROOM_SIZE.w - 60);
      ty = room.y + 30 + randomInt(ROOM_SIZE.h - 60);
      e.targetX = tx;
      e.targetY = ty;
    }

    const d = dist(e, { x: tx, y: ty }) || 1;
    e.x += ((tx - e.x) / d) * speed * dt;
    e.y += ((ty - e.y) / d) * speed * dt;

    if (e.leavesTrail) {
      e.trailTimer -= dt;
      if (e.trailTimer < 0) {
        e.trailTimer = ENTITY.trailInterval;
        e.trail.push({ x: e.x, y: e.y, t: state.time });
        if (e.trail.length > ENTITY.trailMaxPoints) e.trail.shift();
      }
    }

    if (state.huntIndex === 2 && state.hunt3Stage === undefined && e.real && !state.flags.tape) {
      e.teleportTimer -= dt;
      if (e.teleportTimer < 0) {
        e.teleportTimer = ENTITY.teleportInterval;
        const angle = Math.random() * 6.28;
        e.x = tracker.x + Math.cos(angle) * ENTITY.teleportDistance;
        e.y = tracker.y + Math.sin(angle) * ENTITY.teleportDistance;
        playTone(70, 0.4, 'sawtooth', 0.08);
      }
    }

    if (dist(e, tracker) < ENTITY.contactRadius && !e.gone) {
      state.distortion = Math.max(state.distortion, 0.5);
      if (e.real && state.contactCooldown <= 0) {
        state.contactCooldown = CONTACT_COOLDOWN;
        addScore(state, SCORE.entityContact, 'entity contact');
        const home = spawnPosition(1);
        tracker.x = home.x;
        tracker.y = home.y;
        showMessage(state, 1, 'It caught you. You wake at the entrance.');
        playTone(55, 0.6, 'sawtooth', 0.1);
      }
    }
  }
}
