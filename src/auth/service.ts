import { sendEmail } from '@/libraries/email';
import { welcomeEmail } from '@/libraries/email/auth/welcome';
import { BadRequestError } from '@/libraries/error-handling';
import logger from '@/libraries/log/logger';
import { generateTokens, verifyRefreshToken } from '@/libraries/utils/tokens';
import { withTransaction } from '@/libraries/utils/with-transaction';
import { IUser } from '@/modules/user/schema';
import { create } from '@/modules/user/service';
import VendorModel from '@/modules/vendor/schema';
import UserModel from '@/modules/user/schema';

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
  role: 'user';
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
// Register Vendor
export const registerVendor = async ({
  email,
  name,
  password,
  role,
  shopName,
  description,
  address,
}: {
  email: string;
  name: string;
  password: string;
  role: 'vendor';
  shopName: string;
  description: string;
  address: string;
}): Promise<IUser | null> => {
  return withTransaction(async session => {
    const user = await UserModel.create([{ email, name, password, role }], { session });
    if (!user) {
      logger.error(`registerVendor(): failed to create user`, { email });
      throw new BadRequestError(`failed to create user`, `auth service registerVendor() method`);
    }
    const vendor = new VendorModel({ userId: user[0]._id, shopName, description, address });
    await vendor.save({ session });
    if (!vendor) {
      logger.error(`registerVendor(): failed to create vendor`, { email });
      throw new BadRequestError(`failed to create vendor`, `auth service registerVendor() method`);
    }
    return user;
  });
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
