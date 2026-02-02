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
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days - farmers stay logged in longer
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("Sign in callback:", { user, account, profile })

            // Create or update user in backend database
            // Use a timeout to prevent blocking the sign-in flow
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

                // Create abort controller with 5 second timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)

                const response = await fetch(`${API_URL}/users/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        provider: account?.provider,
                        provider_id: account?.providerAccountId
                    }),
                    signal: controller.signal
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    console.error("Failed to sync user with backend:", await response.text())
                    // Don't block sign-in even if backend sync fails
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    console.error("Backend sync timed out - continuing with sign-in")
                } else {
                    console.error("Error syncing user with backend:", error)
                }
                // Don't block sign-in even if backend sync fails
            }

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
