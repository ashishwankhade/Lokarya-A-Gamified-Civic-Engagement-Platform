import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import crypto from 'crypto'; 
import dotenv from 'dotenv'; 

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback', // Must match Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists, return them
          return done(null, user);
        }

        // 2. If not, create new user
        // We generate a random password because your schema requires it
        const randomPassword = crypto.randomBytes(20).toString('hex');

        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: randomPassword, 
          role: 'citizen', // Default role
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;