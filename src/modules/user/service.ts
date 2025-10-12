import { BadRequestError } from '@/libraries/error-handling';
import logger from '../../libraries/log/logger';
import Model, { IUser } from './schema';
import { welcomeEmail } from '@/libraries/email/auth/welcome';
import { sendEmail } from '@/libraries/email';

const model: string = 'User';
// Create User
const create = async ({
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
  const item = await Model.findOne({ email });
  if (item) {
    logger.error(`create(): ${model} already exists`, { email });
    throw new BadRequestError(`${model} already exists`, `user service create() method`);
  }
  const newItem = await Model.create({ email, name, password, role });
  // Send welcome email
  const emailTemplate = welcomeEmail({ name, email });
  await sendEmail({
    to: email,
    ...emailTemplate,
  });
  logger.info(`create(): ${model} created`, { email });
  return newItem;
};

//
const getByEmail = async (email: string): Promise<IUser | null> => {
  const item = await Model.findOne({ email });
  if (!item) {
    logger.info(`getByEmail(): ${model} not found`, { email });
    return null;
  }
  logger.info(`getByEmail(): ${model} fetched`, { email });
  return item;
};

export { create, getByEmail };
