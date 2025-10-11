import { CookieOptions, Response } from 'express';

const setAuthCookies = (
  res: Response,
  { accessToken, refreshToken }: { accessToken: string; refreshToken: string }
): void => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
const clearAuthCookies = (res: Response): void => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
};

export { setAuthCookies, clearAuthCookies };
