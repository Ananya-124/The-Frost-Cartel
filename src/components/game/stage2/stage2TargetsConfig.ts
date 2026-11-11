import type { HuntImage, TargetItem } from '../../../types/round1.types';

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
  {
    targetId: 'pumpkin',
    aliases: ["pumpkin", "jack-o-lantern", "jack o lantern"],
    name: "Carved Jack-o'-Lantern",
    shortName: 'Pumpkin',
    imageId: 'img_01',
    imageTitle: "The Ancestral Study",
    difficulty: 'EASY',
    x: 247,
    y: 352,
    width: 81,
    height: 92,
    xPercent: 24.15,
    yPercent: 56.67,
    widthPercent: 7.93,
    heightPercent: 14.87,
    svgPath: 'M 290.0,354.0 C 291.0,354.0 292.5,352.5 293.0,354.0 C 293.5,355.5 291.8,361.7 293.0,363.0 C 294.2,364.3 297.2,361.7 300.0,362.0 C 302.8,362.3 306.8,363.3 310.0,365.0 C 313.2,366.7 316.5,369.2 319.0,372.0 C 321.5,374.8 323.5,378.3 325.0,382.0 C 326.5,385.7 327.5,390.0 328.0,394.0 C 328.5,398.0 328.5,402.2 328.0,406.0 C 327.5,409.8 326.5,413.5 325.0,417.0 C 323.5,420.5 321.3,424.0 319.0,427.0 C 316.7,430.0 313.8,432.7 311.0,435.0 C 308.2,437.3 305.2,439.5 302.0,441.0 C 298.8,442.5 294.8,443.3 292.0,444.0 C 289.2,444.7 287.5,445.0 285.0,445.0 C 282.5,445.0 279.8,444.8 277.0,444.0 C 274.2,443.2 271.0,441.7 268.0,440.0 C 265.0,438.3 261.7,436.5 259.0,434.0 C 256.3,431.5 253.8,428.3 252.0,425.0 C 250.2,421.7 248.7,418.0 248.0,414.0 C 247.3,410.0 247.7,405.3 248.0,401.0 C 248.3,396.7 248.8,392.2 250.0,388.0 C 251.2,383.8 252.7,379.5 255.0,376.0 C 257.3,372.5 260.8,369.2 264.0,367.0 C 267.2,364.8 270.3,363.7 274.0,363.0 C 277.7,362.3 283.8,364.5 286.0,363.0 C 288.2,361.5 286.3,355.5 287.0,354.0 C 287.7,352.5 289.0,354.0 290.0,354.0 Z',
  },
  {
    targetId: 'potion_bottle',
    aliases: ["potion_bottle", "potion bottle", "potion vial", "potion"],
    name: "Venom Potion Bottle",
    shortName: 'Potion Bottle',
    imageId: 'img_02',
    imageTitle: "The Alchemist's Crypt",
    difficulty: 'EASY',
    x: 370,
    y: 122,
    width: 55,
    height: 202,
    xPercent: 36.13,
    yPercent: 21.75,
    widthPercent: 5.37,
    heightPercent: 36.01,
    svgPath: 'M 388 126 C 388 123.5 392 122.5 396.5 122.5 C 401 122.5 405 123.5 405 126 L 405 144 C 406 145 407 147 406.5 149 C 406 151 405 152 404.5 155 C 404 165 403.5 180 403 195 C 403 205 407 215 413 223 C 418 229 423 234 424 242 C 424.5 255 424.5 275 424 295 C 423.5 305 422 314 420 319 C 415 322 405 324 396.5 324 C 388 324 378 322 374 319 C 372.5 314 371.5 305 371 295 C 370.5 275 370.5 255 371 242 C 372 234 376 229 381 223 C 386.5 215 388 205 388 195 C 387.5 180 387 165 386.5 155 C 386 152 385 151 384.5 149 C 384 147 385 145 386 144 L 387 126 Z',
  },
  {
    targetId: 'coffin',
    aliases: ["coffin", "casket", "sarcophagus"],
    name: "Stone Sarcophagus Coffin",
    shortName: 'Coffin',
    imageId: 'img_03',
    imageTitle: "The Mausoleum Vault",
    difficulty: 'EASY',
    x: 220,
    y: 350,
    width: 560,
    height: 245,
    xPercent: 21.48,
    yPercent: 56.45,
    widthPercent: 54.69,
    heightPercent: 39.52,
    svgPath: 'M 258 520 L 320 520 L 435 480 L 525 480 L 630 515 L 690 520 L 752 525 L 756 545 L 725 550 L 725 580 L 780 595 L 230 595 L 185 580 L 255 540 Z',
  },
  {
    targetId: 'skull',
    aliases: ["skull", "ancestral skull"],
    name: "Ancestral Skull",
    shortName: 'Skull',
    imageId: 'img_03',
    imageTitle: "The Mausoleum Vault",
    difficulty: 'EASY',
    x: 268,
    y: 528,
    width: 32,
    height: 34,
    xPercent: 26.17,
    yPercent: 85.16,
    widthPercent: 3.13,
    heightPercent: 5.48,
    svgPath: 'M 280 528.5 C 285 528.5 291 530 295 533 C 298 535.5 299.5 538.5 299 542 C 298.5 544.5 298 547 296.5 549 C 295.5 551 295 554 294 557 C 292 561 286 562.5 281 562.5 C 276 562.5 272 560.5 269 557 C 267.5 553 267 547 268 541 C 268.5 536 271 531.5 275 529.5 C 276.5 528.8 278.2 528.5 280 528.5 Z',
  },
  {
    targetId: 'bat',
    aliases: ["bat", "vampire bat", "nocturnal bat"],
    name: "Nocturnal Bat",
    shortName: 'Bat',
    imageId: 'img_04',
    imageTitle: "The Witch's Belfry",
    difficulty: 'HARD',
    x: 468,
    y: 100,
    width: 125,
    height: 20,
    xPercent: 45.7,
    yPercent: 16.03,
    widthPercent: 12.21,
    heightPercent: 3.21,
    svgPath: 'M 468 110 C 475 107 485 106 496 105 C 506 106 515 107 520 107 C 524 105 528 103 531 102 C 534 103 538 105 542 104 C 550 102 562 101 575 102 C 582 101 588 101 593 101 C 589 105 583 107 577 107 C 572 109 565 112 557 112 C 550 113 543 115 539 116 C 536 118 534 119 531 119 C 528 119 526 118 522 116 C 518 115 510 113 504 112 C 496 112 489 111 482 112 C 475 112 470 111 468 110 Z',
  },
  {
    targetId: 'candle',
    aliases: ["candle", "altar candle", "ritual candle"],
    name: "Altar Candle",
    shortName: 'Candle',
    imageId: 'img_04',
    imageTitle: "The Witch's Belfry",
    difficulty: 'MEDIUM',
    x: 402,
    y: 376,
    width: 13,
    height: 25,
    xPercent: 39.26,
    yPercent: 60.26,
    widthPercent: 1.27,
    heightPercent: 4.01,
    svgPath: 'M 408 376 C 410 376 412 377 413 378 C 414 379 412 380 411 381 C 413 381.5 414 382 414 383 C 414.5 388 415 394 415 398 C 415 400 414 401 413 401 C 410 401 406 401 403 401 C 402 401 402 400 402 398 C 402 394 402.5 388 402 383 C 402 382 403.5 381.5 405 381 C 404 380 403.5 379 406 378 C 407 377 407 376 408 376 Z',
  },
  {
    targetId: 'ghost',
    aliases: ["ghost", "spirit", "apparition", "spectral ghost"],
    name: "Spectral Ghost Apparition",
    shortName: 'Ghost',
    imageId: 'img_05',
    imageTitle: "The Haunted Mansion",
    difficulty: 'MEDIUM',
    x: 399,
    y: 388,
    width: 27,
    height: 58,
    xPercent: 38.96,
    yPercent: 61.69,
    widthPercent: 2.64,
    heightPercent: 9.22,
    svgPath: 'M 413 388 C 418 388 421 391 421 396 C 421 401 418 405 418 408 C 422 410 426 414 426 419 C 426 426 425 434 423 440 C 421 444 416 446 412 446 C 407 446 403 444 401 440 C 399 434 399 426 399 419 C 399 414 403 410 407 408 C 407 405 404 401 404 396 C 404 391 408 388 413 388 Z',
  },
  {
    targetId: 'spider_web',
    aliases: ["spider_web", "spider web", "cobweb", "web"],
    name: "Woven Cobweb",
    shortName: 'Spider Web',
    imageId: 'img_05',
    imageTitle: "The Haunted Mansion",
    difficulty: 'HARD',
    x: 830,
    y: 61,
    width: 108,
    height: 107,
    xPercent: 81.05,
    yPercent: 9.70,
    widthPercent: 10.55,
    heightPercent: 17.01,
    svgPath: 'M 870 61 C 890 63 912 68 930 76 C 936 86 938 100 938 116 C 938 132 931 148 920 160 C 908 166 892 168 878 168 C 860 166 846 156 836 142 C 830 130 830 114 832 102 C 836 88 852 70 870 61 Z',
  },
  {
    targetId: 'witch_hat',
    aliases: ["witch_hat", "witch hat", "pointed hat", "hat"],
    name: "Pointed Witch Hat",
    shortName: 'Witch Hat',
    imageId: 'img_06',
    imageTitle: "The Cursed Attic",
    difficulty: 'MEDIUM',
    x: 332,
    y: 623,
    width: 96,
    height: 90,
    xPercent: 27.67,
    yPercent: 69.53,
    widthPercent: 8.0,
    heightPercent: 10.04,
    svgPath: 'M 389.0,710.5 C 381.3,711.3 377.7,711.0 371.0,710.5 C 364.3,710.0 354.2,708.5 349.0,707.5 C 343.8,706.5 342.2,705.8 340.0,704.5 C 337.8,703.2 336.2,701.2 335.5,700.0 C 334.8,698.8 334.8,698.1 335.5,697.0 C 336.2,695.9 337.2,694.6 340.0,693.5 C 342.8,692.4 349.6,691.4 352.0,690.5 C 354.4,689.6 350.0,698.0 354.5,688.0 C 359.0,678.0 374.3,639.5 379.0,630.5 C 383.7,621.5 378.1,624.2 382.5,634.0 C 386.9,643.8 399.2,679.1 405.5,689.0 C 411.8,698.9 416.8,692.0 420.0,693.5 C 423.2,695.0 423.8,696.9 424.5,698.0 C 425.2,699.1 425.8,698.8 424.5,700.0 C 423.2,701.2 422.9,703.8 417.0,705.5 C 411.1,707.2 396.7,709.7 389.0,710.5 Z',
  },
  {
    targetId: 'spider',
    aliases: ["spider", "arachnid", "crawling spider"],
    name: "Crawling Spider",
    shortName: 'Spider',
    imageId: 'img_06',
    imageTitle: "The Cursed Attic",
    difficulty: 'HARD',
    x: 511,
    y: 203,
    width: 86,
    height: 93,
    xPercent: 42.58,
    yPercent: 22.66,
    widthPercent: 7.17,
    heightPercent: 10.38,
    svgPath: 'M 576.0,290.5 C 577.1,296.2 575.7,294.2 573.5,289.0 C 571.3,283.8 564.5,263.7 563.0,259.5 C 561.5,255.3 564.7,262.8 564.5,264.0 C 564.3,265.2 562.9,266.6 562.0,266.5 C 561.1,266.4 561.3,264.0 559.0,263.5 C 556.7,263.0 550.0,263.2 548.0,263.5 C 546.0,263.8 547.7,265.2 547.0,265.5 C 546.3,265.8 544.7,266.0 544.0,265.5 C 543.3,265.0 543.4,262.8 543.0,262.5 C 542.6,262.2 542.8,259.9 541.5,264.0 C 540.2,268.1 536.9,282.6 535.5,287.0 C 534.1,291.4 533.2,292.7 533.0,290.5 C 532.8,288.3 533.2,280.0 534.5,274.0 C 535.8,268.0 541.1,257.4 541.0,254.5 C 540.9,251.6 538.0,253.2 534.0,256.5 C 530.0,259.8 520.2,271.4 517.0,274.5 C 513.8,277.6 514.9,275.2 514.5,275.0 C 514.1,274.8 511.6,276.6 514.5,273.0 C 517.4,269.4 527.2,257.7 532.0,253.5 C 536.8,249.3 543.2,250.3 543.5,248.0 C 543.8,245.7 538.1,240.6 534.0,239.5 C 529.9,238.4 522.4,241.6 519.0,241.5 C 515.6,241.4 514.2,239.7 513.5,239.0 C 512.8,238.3 513.8,237.6 515.0,237.5 C 516.2,237.4 519.0,238.8 521.0,238.5 C 523.0,238.2 525.0,236.0 527.0,235.5 C 529.0,235.0 529.9,234.2 533.0,235.5 C 536.1,236.8 544.1,243.1 545.5,243.0 C 546.9,242.9 542.2,237.5 541.5,235.0 C 540.8,232.5 542.5,231.0 541.5,228.0 C 540.5,225.0 537.0,219.2 535.5,217.0 C 534.0,214.8 533.2,216.6 532.5,215.0 C 531.8,213.4 529.7,207.0 531.0,207.5 C 532.3,208.0 538.2,214.7 540.5,218.0 C 542.8,221.3 542.9,227.4 545.0,227.5 C 547.1,227.6 550.7,219.7 553.0,218.5 C 555.3,217.3 557.3,219.0 559.0,220.5 C 560.7,222.0 561.4,228.1 563.0,227.5 C 564.6,226.9 566.7,219.3 568.5,217.0 C 570.3,214.7 572.2,215.2 574.0,213.5 C 575.8,211.8 577.9,207.6 579.0,206.5 C 580.1,205.4 580.8,205.8 580.5,207.0 C 580.2,208.2 579.5,211.2 577.5,214.0 C 575.5,216.8 570.3,221.7 568.5,224.0 C 566.7,226.3 566.8,226.0 566.5,228.0 C 566.2,230.0 567.2,233.5 566.5,236.0 C 565.8,238.5 561.2,242.9 562.5,243.0 C 563.8,243.1 570.6,237.4 574.0,236.5 C 577.4,235.6 580.8,236.7 583.0,237.5 C 585.2,238.3 585.3,240.8 587.0,241.5 C 588.7,242.2 592.2,241.2 593.0,241.5 C 593.8,241.8 593.2,243.2 592.0,243.5 C 590.8,243.8 587.5,243.8 586.0,243.5 C 584.5,243.2 585.0,242.0 583.0,241.5 C 581.0,241.0 577.1,239.4 574.0,240.5 C 570.9,241.6 564.3,246.0 564.5,248.0 C 564.7,250.0 570.2,248.3 575.0,252.5 C 579.8,256.7 590.8,269.5 593.5,273.0 C 596.2,276.5 594.2,276.2 591.0,273.5 C 587.8,270.8 578.0,259.7 574.0,256.5 C 570.0,253.3 566.7,248.8 567.0,254.5 C 567.3,260.2 574.9,284.8 576.0,290.5 Z',
  },
  {
    targetId: 'black_cat',
    aliases: ["black_cat", "black cat", "cat", "feline"],
    name: "Obsidian Black Cat",
    shortName: 'Black Cat',
    imageId: 'img_07',
    imageTitle: "The Haunted Village",
    difficulty: 'MEDIUM',
    x: 655,
    y: 617,
    width: 78,
    height: 131,
    xPercent: 51.17,
    yPercent: 72.33,
    widthPercent: 6.09,
    heightPercent: 15.36,
    svgPath: 'M 725.0,745.5 C 714.1,746.1 673.6,745.8 663.0,745.5 C 652.4,745.2 661.6,744.8 661.5,744.0 C 661.4,743.2 663.2,742.5 662.5,741.0 C 661.8,739.5 657.5,738.2 657.5,735.0 C 657.5,731.8 662.2,724.2 662.5,722.0 C 662.8,719.8 659.7,722.2 659.0,721.5 C 658.3,720.8 657.8,719.3 658.5,718.0 C 659.2,716.7 661.4,713.9 663.0,713.5 C 664.6,713.1 666.1,716.4 668.0,715.5 C 669.9,714.6 673.4,711.8 674.5,708.0 C 675.6,704.2 676.3,699.2 674.5,693.0 C 672.7,686.8 665.3,677.3 663.5,671.0 C 661.7,664.7 664.3,659.0 663.5,655.0 C 662.7,651.0 659.1,652.1 658.5,647.0 C 657.9,641.9 658.1,627.1 660.0,624.5 C 661.9,621.9 667.0,630.3 670.0,631.5 C 673.0,632.7 674.7,632.7 678.0,631.5 C 681.3,630.3 687.8,625.2 690.0,624.5 C 692.2,623.8 691.8,624.9 691.5,627.0 C 691.2,629.1 688.5,634.0 688.5,637.0 C 688.5,640.0 691.2,642.7 691.5,645.0 C 691.8,647.3 689.8,649.8 690.5,651.0 C 691.2,652.2 694.4,651.6 696.0,652.5 C 697.6,653.4 698.8,656.0 700.0,656.5 C 701.2,657.0 701.8,654.8 703.0,655.5 C 704.2,656.2 705.5,659.7 707.0,660.5 C 708.5,661.3 711.2,662.2 712.0,660.5 C 712.8,658.8 712.7,651.3 712.0,650.5 C 711.3,649.7 709.4,654.9 708.0,655.5 C 706.6,656.1 702.9,657.2 703.5,654.0 C 704.1,650.8 710.3,640.8 711.5,636.0 C 712.7,631.2 710.1,627.4 710.5,625.0 C 710.9,622.6 712.2,621.8 714.0,621.5 C 715.8,621.2 720.8,620.1 721.5,623.0 C 722.2,625.9 718.8,635.8 718.5,639.0 C 718.2,642.2 719.0,642.2 720.0,642.5 C 721.0,642.8 723.7,639.8 724.5,641.0 C 725.3,642.2 725.0,652.5 725.0,649.5 C 725.0,646.5 724.1,627.2 724.5,623.0 C 724.9,618.8 726.8,618.8 727.5,624.0 C 728.2,629.2 728.8,648.9 728.5,654.0 C 728.2,659.1 726.5,654.0 726.0,654.5 C 725.5,655.0 725.2,656.1 725.5,657.0 C 725.8,657.9 727.0,654.7 727.5,660.0 C 728.0,665.3 728.6,683.9 728.5,689.0 C 728.4,694.1 727.6,690.9 727.0,690.5 C 726.4,690.1 725.6,686.9 725.0,686.5 C 724.4,686.1 723.1,686.6 723.5,688.0 C 723.9,689.4 726.8,692.7 727.5,695.0 C 728.2,697.3 727.8,700.5 727.5,702.0 C 727.2,703.5 725.3,701.5 725.5,704.0 C 725.7,706.5 728.8,713.2 728.5,717.0 C 728.2,720.8 727.3,724.3 724.0,726.5 C 720.7,728.7 709.2,728.8 708.5,730.0 C 707.8,731.2 716.9,733.1 720.0,733.5 C 723.1,733.9 725.6,731.1 727.0,732.5 C 728.4,733.9 728.8,739.8 728.5,742.0 C 728.2,744.2 735.9,744.9 725.0,745.5 Z',
  },
  {
    targetId: 'skeleton_key',
    aliases: ["skeleton_key", "skeleton key", "antique key", "key"],
    name: "Ornate Skeleton Key",
    shortName: 'Skeleton Key',
    imageId: 'img_08',
    imageTitle: "The Forest Bridge",
    difficulty: 'HARD',
    x: 798,
    y: 1319,
    width: 124,
    height: 38,
    xPercent: 62.34,
    yPercent: 77.27,
    widthPercent: 9.69,
    heightPercent: 2.23,
    svgPath: 'M 800.0,1338.0 C 800.0,1334.7 802.0,1330.7 804.0,1328.0 C 806.0,1325.3 808.7,1323.0 812.0,1322.0 C 815.3,1321.0 820.7,1321.2 824.0,1322.0 C 827.3,1322.8 829.7,1325.3 832.0,1327.0 C 834.3,1328.7 836.0,1331.2 838.0,1332.0 C 840.0,1332.8 842.7,1331.5 844.0,1332.0 C 845.3,1332.5 837.7,1334.5 846.0,1335.0 C 854.3,1335.5 885.7,1336.8 894.0,1335.0 C 902.3,1333.2 894.3,1325.8 896.0,1324.0 C 897.7,1322.2 902.7,1323.0 904.0,1324.0 C 905.3,1325.0 902.7,1329.0 904.0,1330.0 C 905.3,1331.0 910.7,1331.0 912.0,1330.0 C 913.3,1329.0 911.0,1325.0 912.0,1324.0 C 913.0,1323.0 917.0,1321.0 918.0,1324.0 C 919.0,1327.0 921.7,1339.0 918.0,1342.0 C 914.3,1345.0 900.0,1342.2 896.0,1342.0 C 892.0,1341.8 902.3,1341.2 894.0,1341.0 C 885.7,1340.8 854.3,1340.5 846.0,1341.0 C 837.7,1341.5 845.3,1343.5 844.0,1344.0 C 842.7,1344.5 840.0,1343.2 838.0,1344.0 C 836.0,1344.8 834.3,1347.3 832.0,1349.0 C 829.7,1350.7 827.3,1353.2 824.0,1354.0 C 820.7,1354.8 815.3,1355.0 812.0,1354.0 C 808.7,1353.0 806.0,1350.7 804.0,1348.0 C 802.0,1345.3 800.0,1341.3 800.0,1338.0 Z',
  },
];

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
    width: 1024,
    height: 622,
  },
  {
    id: 'img_02',
    title: "The Alchemist's Crypt",
    imageUrl: '/assets/stage-02/photographs/apothecary-hidden-potion-master.webp',
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
    width: 1024,
    height: 561,
  },
  {
    id: 'img_03',
    title: 'The Mausoleum Vault',
    imageUrl: '/assets/stage-02/photographs/mausoleum-vault-master.webp',
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
    width: 1024,
    height: 620,
  },
  {
    id: 'img_04',
    title: "The Witch's Belfry",
    imageUrl: '/assets/stage-02/photographs/witch-belfry-master.webp',
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
    width: 1024,
    height: 624,
  },
  {
    id: 'img_05',
    title: 'The Haunted Mansion',
    imageUrl: '/assets/stage-02/photographs/haunted-mansion-master.webp',
    orientationDeg: -2.6,
    description: 'A decaying foyer where cobwebs stretch across ornate cornices and an oval portrait of a spectral ghost hangs above the clock.',
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
    width: 1024,
    height: 629,
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
  const cleaned = raw.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  for (const def of STAGE2_TARGET_DEFINITIONS) {
    for (const alias of def.aliases) {
      const cleanedAlias = alias.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
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
