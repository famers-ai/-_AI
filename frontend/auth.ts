import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    // 🚨 Emergency Fix: Hardcode Prod URL & Trust Host
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    basePath: "/api/auth",
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
    },
})
