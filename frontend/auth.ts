import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
        })
    ],
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    // Enable debug logs only in development or if explicitly set
    debug: process.env.NODE_ENV === "development",
})
