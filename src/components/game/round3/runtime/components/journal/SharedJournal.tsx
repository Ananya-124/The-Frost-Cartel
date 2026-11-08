import type { ClueRecord } from '../../types';
import styles from '../canvas/Game.module.css';

interface SharedJournalProps {
  entries: readonly ClueRecord[];
  className?: string;
}

/** The one investigation journal; both players see the same entries. */
export default function SharedJournal({ entries, className }: SharedJournalProps) {
  return (
    <div className={[styles.journal, className].filter(Boolean).join(' ')}>
      <h3>SHARED JOURNAL · {entries.length}</h3>
      {entries.length === 0 && <div>Nothing yet. Search the rooms.</div>}
      {[...entries].reverse().map((e, i) => (
        <div className={styles.entry} key={e.id ?? `${entries.length - i}-${e.title}`}>
          <b>{e.title}</b>
          <div>{e.text}</div>
          <small>
            {e.discoveredBy} · {e.timeline === 'future' ? 'Future' : 'Past'} · Hunt {e.huntIndex + 1}{' '}
            · {e.timestamp}
          </small>
        </div>
      ))}
    </div>
  );
}
