import jwt from 'jsonwebtoken';
import configs from '@/configs';
import ms from 'ms';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const generateTokens = (user: {
  id: string;
  email: string;
}): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, configs.ACCESS_TOKEN_SECRET, {
    expiresIn: configs.ACCESS_TOKEN_EXPIRATION as ms.StringValue,
  });

  const refreshToken = jwt.sign({ sub: user.id, email: user.email }, configs.REFRESH_TOKEN_SECRET, {
    expiresIn: configs.REFRESH_TOKEN_EXPIRATION as ms.StringValue,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, configs.ACCESS_TOKEN_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, configs.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
