import React from 'react';
import {
  ART_BASE_BACK,
  ART_BASE_FRONT,
  ART_DEFS,
  ART_SHARDS,
} from './pumpkinArtData';

/** Static, trusted SVG artwork (see pumpkinArtData.ts). Rendered inline so CSS can animate it. */
const Art: React.FC<{ viewBox: string; markup: string; className?: string }> = ({ viewBox, markup, className }) => (
  <svg viewBox={viewBox} className={className} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: markup }} />
);

/** Filters and gradients shared by every drawing. Render once, anywhere on the page. */
export const S1Defs: React.FC = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }} dangerouslySetInnerHTML={{ __html: `<defs>${ART_DEFS}</defs>` }} />
);

/** Photographic pumpkin, reused for every position so no pumpkin can be distinguished. */
export const PumpkinSvg: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/assets/stage1/pumpkin-reference.png"
    alt=""
    aria-hidden="true"
    draggable={false}
    className={className}
  />
);

/** Smashed pumpkin: the hollow inside (drawn behind the skull)… */
export const PumpkinBaseBack: React.FC<{ className?: string }> = ({ className }) => <Art viewBox="0 0 200 176" markup={ART_BASE_BACK} className={className} />;
/** …and the front wall of the shell (drawn in front of the skull). */
export const PumpkinBaseFront: React.FC<{ className?: string }> = ({ className }) => <Art viewBox="0 0 200 176" markup={ART_BASE_FRONT} className={className} />;

export const SkullSvg: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/assets/stage1/skull-cutout.png"
    alt=""
    aria-hidden="true"
    draggable={false}
    className={className}
  />
);
export const ShardSvg: React.FC<{ index: number; className?: string }> = ({ index, className }) => (
  <Art viewBox="0 0 40 40" markup={ART_SHARDS[index % ART_SHARDS.length]} className={className} />
);
