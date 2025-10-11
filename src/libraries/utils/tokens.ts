import jwt from 'jsonwebtoken';
import configs from '@/configs';
import ms from 'ms';

type Role = 'user' | 'admin' | 'vendor';
export interface AccessTokenPayload {
  sub: string;
  email: string;
  name?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  name?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export const generateTokens = (user: {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'vendor';
}): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    configs.ACCESS_TOKEN_SECRET,
    {
      expiresIn: configs.ACCESS_TOKEN_EXPIRATION as ms.StringValue,
    }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    configs.REFRESH_TOKEN_SECRET,
    {
      expiresIn: configs.REFRESH_TOKEN_EXPIRATION as ms.StringValue,
    }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, configs.ACCESS_TOKEN_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, configs.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
