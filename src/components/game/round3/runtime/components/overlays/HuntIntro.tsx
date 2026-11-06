import type { HuntIntroView } from '../../engine/state/snapshot';
import styles from './Overlays.module.css';

export default function HuntIntro({ intro }: { intro: HuntIntroView }) {
  return (
    <div className={styles.intro}>
      <div className={styles.numeral}>HUNT {intro.numeral}</div>
      <h2 className={styles.introTitle}>{intro.title}</h2>
      <p className={styles.premise}>{intro.premise}</p>
    </div>
  );
}
