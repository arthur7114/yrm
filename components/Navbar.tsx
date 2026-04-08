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
        <nav className="sticky top-0 z-40 border-b border-[rgba(183,166,148,0.55)] bg-[rgba(248,244,238,0.9)] backdrop-blur">
            <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex shrink-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--yrm-border-strong)] bg-[var(--yrm-surface)] font-mono text-sm font-semibold tracking-[0.2em] text-[var(--yrm-accent-strong)]">
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
                                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                        isActive
                                            ? 'bg-[var(--yrm-surface)] text-[var(--yrm-accent-strong)] shadow-[inset_0_0_0_1px_var(--yrm-border-strong)]'
                                            : 'text-[var(--yrm-muted)] hover:bg-[rgba(252,250,247,0.9)] hover:text-[var(--yrm-ink)]'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden rounded-lg border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--yrm-muted)] sm:block">
                        fluxo principal
                    </div>
                    <button
                        onClick={() => logout()}
                        className="rounded-lg border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-3 py-2 text-sm font-medium text-[var(--yrm-muted)] hover:border-[var(--yrm-border-strong)] hover:text-[var(--yrm-ink)]"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </nav>
    )
}
