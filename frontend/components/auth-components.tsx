
import { signIn, signOut } from "@/auth"

export function SignIn() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("google")
            }}
        >
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
                Sign in with Google
            </button>
        </form>
    )
}

export function SignOut() {
    return (
        <form
            action={async () => {
                "use server"
                await signOut()
            }}
        >
            <button className="text-sm text-slate-500 hover:text-red-500 font-medium">
                Sign Out
            </button>
        </form>
    )
}
