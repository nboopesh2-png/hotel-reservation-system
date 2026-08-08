// Simple auth placeholder - can be replaced with real JWT or NextAuth implementation
import { Request, Response, NextFunction } from 'express';

const auth = {
  optional: (req: Request, res: Response, next: NextFunction) => {
    // In future: parse Authorization header Bearer token and set req.user
    // For now, continue without blocking.
    return next();
  },
  required: (req: Request, res: Response, next: NextFunction) => {
    // TODO: enforce authentication
    return res.status(401).json({ error: 'Authentication not implemented' });
  }
};

export default auth;
