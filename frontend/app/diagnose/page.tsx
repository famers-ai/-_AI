export default function DiagnosePage() {
    const envStatus = {
        ver: "Check v1",
        googleId: process.env.AUTH_GOOGLE_ID ? "EXISTS" : "MISSING",
        googleIdLen: process.env.AUTH_GOOGLE_ID?.length || 0,
        googleSecret: process.env.AUTH_GOOGLE_SECRET ? "EXISTS" : "MISSING",
        authSecret: process.env.AUTH_SECRET ? "EXISTS" : "MISSING",
        apiUrl: process.env.NEXT_PUBLIC_API_URL || "MISSING",
        nodeEnv: process.env.NODE_ENV
    }

    return (
        <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 20 }}>
            <h1>SERVER ENVIRONMENT CHECK</h1>
            <pre>{JSON.stringify(envStatus, null, 2)}</pre>
            <p>If you see MISSING, Vercel is not injecting variables.</p>
        </div>
    )
}
