import { postgresPool } from '../../database/postgres/pool.ts';

/** Seed a test identity explicitly in the isolated PostgreSQL schema. */
export async function seedPostgresTeamIdentity(teamId: string, teamName: string, passwordHash: string, salt: string): Promise<void> {
  if (!postgresPool) throw new Error('Gameplay route tests require the local PostgreSQL test database.');
  await postgresPool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)', [teamId, teamName, passwordHash, salt]);
}

/** Seed only the PostgreSQL gate state needed by an isolated gameplay API regression test. */
export async function prepareTeamRoundProgression(teamId: string, roundId: number, completedHunts: number[] = []): Promise<void> {
  if (!postgresPool) throw new Error('Gameplay route tests require the local PostgreSQL test database.');
  const initialized = await postgresPool.query('SELECT 1 FROM teams WHERE id=$1', [teamId]);
  if (!initialized.rowCount) throw new Error(`PostgreSQL team identity ${teamId} must be seeded explicitly before progression fixture setup.`);
  await postgresPool.query(`UPDATE round_progress SET status='AVAILABLE', eligible_at=COALESCE(eligible_at, now())
    WHERE team_id=$1 AND round_id=$2`, [teamId, roundId]);
  if (roundId === 3) {
    const lastCompleted = Math.max(0, ...completedHunts);
    await postgresPool.query(`UPDATE team_hunt_progress SET
      status=CASE WHEN hunt_id=ANY($2::smallint[]) THEN 'COMPLETED' WHEN hunt_id=$3 THEN 'AVAILABLE' ELSE 'LOCKED' END,
      completed_at=CASE WHEN hunt_id=ANY($2::smallint[]) THEN COALESCE(completed_at,now()) ELSE NULL END
      WHERE team_id=$1`, [teamId, completedHunts, Math.min(3, lastCompleted + 1)]);
  }
}

export async function removeTeamProgressionFixture(teamId: string): Promise<void> {
  await postgresPool?.query('DELETE FROM teams WHERE id=$1', [teamId]);
}
