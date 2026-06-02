import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createAdminClient } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const supabase = createAdminClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        if (error || !data.user) return null
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        return {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.full_name,
          image: profile?.avatar_url,
          role: profile?.role ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // On Google sign-in, upsert profile with null role (pending)
      if (account?.provider === 'google') {
        const supabase = createAdminClient()
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        if (!existing) {
          await supabase.from('profiles').insert({
            id: user.id,
            role: null,
            full_name: user.name ?? '',
            avatar_url: user.image ?? '',
          })
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? null
      }
      // Re-fetch role on every session update (so role assignment takes effect)
      if (token.id && (trigger === 'update' || !token.role)) {
        const supabase = createAdminClient()
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', token.id)
          .single()
        token.role = data?.role ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: { strategy: 'jwt' },
}

export default NextAuth(authOptions)
