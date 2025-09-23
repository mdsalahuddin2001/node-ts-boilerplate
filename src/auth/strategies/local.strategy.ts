import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { getByEmail } from '@/domains/user/service';

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

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
