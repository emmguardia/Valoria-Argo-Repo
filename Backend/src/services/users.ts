import type { RowDataPacket } from 'mysql2/promise';

// Colonnes d'un compte renvoyées au site, et leur forme JSON (inscription, connexion, profil, admin).
export const USER_COLUMNS = 'id, pseudo, email, ecus, role, mc_uuid, email_verified_at, banned_at, created_at, last_login';

export type UserRow = RowDataPacket & {
  id: number | string; pseudo: string; email: string; ecus: number | null; role: string | null; mc_uuid: string | null;
  email_verified_at: Date | null; banned_at: Date | null; created_at: Date; last_login: Date | null;
};

export function userJson(user: UserRow) {
  return {
    id: String(user.id),
    pseudo: user.pseudo,
    email: user.email,
    ecus: Number(user.ecus ?? 0),
    role: user.role === 'admin' ? 'admin' as const : 'user' as const,
    // Compte Minecraft lié (/lier) : sinon le site invite à le faire (pastille sur le profil)
    linked: Boolean(user.mc_uuid),
    emailVerified: Boolean(user.email_verified_at),
    createdAt: user.created_at,
    lastLogin: user.last_login,
  };
}
