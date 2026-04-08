import { BotIcon, Cog, HeadphonesIcon, UserIcon } from 'lucide-react'

import type { LeadMessage } from '../actions'

export default function MessageTimeline({ messages }: { messages: LeadMessage[] }) {
    if (!messages?.length) {
        return (
            <div className="yrm-panel flex min-h-[22rem] flex-col items-center justify-center rounded-2xl p-12 text-center">
                <div className="mb-4 rounded-full border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] p-4">
                    <UserIcon className="h-8 w-8 text-[var(--yrm-muted)]" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-[var(--yrm-ink)]">Nenhuma mensagem registrada</h3>
                <p className="text-sm leading-6 text-[var(--yrm-muted)]">
                    Este lead ainda não possui histórico disponível na timeline operacional.
                </p>
            </div>
        )
    }

    return (
        <div className="yrm-panel flex min-h-[28rem] flex-col overflow-hidden rounded-[1.75rem]">
            <div className="border-b border-[var(--yrm-border)] bg-[rgba(255,255,255,0.02)] px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--yrm-ink)]">
                    Timeline da conversa
                </h2>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-[rgba(255,255,255,0.02)] p-6">
                {messages.map((message, index) => {
                    const isSystem = message.sender_type === 'system'
                    const isAutomation = message.sender_type === 'automacao' || message.is_automation === true
                    const isHuman = message.sender_type === 'humano' || message.sender_type === 'human'
                    const isBot = isSystem || isAutomation
                    const isRightAligned = isBot || isHuman
                    const showTime = new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    const showDate = new Date(message.created_at).toLocaleDateString('pt-BR')
                    const previousMessage = index > 0 ? messages[index - 1] : null
                    const previousDate = previousMessage
                        ? new Date(previousMessage.created_at).toLocaleDateString('pt-BR')
                        : null
                    const needsDateSeparator = previousDate !== showDate

                    return (
                        <div key={message.id} className="flex flex-col">
                            {needsDateSeparator ? (
                                <div className="my-3 flex items-center justify-center">
                                    <span className="rounded-full border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--yrm-muted)]">
                                        {showDate}
                                    </span>
                                </div>
                            ) : null}

                            <div className={`mb-2 flex w-full ${isRightAligned ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] ${isRightAligned ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex flex-shrink-0 items-end ${isRightAligned ? 'ml-3' : 'mr-3'}`}>
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                                                isAutomation
                                                    ? 'border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] text-[var(--yrm-muted)]'
                                                    : isSystem
                                                      ? 'border-[rgba(255,122,61,0.25)] bg-[rgba(255,122,61,0.12)] text-[var(--yrm-accent-strong)]'
                                                      : isHuman
                                                        ? 'border-[rgba(47,106,85,0.25)] bg-[var(--yrm-human-soft)] text-[var(--yrm-human)]'
                                                        : 'border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] text-[var(--yrm-muted)]'
                                            }`}
                                        >
                                            {isAutomation ? (
                                                <Cog size={18} />
                                            ) : isSystem ? (
                                                <BotIcon size={18} />
                                            ) : isHuman ? (
                                                <HeadphonesIcon size={18} />
                                            ) : (
                                                <UserIcon size={18} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="mb-1 flex flex-wrap gap-2">
                                            {isAutomation ? (
                                                <span className="rounded-full border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--yrm-muted)]">
                                                    Automação
                                                </span>
                                            ) : null}
                                            {isSystem && !isAutomation ? (
                                                <span className="rounded-full border border-[rgba(255,122,61,0.25)] bg-[rgba(255,122,61,0.12)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--yrm-accent-strong)]">
                                                    IA
                                                </span>
                                            ) : null}
                                            {isHuman ? (
                                                <span className="rounded-full border border-[rgba(47,106,85,0.25)] bg-[var(--yrm-human-soft)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--yrm-human)]">
                                                    Humano
                                                </span>
                                            ) : null}
                                            {!isBot && !isHuman ? (
                                                <span className="rounded-full border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--yrm-muted)]">
                                                    Lead
                                                </span>
                                            ) : null}
                                        </div>

                                        <div
                                            className={`rounded-2xl px-4 py-3 ${
                                                isAutomation
                                                    ? 'border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] text-[var(--yrm-ink)]'
                                                    : isSystem
                                                      ? 'bg-[var(--yrm-accent)] text-[#090d14]'
                                                      : isHuman
                                                        ? 'bg-[var(--yrm-human)] text-[#04110d]'
                                                        : 'border border-[var(--yrm-border)] bg-[rgba(255,255,255,0.03)] text-[var(--yrm-ink)]'
                                            }`}
                                        >
                                            <p className="break-words whitespace-pre-wrap text-[15px] leading-relaxed">
                                                {message.message_content}
                                            </p>
                                        </div>

                                        <div
                                            className={`mt-1 flex font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-muted-soft)] ${isRightAligned ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {showTime}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
