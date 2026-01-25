import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// 🔍 디버깅용: 환경 변수 강제 확인 로직
const requiredVars = [
    { key: "AUTH_GOOGLE_ID", val: process.env.AUTH_GOOGLE_ID },
    { key: "AUTH_GOOGLE_SECRET", val: process.env.AUTH_GOOGLE_SECRET },
    { key: "AUTH_SECRET", val: process.env.AUTH_SECRET }
];

const missing = requiredVars.filter(v => !v.val).map(v => v.key);

if (missing.length > 0) {
    // 에러 발생 시 Vercel Logs에 명확히 찍힘
    console.error(`🚨 CRITICAL ERROR: Missing Env Vars: ${missing.join(", ")}`);
    throw new Error(`🚨 CRITICAL ERROR: Missing Env Vars: ${missing.join(", ")}`);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    debug: true,
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
    },
})
