import os
from build_stage2_config import computed_defs

ts_code = """import type { HuntImage, TargetItem } from '../../../types/round1.types';

export interface Stage2TargetDefinition {
  targetId: string;
  aliases: string[];
  name: string;
  shortName: string;
  imageId: string;
  imageTitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  x: number;
  y: number;
  width: number;
  height: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  svgPath: string;
}

export const STAGE2_TARGET_DEFINITIONS: Stage2TargetDefinition[] = [
"""

for d in computed_defs:
    ts_code += f"""  {{
    targetId: '{d['targetId']}',
    aliases: {d['aliases']},
    name: "{d['name']}",
    shortName: '{d['shortName']}',
    imageId: '{d['imageId']}',
    imageTitle: "{d['imageTitle']}",
    difficulty: '{d['difficulty']}',
    x: {d['x']},
    y: {d['y']},
    width: {d['width']},
    height: {d['height']},
    xPercent: {d['xPercent']},
    yPercent: {d['yPercent']},
    widthPercent: {d['widthPercent']},
    heightPercent: {d['heightPercent']},
    svgPath: '{d['svgPath']}',
  }},
"""

ts_code += """];

export const STAGE2_CANONICAL_TARGETS: TargetItem[] = STAGE2_TARGET_DEFINITIONS.map((def) => ({
  id: def.targetId,
  name: def.shortName,
  icon: def.targetId === 'pumpkin' ? '🎃' :
        def.targetId === 'skull' ? '💀' :
        def.targetId === 'ghost' ? '👻' :
        def.targetId === 'bat' ? '🦇' :
        def.targetId === 'witch_hat' ? '🧙‍♀️' :
        def.targetId === 'spider' ? '🕷️' :
        def.targetId === 'spider_web' ? '🕸️' :
        def.targetId === 'coffin' ? '⚰️' :
        def.targetId === 'black_cat' ? '🐈‍⬛' :
        def.targetId === 'potion_bottle' ? '🧪' :
        def.targetId === 'candle' ? '🕯️' : '🗝️',
  isFound: false,
}));

export const STAGE2_CANONICAL_IMAGES: HuntImage[] = [
  {
    id: 'img_01',
    title: 'The Ancestral Study',
    imageUrl: '/assets/stage-02/photographs/ancestral-study.jpg',
    orientationDeg: -3.8,
    description: "An abandoned study where dust motes drift across weathered floorboards and a glowing carved jack-o'-lantern rests near the desk.",
    hotspots: [
      {
        id: 'hs_pumpkin',
        name: "Carved Jack-o'-Lantern",
        targetId: 'pumpkin',
        xPercent: STAGE2_TARGET_DEFINITIONS[0].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[0].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[0].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[0].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[0].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[0].x,
        originalY: STAGE2_TARGET_DEFINITIONS[0].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[0].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[0].height,
      },
    ],
    width: 1280,
    height: 857,
  },
  {
    id: 'img_02',
    title: "The Alchemist's Crypt",
    imageUrl: '/assets/stage-02/photographs/alchemists-crypt.jpg',
    orientationDeg: 2.2,
    description: 'A shadowy apothecary with dusty glass laboratory vials and an antique apothecary bottle sealed with dark alchemy.',
    hotspots: [
      {
        id: 'hs_potion',
        name: 'Venom Potion Bottle',
        targetId: 'potion_bottle',
        xPercent: STAGE2_TARGET_DEFINITIONS[1].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[1].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[1].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[1].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[1].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[1].x,
        originalY: STAGE2_TARGET_DEFINITIONS[1].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[1].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[1].height,
      },
    ],
    width: 1280,
    height: 853,
  },
  {
    id: 'img_03',
    title: 'The Mausoleum Vault',
    imageUrl: '/assets/stage-02/photographs/mausoleum-vault.jpg',
    orientationDeg: -1.8,
    description: 'A silent burial vault illuminated by a single shaft of light, revealing a stone sarcophagus and an ancestral skull.',
    hotspots: [
      {
        id: 'hs_coffin',
        name: 'Stone Sarcophagus Coffin',
        targetId: 'coffin',
        xPercent: STAGE2_TARGET_DEFINITIONS[2].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[2].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[2].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[2].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[2].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[2].x,
        originalY: STAGE2_TARGET_DEFINITIONS[2].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[2].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[2].height,
      },
      {
        id: 'hs_skull',
        name: 'Ancestral Skull',
        targetId: 'skull',
        xPercent: STAGE2_TARGET_DEFINITIONS[3].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[3].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[3].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[3].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[3].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[3].x,
        originalY: STAGE2_TARGET_DEFINITIONS[3].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[3].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[3].height,
      },
    ],
    width: 1280,
    height: 987,
  },
  {
    id: 'img_04',
    title: "The Witch's Belfry",
    imageUrl: '/assets/stage-02/photographs/witch-belfry.jpg',
    orientationDeg: 3.1,
    description: 'Gothic cathedral arches where a nocturnal bat roosts high in the masonry and an altar candle flickers on the stone ledge.',
    hotspots: [
      {
        id: 'hs_bat',
        name: 'Nocturnal Bat',
        targetId: 'bat',
        xPercent: STAGE2_TARGET_DEFINITIONS[4].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[4].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[4].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[4].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[4].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[4].x,
        originalY: STAGE2_TARGET_DEFINITIONS[4].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[4].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[4].height,
      },
      {
        id: 'hs_candle',
        name: 'Altar Candle',
        targetId: 'candle',
        xPercent: STAGE2_TARGET_DEFINITIONS[5].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[5].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[5].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[5].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[5].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[5].x,
        originalY: STAGE2_TARGET_DEFINITIONS[5].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[5].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[5].height,
      },
    ],
    width: 1280,
    height: 1920,
  },
  {
    id: 'img_05',
    title: 'The Haunted Mansion',
    imageUrl: '/assets/stage-02/photographs/haunted-mansion.jpg',
    orientationDeg: -2.6,
    description: 'A decaying foyer where cobwebs stretch across ornate cornices and a spectral ghost hovers above the staircase.',
    hotspots: [
      {
        id: 'hs_ghost',
        name: 'Spectral Ghost Apparition',
        targetId: 'ghost',
        xPercent: STAGE2_TARGET_DEFINITIONS[6].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[6].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[6].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[6].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[6].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[6].x,
        originalY: STAGE2_TARGET_DEFINITIONS[6].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[6].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[6].height,
      },
      {
        id: 'hs_web',
        name: 'Woven Cobweb',
        targetId: 'spider_web',
        xPercent: STAGE2_TARGET_DEFINITIONS[7].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[7].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[7].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[7].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[7].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[7].x,
        originalY: STAGE2_TARGET_DEFINITIONS[7].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[7].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[7].height,
      },
    ],
    width: 1200,
    height: 896,
  },
  {
    id: 'img_06',
    title: 'The Cursed Attic',
    imageUrl: '/assets/stage-02/photographs/cursed-attic.jpg',
    orientationDeg: 1.6,
    description: 'A shadowy loft where a witch hat lies abandoned on the stair tread and a spider crawls across the timber rafters.',
    hotspots: [
      {
        id: 'hs_witch_hat',
        name: 'Pointed Witch Hat',
        targetId: 'witch_hat',
        xPercent: STAGE2_TARGET_DEFINITIONS[8].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[8].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[8].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[8].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[8].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[8].x,
        originalY: STAGE2_TARGET_DEFINITIONS[8].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[8].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[8].height,
      },
      {
        id: 'hs_spider',
        name: 'Crawling Spider',
        targetId: 'spider',
        xPercent: STAGE2_TARGET_DEFINITIONS[9].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[9].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[9].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[9].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[9].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[9].x,
        originalY: STAGE2_TARGET_DEFINITIONS[9].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[9].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[9].height,
      },
    ],
    width: 1200,
    height: 896,
  },
  {
    id: 'img_07',
    title: 'The Haunted Village',
    imageUrl: '/assets/stage-02/photographs/haunted-village.jpg',
    orientationDeg: -2.2,
    description: 'A foggy midnight cobblestone alley lit by a solitary gas lamp where an obsidian black cat watches with glowing eyes.',
    hotspots: [
      {
        id: 'hs_black_cat',
        name: 'Obsidian Black Cat',
        targetId: 'black_cat',
        xPercent: STAGE2_TARGET_DEFINITIONS[10].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[10].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[10].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[10].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[10].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[10].x,
        originalY: STAGE2_TARGET_DEFINITIONS[10].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[10].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[10].height,
      },
    ],
    width: 1280,
    height: 853,
  },
  {
    id: 'img_08',
    title: 'The Forest Bridge',
    imageUrl: '/assets/stage-02/photographs/forest-bridge.jpg',
    orientationDeg: 2.4,
    description: 'A medieval stone arch bridge shrouded in river mist, hiding an ornate antique skeleton key upon its mossy parapet.',
    hotspots: [
      {
        id: 'hs_key',
        name: 'Ornate Skeleton Key',
        targetId: 'skeleton_key',
        xPercent: STAGE2_TARGET_DEFINITIONS[11].xPercent,
        yPercent: STAGE2_TARGET_DEFINITIONS[11].yPercent,
        widthPercent: STAGE2_TARGET_DEFINITIONS[11].widthPercent,
        heightPercent: STAGE2_TARGET_DEFINITIONS[11].heightPercent,
        svgPath: STAGE2_TARGET_DEFINITIONS[11].svgPath,
        originalX: STAGE2_TARGET_DEFINITIONS[11].x,
        originalY: STAGE2_TARGET_DEFINITIONS[11].y,
        originalWidth: STAGE2_TARGET_DEFINITIONS[11].width,
        originalHeight: STAGE2_TARGET_DEFINITIONS[11].height,
      },
    ],
    width: 1280,
    height: 1707,
  },
];

export const STAGE2_HUNT_IMAGES = STAGE2_CANONICAL_IMAGES;

/**
 * Normalizes user input against the Stage 2 answer key variations.
 */
export function normalizeTargetInput(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\\s+/g, ' ');
  for (const def of STAGE2_TARGET_DEFINITIONS) {
    for (const alias of def.aliases) {
      const cleanedAlias = alias.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\\s+/g, ' ');
      if (cleaned === cleanedAlias) {
        return def.targetId;
      }
    }
  }
  return null;
}

/**
 * Normalizes any legacy or prefixed target ID (e.g. 'target_pumpkin' -> 'pumpkin')
 */
export function normalizeTargetId(id: string): string {
  const trimmed = id.trim().toLowerCase();
  const stripped = trimmed.replace(/^target_/, '');
  // Map web to spider_web, key to skeleton_key, potion to potion_bottle
  if (stripped === 'web') return 'spider_web';
  if (stripped === 'key') return 'skeleton_key';
  if (stripped === 'potion') return 'potion_bottle';
  return stripped;
}
"""

with open("src/components/game/stage2/stage2TargetsConfig.ts", "w", encoding="utf-8") as f:
    f.write(ts_code)

print("Successfully written src/components/game/stage2/stage2TargetsConfig.ts!")

