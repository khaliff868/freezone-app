// NextAuth Configuration
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          throw new Error('Invalid credentials');
        }
        // Check if user is banned
        if (user.banned) {
          throw new Error('Account has been banned');
        }
        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always land on home page after login
      // Allow relative URLs (e.g. from signOut) but never redirect to /listings or any external URL
      if (url.startsWith('/') && url !== '/listings') return baseUrl;
      if (url.startsWith(baseUrl)) return baseUrl;
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tier = user.tier;
      }
      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.tier = session.tier;
      }
      // Fetch latest user data on every request to ensure tier is up-to-date
      if (token.id) {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, tier: true, banned: true },
        });
        if (user) {
          if (user.banned) {
            return { ...token, id: '', role: '', tier: '' };
          }
          token.role = user.role;
          token.tier = user.tier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tier = token.tier as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
