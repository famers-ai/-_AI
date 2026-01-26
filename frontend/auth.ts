import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// 🚨 LAST RESORT DEBUGGING
console.log("---- AUTH DEBUG START ----");
console.log("GOOGLE_ID:", process.env.AUTH_GOOGLE_ID ? "EXISTS" : "MISSING");
console.log("GOOGLE_SECRET:", process.env.AUTH_GOOGLE_SECRET ? "EXISTS" : "MISSING");
console.log("AUTH_SECRET:", process.env.AUTH_SECRET ? "EXISTS" : "MISSING");
console.log("--------------------------");

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID || "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    callbacks: {
        authorized({ auth }) {
            return !!auth
        },
    },
    debug: true, // Force debug logs in Vercel
})
