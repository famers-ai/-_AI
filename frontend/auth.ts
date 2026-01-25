import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

console.log("DEBUG: Env Check");
console.log("AUTH_GOOGLE_ID exists:", !!process.env.AUTH_GOOGLE_ID);
console.log("AUTH_GOOGLE_SECRET exists:", !!process.env.AUTH_GOOGLE_SECRET);
console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
console.log("Current Host:", process.env.VERCEL_URL || "locahost");

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    debug: true, // 에러 로그를 자세히 보기 위함
    trustHost: true, // Vercel 배포 시 호스트 신뢰 설정 (필수)
    secret: process.env.AUTH_SECRET, // 명시적으로 시크릿 지정
    callbacks: {
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },
    },
})
