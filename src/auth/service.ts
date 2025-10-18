import { sendEmail } from '@/libraries/email';
import { welcomeEmail } from '@/libraries/email/auth/welcome';
import { BadRequestError } from '@/libraries/error-handling';
import logger from '@/libraries/log/logger';
import { generateTokens, verifyRefreshToken } from '@/libraries/utils/tokens';
import { IUser } from '@/modules/user/schema';
import { create } from '@/modules/user/service';

// Register User
export const register = async ({
  email,
  name,
  password,
  role,
}: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}): Promise<IUser | null> => {
  const user = await create({ email, name, password, role });
  if (!user) {
    logger.error(`register(): failed to create user`, { email });
    throw new BadRequestError(`failed to create user`, `auth service register() method`);
  }
  // Send welcome email
  const emailTemplate = welcomeEmail({ name, email });
  await sendEmail({
    to: email,
    ...emailTemplate,
  });
  return user;
};

/* Login User  */
export const loginUser = (user: {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'vendor';
}): { accessToken: string; refreshToken: string } => {
  const { accessToken, refreshToken } = generateTokens(user);
  // TODOO: save refresh token in DB or cache
  return { accessToken, refreshToken };
};

// Refresh Access Token
export const refresh = (token: string): { accessToken: string; refreshToken: string } => {
  try {
    const payload = verifyRefreshToken(token);
    const { accessToken, refreshToken } = generateTokens({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    });
    // TODOO: save refresh token in DB or cache
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Invalid refresh token', error);
    throw new BadRequestError('Invalid refresh token', 'auth service refreshToken() method');
  }
};
