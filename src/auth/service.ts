import { BadRequestError } from '@/libraries/error-handling';
import logger from '@/libraries/log/logger';
import { generateTokens, verifyRefreshToken } from '@/libraries/utils/tokens';

/* Login User  */
export const loginUser = (user: {
  id: string;
  email: string;
  name: string;
}): { accessToken: string; refreshToken: string } => {
  const { accessToken, refreshToken } = generateTokens(user);
  // TODOO: save refresh token in DB or cache
  return { accessToken, refreshToken };
};
export const refresh = (token: string): { accessToken: string; refreshToken: string } => {
  try {
    const payload = verifyRefreshToken(token);
    const { accessToken, refreshToken } = generateTokens({
      id: payload.sub,
      email: payload.email,
    });
    // TODOO: save refresh token in DB or cache
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Invalid refresh token', error);
    throw new BadRequestError('Invalid refresh token', 'auth service refreshToken() method');
  }
};
