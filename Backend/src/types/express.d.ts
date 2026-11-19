import type { AuthUser } from '../middleware/authMiddleware.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
