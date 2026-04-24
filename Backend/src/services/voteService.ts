import { env } from '../config/env.js';
import { getDbPool } from '../db/mysql.js';
import { withRcon } from './rconService.js';

function buildVoteRewardCommand(mcUsername: string): string {
  if (!/^[a-zA-Z0-9_]{2,32}$/.test(mcUsername)) {
    throw new Error('mc_username invalide');
  }
  return env.VOTE_REWARD_COMMAND.replace(/\{user\}/g, mcUsername);
}

export async function recordVoteAndReward(args: {
  siteName: string;
  mcUsername: string;
  ip: string | null;
  rawPayload: unknown;
}): Promise<{ inserted: boolean; rconOk: boolean; reason?: string }> {
  const db = await getDbPool();

  // 1. Retrouver l'user_id si un compte Valoria utilise ce pseudo MC.
  const [userRows] = await db.execute('SELECT id FROM users WHERE pseudo = ? LIMIT 1', [args.mcUsername]);
  const userId = Array.isArray(userRows) && userRows.length > 0 ? (userRows[0] as any).id : null;

  // 2. INSERT vote (UNIQUE sur site/pseudo/jour empêche le double crédit).
  try {
    await db.execute(
      `INSERT INTO votes (user_id, mc_username, site_name, callback_ip, raw_payload)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))`,
      [userId, args.mcUsername, args.siteName, args.ip, JSON.stringify(args.rawPayload ?? {})]
    );
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return { inserted: false, rconOk: false, reason: 'already_voted_today' };
    }
    throw error;
  }

  // 3. RCON /fvote add — best effort, on log l'erreur dans la ligne vote.
  const command = buildVoteRewardCommand(args.mcUsername);
  try {
    await withRcon(async (send) => send(command));
    await db.execute(
      `UPDATE votes SET rcon_status = 'sent' WHERE site_name = ? AND mc_username = ? AND voted_day = CURRENT_DATE()`,
      [args.siteName, args.mcUsername]
    );
    console.log(`[vote] site=${args.siteName} user=${args.mcUsername} → counted + rewarded`);
    return { inserted: true, rconOk: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.execute(
      `UPDATE votes SET rcon_status = 'failed', rcon_error = ? WHERE site_name = ? AND mc_username = ? AND voted_day = CURRENT_DATE()`,
      [message.slice(0, 500), args.siteName, args.mcUsername]
    );
    console.log(`[vote] site=${args.siteName} user=${args.mcUsername} → counted but RCON failed: ${message}`);
    return { inserted: true, rconOk: false, reason: `rcon_failed:${message}` };
  }
}

export async function getMonthlyLeaderboard(limit = 100) {
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT mc_username, COUNT(*) as total_votes, MAX(voted_at) as last_vote
     FROM votes
     WHERE voted_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
     GROUP BY mc_username
     ORDER BY total_votes DESC, last_vote ASC
     LIMIT ?`,
    [limit]
  );
  if (!Array.isArray(rows)) return [];
  return (rows as any[]).map((r, i) => ({
    rank: i + 1,
    mcUsername: String(r.mc_username),
    totalVotes: Number(r.total_votes),
    lastVote: r.last_vote,
  }));
}

export async function getUserMonthlyVoteStats(mcUsername: string) {
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT COUNT(*) as total_votes, MAX(voted_at) as last_vote
     FROM votes
     WHERE mc_username = ? AND voted_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
    [mcUsername]
  );
  const row = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null;
  const total = row ? Number(row.total_votes) : 0;

  // Liste des votes du jour pour savoir où il en est sur chaque site.
  const [todayRows] = await db.execute(
    `SELECT site_name, voted_at FROM votes
     WHERE mc_username = ? AND voted_day = CURRENT_DATE()`,
    [mcUsername]
  );
  const todaySites = Array.isArray(todayRows) ? (todayRows as any[]).map((r) => String(r.site_name)) : [];

  return {
    totalVotesMonth: total,
    lastVote: row?.last_vote ?? null,
    todaySites,
  };
}
