import { auth } from "@/auth"
import { SignIn, SignOut } from "@/components/auth-components"
import MobileNav from "@/components/MobileNav"

export default async function Header() {
    const session = await auth()

    return (
        <div className="flex items-center mb-6">
            <MobileNav />
            <div className="ml-auto">
                {session?.user ? (
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-700">{session.user.name}</p>
                            <p className="text-xs text-slate-500">{session.user.email}</p>
                        </div>
                        {session.user.image ? (
                            <img src={session.user.image} alt="User" className="w-9 h-9 rounded-full border border-slate-200" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                {session.user.name?.[0]}
                            </div>
                        )}
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                        <SignOut />
                    </div>
                ) : (
                    <div className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                        <SignIn />
                    </div>
                )}
            </div>
        </div>
    )
}
