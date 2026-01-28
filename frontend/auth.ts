import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("Sign in callback:", { user, account, profile })
            return true
        },
        async redirect({ url, baseUrl }) {
            console.log("Redirect callback:", { url, baseUrl })
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async session({ session, token }) {
            console.log("Session callback:", { session, token })
            return session
        },
        async jwt({ token, user, account }) {
            console.log("JWT callback:", { token, user, account })
            return token
        }
    },
    pages: {
        signIn: '/',
        error: '/auth/error',
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    // Enable debug logs only in development or if explicitly set
    debug: process.env.NODE_ENV === "development",
})
