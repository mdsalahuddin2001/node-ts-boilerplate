import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { getByEmail } from '@/modules/user/service';
import VendorModel from '@/modules/vendor/schema';

passport.use(
  new LocalStrategy(
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await getByEmail(email);
        if (!user) return done(null, false, { message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password' });

        if (user.role === 'user' || user.role === 'admin') {
          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });
        } else if (user.role === 'vendor') {
          const vendor = await VendorModel.findOne({ userId: user.id });
          console.log({ vendor, user });
          if (!vendor || vendor.status !== 'approved')
            return done(null, false, { message: 'Invalid credentials' });
          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            vendor: vendor,
          });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
