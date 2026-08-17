import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ok, created } from '../utils/ApiResponse';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from '../utils/token';
import { logActivity } from '../models/ActivityLog';

function tokensFor(user: { _id: unknown; role: JwtPayload['role']; email: string; employee?: unknown }) {
  const payload: JwtPayload = {
    sub: String(user._id),
    role: user.role,
    email: user.email,
    ...(user.employee ? { employee: String(user.employee) } : {}),
  };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email is already registered');

  // Public self-registration ALWAYS creates an Employee. Any `role` in the
  // request body is ignored — privileged accounts are created by an
  // Administrator via the admin user-management endpoints.
  const user = await User.create({ name, email, password, role: 'Employee' });
  const { accessToken, refreshToken } = tokensFor(user);
  user.refreshTokens.push(refreshToken);
  await user.save();

  await logActivity(user._id, 'user.register', 'User', user._id);

  return created(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  const { accessToken, refreshToken } = tokensFor(user);
  user.refreshTokens.push(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  await logActivity(user._id, 'user.login', 'User', user._id);

  return ok(res, {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw ApiError.unauthorized('Refresh token not recognized');
  }

  // rotate
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  const tokens = tokensFor(user);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  return ok(res, tokens);
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (req.user && refreshToken) {
    await User.updateOne({ _id: req.user.sub }, { $pull: { refreshTokens: refreshToken } });
  }
  return ok(res, { loggedOut: true });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.sub).populate('employee');
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    employee: user.employee,
    lastLoginAt: user.lastLoginAt,
  });
}
