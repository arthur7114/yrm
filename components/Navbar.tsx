'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/leads', label: 'Leads' },
    { href: '/settings', label: 'Configuração' },
]

export default function Navbar() {
    const pathname = usePathname()

    if (pathname === '/login') return null

    return (
        <nav className="sticky top-0 z-40 border-b border-[var(--yrm-border)] bg-[rgba(7,11,18,0.86)] backdrop-blur-xl">
            <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex shrink-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--yrm-border-strong)] bg-[var(--yrm-surface-strong)] font-mono text-sm font-semibold tracking-[0.2em] text-[var(--yrm-accent)] shadow-[0_0_0_1px_rgba(255,122,61,0.12)]">
                            YRM
                        </span>
                        <div className="hidden sm:block">
                            <p className="yrm-kicker">Revenue monitor</p>
                            <p className="text-sm font-semibold tracking-[0.02em] text-[var(--yrm-ink)]">
                                Operação de leads
                            </p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 md:flex">
                        {navItems.map((item) => {
                            const isActive =
                                item.href === '/'
                                    ? pathname === '/'
                                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-xl border px-3.5 py-2 text-sm font-medium ${
                                        isActive
                                            ? 'border-[rgba(255,122,61,0.28)] bg-[rgba(255,122,61,0.12)] text-[var(--yrm-accent-strong)] shadow-[inset_0_0_0_1px_rgba(255,122,61,0.16)]'
                                            : 'border-transparent text-[var(--yrm-muted)] hover:border-[var(--yrm-border)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--yrm-ink)]'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden rounded-xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--yrm-muted)] sm:block">
                        fluxo principal
                    </div>
                    <button
                        onClick={() => logout()}
                        className="rounded-xl border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:bg-[var(--yrm-surface-strong)] hover:text-[var(--yrm-ink)]"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </nav>
    )
}
