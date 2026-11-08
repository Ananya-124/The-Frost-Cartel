import json

with open('public/assets/stage-02/manifest/target-manifest.json') as f:
    manifest = json.load(f)

# Build STAGE2_TARGET_DEFINITIONS code
defs_by_id = {t['targetId']: t for t in manifest}

ts_code = '''import type { HuntImage, TargetItem } from '../../../types/round1.types';

export interface Stage2TargetDefinition {
  targetId: string;
  aliases: string[];
  name: string;
  shortName: string;
  imageId: string;
  imageTitle: string;
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
'''

for t in manifest:
    aliases_str = json.dumps(t['aliases'])
    ts_code += f'''  {{
    targetId: '{t['targetId']}',
    aliases: {aliases_str},
    name: {json.dumps(t['name'])},
    shortName: '{t['shortName']}',
    imageId: '{t['imageId']}',
    imageTitle: {json.dumps(t['imageTitle'])},
    x: {t['x']},
    y: {t['y']},
    width: {t['width']},
    height: {t['height']},
    xPercent: {t['xPercent']},
    yPercent: {t['yPercent']},
    widthPercent: {t['widthPercent']},
    heightPercent: {t['heightPercent']},
    svgPath: '{t['svgPath']}',
  }},
'''

ts_code += '''];

export const STAGE2_CANONICAL_TARGETS: TargetItem[] = STAGE2_TARGET_DEFINITIONS.map((def) => ({
  id: def.targetId,
  name: def.shortName,
  icon: '',
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
        xPercent: ''' + str(defs_by_id['pumpkin']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['pumpkin']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['pumpkin']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['pumpkin']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[0].svgPath,
        originalX: ''' + str(defs_by_id['pumpkin']['x']) + ''',
        originalY: ''' + str(defs_by_id['pumpkin']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['pumpkin']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['pumpkin']['height']) + ''',
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
        xPercent: ''' + str(defs_by_id['potion_bottle']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['potion_bottle']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['potion_bottle']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['potion_bottle']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[1].svgPath,
        originalX: ''' + str(defs_by_id['potion_bottle']['x']) + ''',
        originalY: ''' + str(defs_by_id['potion_bottle']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['potion_bottle']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['potion_bottle']['height']) + ''',
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
        xPercent: ''' + str(defs_by_id['coffin']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['coffin']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['coffin']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['coffin']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[2].svgPath,
        originalX: ''' + str(defs_by_id['coffin']['x']) + ''',
        originalY: ''' + str(defs_by_id['coffin']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['coffin']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['coffin']['height']) + ''',
      },
      {
        id: 'hs_skull',
        name: 'Ancestral Skull',
        targetId: 'skull',
        xPercent: ''' + str(defs_by_id['skull']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['skull']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['skull']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['skull']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[3].svgPath,
        originalX: ''' + str(defs_by_id['skull']['x']) + ''',
        originalY: ''' + str(defs_by_id['skull']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['skull']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['skull']['height']) + ''',
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
        xPercent: ''' + str(defs_by_id['bat']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['bat']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['bat']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['bat']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[4].svgPath,
        originalX: ''' + str(defs_by_id['bat']['x']) + ''',
        originalY: ''' + str(defs_by_id['bat']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['bat']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['bat']['height']) + ''',
      },
      {
        id: 'hs_candle',
        name: 'Altar Candle',
        targetId: 'candle',
        xPercent: ''' + str(defs_by_id['candle']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['candle']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['candle']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['candle']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[5].svgPath,
        originalX: ''' + str(defs_by_id['candle']['x']) + ''',
        originalY: ''' + str(defs_by_id['candle']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['candle']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['candle']['height']) + ''',
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
        xPercent: ''' + str(defs_by_id['ghost']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['ghost']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['ghost']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['ghost']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[6].svgPath,
        originalX: ''' + str(defs_by_id['ghost']['x']) + ''',
        originalY: ''' + str(defs_by_id['ghost']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['ghost']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['ghost']['height']) + ''',
      },
      {
        id: 'hs_web',
        name: 'Woven Cobweb',
        targetId: 'spider_web',
        xPercent: ''' + str(defs_by_id['spider_web']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['spider_web']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['spider_web']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['spider_web']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[7].svgPath,
        originalX: ''' + str(defs_by_id['spider_web']['x']) + ''',
        originalY: ''' + str(defs_by_id['spider_web']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['spider_web']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['spider_web']['height']) + ''',
      },
    ],
    width: 1280,
    height: 960,
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
        xPercent: ''' + str(defs_by_id['witch_hat']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['witch_hat']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['witch_hat']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['witch_hat']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[8].svgPath,
        originalX: ''' + str(defs_by_id['witch_hat']['x']) + ''',
        originalY: ''' + str(defs_by_id['witch_hat']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['witch_hat']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['witch_hat']['height']) + ''',
      },
      {
        id: 'hs_spider',
        name: 'Crawling Spider',
        targetId: 'spider',
        xPercent: ''' + str(defs_by_id['spider']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['spider']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['spider']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['spider']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[9].svgPath,
        originalX: ''' + str(defs_by_id['spider']['x']) + ''',
        originalY: ''' + str(defs_by_id['spider']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['spider']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['spider']['height']) + ''',
      },
    ],
    width: 1280,
    height: 765,
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
        xPercent: ''' + str(defs_by_id['black_cat']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['black_cat']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['black_cat']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['black_cat']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[10].svgPath,
        originalX: ''' + str(defs_by_id['black_cat']['x']) + ''',
        originalY: ''' + str(defs_by_id['black_cat']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['black_cat']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['black_cat']['height']) + ''',
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
        xPercent: ''' + str(defs_by_id['skeleton_key']['xPercent']) + ''',
        yPercent: ''' + str(defs_by_id['skeleton_key']['yPercent']) + ''',
        widthPercent: ''' + str(defs_by_id['skeleton_key']['widthPercent']) + ''',
        heightPercent: ''' + str(defs_by_id['skeleton_key']['heightPercent']) + ''',
        svgPath: STAGE2_TARGET_DEFINITIONS[11].svgPath,
        originalX: ''' + str(defs_by_id['skeleton_key']['x']) + ''',
        originalY: ''' + str(defs_by_id['skeleton_key']['y']) + ''',
        originalWidth: ''' + str(defs_by_id['skeleton_key']['width']) + ''',
        originalHeight: ''' + str(defs_by_id['skeleton_key']['height']) + ''',
      },
    ],
    width: 1280,
    height: 1707,
  },
];

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
'''

with open('src/components/game/stage2/stage2TargetsConfig.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print("stage2TargetsConfig.ts updated successfully!")

