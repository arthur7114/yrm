import type { ReactNode } from 'react'

type AppShellProps = {
    eyebrow?: string
    title: string
    description?: string
    actions?: ReactNode
    children: ReactNode
}

export default function AppShell({ eyebrow, title, description, actions, children }: AppShellProps) {
    return (
        <main className="yrm-shell mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <section className="mb-8 flex flex-col gap-5 border-b border-[var(--yrm-border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-3">
                    {eyebrow ? <p className="yrm-kicker">{eyebrow}</p> : null}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--yrm-ink)] sm:text-4xl">
                            {title}
                        </h1>
                        {description ? (
                            <p className="max-w-2xl text-sm leading-7 text-[var(--yrm-muted)] sm:text-base">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>
                {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
            </section>

            {children}
        </main>
    )
}
