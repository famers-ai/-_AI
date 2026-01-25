export const dynamic = 'force-dynamic';

export default function DebugEnvPage() {
    const envStatus = {
        AUTH_SECRET: process.env.AUTH_SECRET ? "OK (Loaded)" : "MISSING ❌",
        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? "OK (Loaded)" : "MISSING ❌",
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? "OK (Loaded)" : "MISSING ❌",
        AUTH_URL: process.env.AUTH_URL ? process.env.AUTH_URL : "MISSING ❌",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "MISSING ❌",
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL || "N/A"
    };

    return (
        <div style={{ padding: "40px", fontFamily: "monospace", color: "#333" }}>
            <h1>🛠️ Environment Variable Check</h1>
            <pre style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px" }}>
                {JSON.stringify(envStatus, null, 2)}
            </pre>
            <p>
                If any of these say <b>MISSING ❌</b>, the Vercel deployment will NOT work.
            </p>
            <p>
                Also, ensure <b>AUTH_GOOGLE_ID</b> ends with <code>.apps.googleusercontent.com</code>
                and <b>AUTH_GOOGLE_SECRET</b> starts with <code>GOCSPX-</code>.
            </p>
        </div>
    );
}
