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
    x: 401,
    y: 150,
    width: 128,
    height: 431,
    xPercent: 31.33,
    yPercent: 17.58,
    widthPercent: 10.0,
    heightPercent: 50.53,
    svgPath: 'M 518.0,555.0 C 500.2,586.7 429.2,586.7 411.5,555.0 C 393.8,523.3 410.1,401.7 411.5,365.0 C 412.9,328.3 414.0,344.0 420.0,335.0 C 426.0,326.0 442.9,327.7 447.5,311.0 C 452.1,294.3 448.1,247.8 447.5,235.0 C 446.9,222.2 444.4,246.5 444.0,234.0 C 443.6,221.5 441.5,173.3 445.0,160.0 C 448.5,146.7 458.3,154.0 465.0,154.0 C 471.7,154.0 481.5,146.7 485.0,160.0 C 488.5,173.3 486.4,221.5 486.0,234.0 C 485.6,246.5 483.1,222.2 482.5,235.0 C 481.9,247.8 477.9,294.3 482.5,311.0 C 487.1,327.7 504.0,326.0 510.0,335.0 C 516.0,344.0 517.2,328.3 518.5,365.0 C 519.8,401.7 535.8,523.3 518.0,555.0 Z',
  },
  {
    targetId: 'coffin',
    aliases: ["coffin", "casket", "sarcophagus"],
    name: "Stone Sarcophagus Coffin",
    shortName: 'Coffin',
    imageId: 'img_03',
    imageTitle: "The Mausoleum Vault",
    difficulty: 'EASY',
    x: 429,
    y: 538,
    width: 441,
    height: 291,
    xPercent: 33.52,
    yPercent: 54.51,
    widthPercent: 34.45,
    heightPercent: 29.48,
    svgPath: 'M 840.0,820.5 C 776.6,828.8 523.4,828.9 460.0,820.5 C 396.6,812.1 457.9,778.6 459.5,770.0 C 461.1,761.4 467.8,794.0 469.5,769.0 C 471.2,744.0 457.9,644.9 469.5,620.0 C 481.1,595.1 527.2,631.2 539.0,619.5 C 550.8,607.8 499.8,561.2 540.0,549.5 C 580.2,537.8 739.8,537.8 780.0,549.5 C 820.2,561.2 768.4,607.8 781.0,619.5 C 793.6,631.2 843.1,594.9 855.5,620.0 C 867.9,645.1 858.0,744.8 855.5,770.0 C 853.0,795.2 843.1,762.6 840.5,771.0 C 837.9,779.4 903.4,812.2 840.0,820.5 Z',
  },
  {
    targetId: 'skull',
    aliases: ["skull", "ancestral skull"],
    name: "Ancestral Skull",
    shortName: 'Skull',
    imageId: 'img_03',
    imageTitle: "The Mausoleum Vault",
    difficulty: 'EASY',
    x: 481,
    y: 720,
    width: 77,
    height: 93,
    xPercent: 37.58,
    yPercent: 72.95,
    widthPercent: 6.02,
    heightPercent: 9.42,
    svgPath: 'M 535.0,809.5 C 528.6,811.6 515.2,811.2 509.0,809.5 C 502.8,807.8 499.5,802.0 497.5,799.0 C 495.5,796.0 499.2,791.7 497.0,791.5 C 494.8,791.3 486.6,799.2 484.5,798.0 C 482.4,796.8 482.8,787.0 484.5,784.0 C 486.2,781.0 493.8,782.1 494.5,780.0 C 495.2,777.9 490.7,773.2 489.0,771.5 C 487.3,769.8 485.2,772.2 484.5,770.0 C 483.8,767.8 483.8,759.8 484.5,758.0 C 485.2,756.2 487.8,761.7 488.5,759.0 C 489.2,756.3 487.4,746.4 488.5,742.0 C 489.6,737.6 490.9,735.6 495.0,732.5 C 499.1,729.4 507.8,725.2 513.0,723.5 C 518.2,721.8 522.0,722.2 526.0,722.5 C 530.0,722.8 533.8,724.3 537.0,725.5 C 540.2,726.7 542.1,726.9 545.0,729.5 C 547.9,732.1 552.9,733.9 554.5,741.0 C 556.1,748.1 555.5,765.5 554.5,772.0 C 553.5,778.5 548.5,778.2 548.5,780.0 C 548.5,781.8 553.5,780.7 554.5,783.0 C 555.5,785.3 555.8,792.6 554.5,794.0 C 553.2,795.4 548.2,791.0 547.0,791.5 C 545.8,792.0 549.5,794.0 547.5,797.0 C 545.5,800.0 541.4,807.4 535.0,809.5 Z',
  },
  {
    targetId: 'bat',
    aliases: ["bat", "vampire bat", "nocturnal bat"],
    name: "Nocturnal Bat",
    shortName: 'Bat',
    imageId: 'img_04',
    imageTitle: "The Witch's Belfry",
    difficulty: 'HARD',
    x: 577,
    y: 216,
    width: 165,
    height: 86,
    xPercent: 45.08,
    yPercent: 11.25,
    widthPercent: 12.89,
    heightPercent: 4.48,
    svgPath: 'M 638.0,299.5 C 635.8,298.8 634.3,289.5 633.0,288.5 C 631.7,287.5 631.1,293.1 630.0,293.5 C 628.9,293.9 626.2,292.2 626.5,291.0 C 626.8,289.8 631.1,289.2 631.5,286.0 C 631.9,282.8 630.4,273.6 629.0,271.5 C 627.6,269.4 626.2,274.7 623.0,273.5 C 619.8,272.3 613.7,266.0 610.0,264.5 C 606.3,263.0 603.5,264.0 601.0,264.5 C 598.5,265.0 597.3,268.0 595.0,267.5 C 592.7,267.0 589.5,262.7 587.0,261.5 C 584.5,260.3 580.6,262.4 580.0,260.5 C 579.4,258.6 581.5,253.0 583.5,250.0 C 585.5,247.0 588.4,244.2 592.0,242.5 C 595.6,240.8 601.8,239.8 605.0,239.5 C 608.2,239.2 606.0,237.8 611.0,240.5 C 616.0,243.2 629.7,253.2 635.0,255.5 C 640.3,257.8 641.0,255.7 643.0,254.5 C 645.0,253.3 645.9,248.6 647.0,248.5 C 648.1,248.4 648.0,252.5 649.5,254.0 C 651.0,255.5 653.9,257.1 656.0,257.5 C 658.1,257.9 660.2,257.6 662.0,256.5 C 663.8,255.4 664.9,254.1 666.5,251.0 C 668.1,247.9 670.4,242.1 671.5,238.0 C 672.6,233.9 671.9,228.2 673.0,226.5 C 674.1,224.8 674.2,228.7 678.0,227.5 C 681.8,226.3 689.2,220.8 696.0,219.5 C 702.8,218.2 711.8,218.1 719.0,219.5 C 726.2,220.9 737.8,225.1 739.5,228.0 C 741.2,230.9 731.8,233.8 729.5,237.0 C 727.2,240.2 727.9,245.8 726.0,247.5 C 724.1,249.2 720.4,246.6 718.0,247.5 C 715.6,248.4 713.2,250.0 711.5,253.0 C 709.8,256.0 710.8,263.6 708.0,265.5 C 705.2,267.4 701.3,261.3 695.0,264.5 C 688.7,267.7 676.5,280.7 670.0,284.5 C 663.5,288.3 659.0,285.8 656.0,287.5 C 653.0,289.2 653.0,293.3 652.0,294.5 C 651.0,295.7 650.5,295.0 650.0,294.5 C 649.5,294.0 649.7,291.8 649.0,291.5 C 648.3,291.2 647.8,291.2 646.0,292.5 C 644.2,293.8 640.2,300.2 638.0,299.5 Z',
  },
  {
    targetId: 'candle',
    aliases: ["candle", "altar candle", "ritual candle"],
    name: "Altar Candle",
    shortName: 'Candle',
    imageId: 'img_04',
    imageTitle: "The Witch's Belfry",
    difficulty: 'MEDIUM',
    x: 493,
    y: 1186,
    width: 23,
    height: 95,
    xPercent: 38.52,
    yPercent: 61.77,
    widthPercent: 1.8,
    heightPercent: 4.95,
    svgPath: 'M 511.0,1274.5 C 508.9,1284.4 501.2,1274.8 499.0,1274.5 C 496.8,1274.2 497.8,1282.9 497.5,1273.0 C 497.2,1263.1 497.8,1225.2 497.5,1215.0 C 497.2,1204.8 495.4,1213.1 495.5,1212.0 C 495.6,1210.9 496.7,1209.3 498.0,1208.5 C 499.3,1207.7 502.6,1208.1 503.5,1207.0 C 504.4,1205.9 504.0,1203.8 503.5,1202.0 C 503.0,1200.2 500.2,1198.2 500.5,1196.0 C 500.8,1193.8 503.5,1188.3 505.0,1188.5 C 506.5,1188.7 509.4,1193.9 509.5,1197.0 C 509.6,1200.1 504.8,1204.7 505.5,1207.0 C 506.2,1209.3 512.5,1209.7 513.5,1211.0 C 514.5,1212.3 511.9,1204.4 511.5,1215.0 C 511.1,1225.6 513.1,1264.6 511.0,1274.5 Z',
  },
  {
    targetId: 'ghost',
    aliases: ["ghost", "spirit", "apparition", "spectral ghost"],
    name: "Spectral Ghost Apparition",
    shortName: 'Ghost',
    imageId: 'img_05',
    imageTitle: "The Haunted Mansion",
    difficulty: 'MEDIUM',
    x: 465,
    y: 346,
    width: 83,
    height: 121,
    xPercent: 38.75,
    yPercent: 38.62,
    widthPercent: 6.92,
    heightPercent: 13.5,
    svgPath: 'M 518.0,464.5 C 515.3,465.2 513.2,464.8 512.0,464.5 C 510.8,464.2 511.7,462.5 511.0,462.5 C 510.3,462.5 511.0,464.2 508.0,464.5 C 505.0,464.8 496.7,464.8 493.0,464.5 C 489.3,464.2 488.2,463.9 486.0,462.5 C 483.8,461.1 481.6,459.1 479.5,456.0 C 477.4,452.9 474.8,448.0 473.5,444.0 C 472.2,440.0 471.3,434.3 471.5,432.0 C 471.7,429.7 474.2,430.8 474.5,430.0 C 474.8,429.2 472.8,429.0 473.5,427.0 C 474.2,425.0 478.1,419.8 478.5,418.0 C 478.9,416.2 477.2,416.4 476.0,416.5 C 474.8,416.6 472.2,419.2 471.0,418.5 C 469.8,417.8 468.8,413.6 468.5,412.0 C 468.2,410.4 469.7,409.8 469.5,409.0 C 469.3,408.2 467.5,407.8 467.5,407.0 C 467.5,406.2 469.2,405.5 469.5,404.0 C 469.8,402.5 468.9,399.8 469.5,398.0 C 470.1,396.2 471.5,394.7 473.0,393.5 C 474.5,392.3 477.9,391.6 478.5,391.0 C 479.1,390.4 476.7,390.8 476.5,390.0 C 476.3,389.2 477.7,387.0 477.5,386.0 C 477.3,385.0 475.3,384.3 475.5,384.0 C 475.7,383.7 478.2,384.5 478.5,384.0 C 478.8,383.5 476.4,381.8 477.5,381.0 C 478.6,380.2 484.2,380.2 485.0,379.5 C 485.8,378.8 482.2,378.0 482.5,377.0 C 482.8,376.0 484.9,374.2 487.0,373.5 C 489.1,372.8 493.3,372.3 495.0,372.5 C 496.7,372.7 496.1,374.6 497.0,374.5 C 497.9,374.4 501.6,372.6 500.5,372.0 C 499.4,371.4 491.8,371.5 490.5,371.0 C 489.2,370.5 492.1,370.6 492.5,369.0 C 492.9,367.4 493.4,361.8 493.0,361.5 C 492.6,361.2 491.0,366.5 490.0,367.5 C 489.0,368.5 487.8,367.9 487.0,367.5 C 486.2,367.1 485.7,366.0 485.5,365.0 C 485.3,364.0 485.4,361.8 486.0,361.5 C 486.6,361.2 488.6,363.4 489.0,363.5 C 489.4,363.6 488.1,362.6 488.5,362.0 C 488.9,361.4 492.1,360.8 491.5,360.0 C 490.9,359.2 486.3,358.3 485.0,357.5 C 483.7,356.7 483.0,355.5 483.5,355.0 C 484.0,354.5 486.4,355.2 488.0,354.5 C 489.6,353.8 489.0,351.2 493.0,350.5 C 497.0,349.8 508.5,350.8 512.0,350.5 C 515.5,350.2 512.5,348.7 514.0,348.5 C 515.5,348.3 519.4,348.9 521.0,349.5 C 522.6,350.1 523.4,351.1 523.5,352.0 C 523.6,352.9 521.7,354.2 521.5,355.0 C 521.3,355.8 521.3,355.7 522.5,357.0 C 523.7,358.3 525.5,359.0 528.5,363.0 C 531.5,367.0 537.7,374.7 540.5,381.0 C 543.3,387.3 545.2,393.3 545.5,401.0 C 545.8,408.7 543.4,423.9 542.5,427.0 C 541.6,430.1 540.8,420.2 540.0,419.5 C 539.2,418.8 538.2,424.2 537.5,423.0 C 536.8,421.8 536.8,412.0 536.0,412.5 C 535.2,413.0 533.3,423.5 532.5,426.0 C 531.7,428.5 531.4,427.6 531.0,427.5 C 530.6,427.4 530.4,425.4 530.0,425.5 C 529.6,425.6 528.6,425.4 528.5,428.0 C 528.4,430.6 529.6,438.6 529.5,441.0 C 529.4,443.4 528.6,442.8 528.0,442.5 C 527.4,442.2 526.9,439.2 526.0,439.5 C 525.1,439.8 522.9,442.6 522.5,444.0 C 522.1,445.4 522.6,446.8 523.5,448.0 C 524.4,449.2 526.8,451.1 528.0,451.5 C 529.2,451.9 530.2,449.9 531.0,450.5 C 531.8,451.1 533.0,453.3 532.5,455.0 C 532.0,456.7 530.4,458.9 528.0,460.5 C 525.6,462.1 520.7,463.8 518.0,464.5 Z',
  },
  {
    targetId: 'spider_web',
    aliases: ["spider_web", "spider web", "cobweb", "web"],
    name: "Woven Cobweb",
    shortName: 'Spider Web',
    imageId: 'img_05',
    imageTitle: "The Haunted Mansion",
    difficulty: 'HARD',
    x: 974,
    y: 14,
    width: 161,
    height: 158,
    xPercent: 81.17,
    yPercent: 1.56,
    widthPercent: 13.42,
    heightPercent: 17.63,
    svgPath: 'M 988.0,162.5 C 987.6,141.8 964.2,49.7 986.5,27.0 C 1008.8,4.3 1099.4,26.2 1122.0,26.5 C 1144.6,26.8 1123.8,28.1 1122.0,28.5 C 1120.2,28.9 1113.6,25.9 1111.5,29.0 C 1109.4,32.1 1109.6,43.2 1109.5,47.0 C 1109.4,50.8 1109.4,50.6 1111.0,51.5 C 1112.6,52.4 1117.7,52.0 1119.0,52.5 C 1120.3,53.0 1120.7,54.5 1119.0,54.5 C 1117.3,54.5 1111.2,51.3 1109.0,52.5 C 1106.8,53.7 1106.5,61.7 1106.0,61.5 C 1105.5,61.3 1108.1,53.4 1106.0,51.5 C 1103.9,49.6 1096.4,47.2 1093.5,50.0 C 1090.6,52.8 1087.6,64.2 1088.5,68.0 C 1089.4,71.8 1096.8,72.1 1099.0,72.5 C 1101.2,72.9 1101.2,70.2 1102.0,70.5 C 1102.8,70.8 1102.2,73.2 1104.0,74.5 C 1105.8,75.8 1111.3,77.2 1112.5,78.0 C 1113.7,78.8 1112.8,79.9 1111.0,79.5 C 1109.2,79.1 1104.8,73.8 1102.0,75.5 C 1099.2,77.2 1094.4,89.8 1094.0,89.5 C 1093.6,89.2 1100.5,77.3 1099.5,74.0 C 1098.5,70.7 1091.4,67.6 1088.0,69.5 C 1084.6,71.4 1079.2,85.6 1079.0,85.5 C 1078.8,85.4 1087.3,72.5 1086.5,69.0 C 1085.7,65.5 1077.2,63.2 1074.0,64.5 C 1070.8,65.8 1067.2,76.8 1067.0,76.5 C 1066.8,76.2 1073.1,65.9 1072.5,63.0 C 1071.9,60.1 1063.4,59.2 1063.5,59.0 C 1063.6,58.8 1070.6,63.4 1073.0,61.5 C 1075.4,59.6 1077.8,47.4 1078.0,47.5 C 1078.2,47.6 1073.0,58.7 1074.5,62.0 C 1076.0,65.3 1084.2,69.8 1087.0,67.5 C 1089.8,65.2 1096.8,53.0 1091.0,48.5 C 1085.2,44.0 1059.0,41.3 1052.0,40.5 C 1045.0,39.7 1049.7,43.5 1049.0,43.5 C 1048.3,43.5 1050.2,41.5 1048.0,40.5 C 1045.8,39.5 1038.6,36.8 1036.0,37.5 C 1033.4,38.2 1031.0,42.8 1032.5,45.0 C 1034.0,47.2 1042.4,50.8 1045.0,50.5 C 1047.6,50.2 1047.8,43.6 1048.0,43.5 C 1048.2,43.4 1046.4,48.6 1046.5,50.0 C 1046.6,51.4 1049.5,50.0 1048.5,52.0 C 1047.5,54.0 1041.5,60.0 1040.5,62.0 C 1039.5,64.0 1042.6,63.8 1042.5,64.0 C 1042.4,64.2 1041.2,62.6 1040.0,63.5 C 1038.8,64.4 1035.2,69.6 1035.0,69.5 C 1034.8,69.4 1038.8,64.8 1038.5,63.0 C 1038.2,61.2 1033.4,59.2 1033.5,59.0 C 1033.6,58.8 1037.2,62.7 1039.0,61.5 C 1040.8,60.3 1045.5,54.5 1044.5,52.0 C 1043.5,49.5 1035.7,46.2 1033.0,46.5 C 1030.3,46.8 1028.4,52.1 1028.5,54.0 C 1028.6,55.9 1033.6,57.8 1033.5,58.0 C 1033.4,58.2 1029.4,55.4 1028.0,55.5 C 1026.6,55.6 1025.2,58.6 1025.0,58.5 C 1024.8,58.4 1026.6,55.9 1026.5,55.0 C 1026.4,54.1 1024.3,53.3 1024.5,53.0 C 1024.7,52.7 1026.5,54.2 1027.5,53.0 C 1028.5,51.8 1034.5,48.8 1030.5,46.0 C 1026.5,43.2 1007.7,37.2 1003.5,36.0 C 999.3,34.8 1005.6,38.6 1005.5,39.0 C 1005.4,39.4 1004.2,37.8 1003.0,38.5 C 1001.8,39.2 999.1,41.9 998.5,43.0 C 997.9,44.1 999.8,44.9 999.5,45.0 C 999.2,45.1 997.7,43.3 997.0,43.5 C 996.3,43.7 994.9,43.8 995.5,46.0 C 996.1,48.2 999.2,55.2 1000.5,57.0 C 1001.8,58.8 1003.3,56.3 1003.5,57.0 C 1003.7,57.7 1001.2,58.8 1001.5,61.0 C 1001.8,63.2 1004.2,68.3 1005.5,70.0 C 1006.8,71.7 1009.3,70.5 1009.5,71.0 C 1009.7,71.5 1006.3,71.0 1006.5,73.0 C 1006.7,75.0 1008.5,81.3 1010.5,83.0 C 1012.5,84.7 1018.2,82.1 1018.5,83.0 C 1018.8,83.9 1014.4,87.6 1012.0,88.5 C 1009.6,89.4 1004.2,89.1 1004.0,88.5 C 1003.8,87.9 1010.1,87.2 1010.5,85.0 C 1010.9,82.8 1007.9,76.9 1006.5,75.0 C 1005.1,73.1 1003.5,73.3 1002.0,73.5 C 1000.5,73.7 997.8,73.6 997.5,76.0 C 997.2,78.4 999.5,85.8 1000.5,88.0 C 1001.5,90.2 1003.5,88.3 1003.5,89.0 C 1003.5,89.7 999.7,85.0 1000.5,92.0 C 1001.3,99.0 1004.0,125.2 1008.5,131.0 C 1013.0,136.8 1025.2,129.8 1027.5,127.0 C 1029.8,124.2 1025.3,116.0 1022.0,114.5 C 1018.7,113.0 1007.6,118.2 1007.5,118.0 C 1007.4,117.8 1019.6,115.4 1021.5,113.0 C 1023.4,110.6 1018.8,103.6 1019.0,103.5 C 1019.2,103.4 1020.6,111.6 1023.0,112.5 C 1025.4,113.4 1033.2,108.8 1033.5,109.0 C 1033.8,109.2 1025.2,111.1 1024.5,114.0 C 1023.8,116.9 1025.5,125.7 1029.0,126.5 C 1032.5,127.3 1045.4,118.8 1045.5,119.0 C 1045.6,119.2 1031.5,124.7 1029.5,128.0 C 1027.5,131.3 1030.2,138.0 1033.5,139.0 C 1036.8,140.0 1049.2,133.5 1049.5,134.0 C 1049.8,134.5 1037.2,139.2 1035.5,142.0 C 1033.8,144.8 1039.1,149.2 1039.5,151.0 C 1039.9,152.8 1038.8,153.7 1038.0,152.5 C 1037.2,151.3 1035.8,145.8 1034.5,144.0 C 1033.2,142.2 1030.8,142.8 1030.5,142.0 C 1030.2,141.2 1032.9,141.2 1032.5,139.0 C 1032.1,136.8 1031.8,129.4 1028.0,128.5 C 1024.2,127.6 1012.8,130.6 1010.0,133.5 C 1007.2,136.4 1009.6,143.9 1011.5,146.0 C 1013.4,148.1 1021.3,145.5 1021.5,146.0 C 1021.7,146.5 1013.7,146.8 1012.5,149.0 C 1011.3,151.2 1014.5,157.3 1014.5,159.0 C 1014.5,160.7 1013.2,160.6 1012.5,159.0 C 1011.8,157.4 1013.9,150.8 1010.0,149.5 C 1006.1,148.2 992.7,149.3 989.0,151.5 C 985.3,153.7 988.4,183.2 988.0,162.5 Z',
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
