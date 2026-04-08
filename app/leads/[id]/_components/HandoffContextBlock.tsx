import { Bot, Brain, Clock, MessageSquare, UserCheck } from 'lucide-react'

import TemperatureBadge from '@/components/ui/TemperatureBadge'
import type { HandoffContext, LeadQualification } from '../actions'

type HandoffContextBlockProps = {
    handoff: HandoffContext
    qualification: LeadQualification | null
    lastLeadMessage: string | null
    systemResponse: string | null
}

export default function HandoffContextBlock({
    handoff,
    qualification,
    lastLeadMessage,
    systemResponse,
}: HandoffContextBlockProps) {
    const handoffDate = new Date(handoff.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="overflow-hidden rounded-2xl border border-[rgba(47,106,85,0.24)] bg-[var(--yrm-surface)] shadow-[var(--yrm-shadow)]">
            <div className="flex items-center gap-2 border-b border-[rgba(47,106,85,0.18)] bg-[var(--yrm-human-soft)] px-6 py-4">
                <UserCheck className="h-5 w-5 text-[var(--yrm-human)]" />
                <div>
                    <p className="yrm-kicker">Handoff</p>
                    <span className="text-sm font-semibold text-[var(--yrm-human)]">Encaminhado ao humano</span>
                </div>
                <span className="ml-auto flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--yrm-human)]">
                    <Clock className="h-3 w-3" />
                    {handoffDate}
                </span>
            </div>

            <div className="space-y-5 p-6">
                <div className="space-y-2">
                    <p className="yrm-kicker">Temperatura no handoff</p>
                    <TemperatureBadge temperature={qualification?.classification} />
                </div>

                {qualification?.confidence_reason ? (
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--yrm-ink)]">
                            <Brain className="h-4 w-4 text-[var(--yrm-muted)]" />
                            Intenção interpretada
                        </h4>
                        <p className="rounded-2xl border border-[var(--yrm-border)] bg-[rgba(252,250,247,0.84)] p-4 text-sm leading-6 text-[var(--yrm-muted)]">
                            {qualification.confidence_reason}
                        </p>
                    </div>
                ) : null}

                {systemResponse ? (
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--yrm-ink)]">
                            <Bot className="h-4 w-4 text-[var(--yrm-muted)]" />
                            Última resposta automática
                        </h4>
                        <p className="rounded-2xl border border-[rgba(184,100,52,0.22)] bg-[rgba(184,100,52,0.08)] p-4 text-sm leading-6 text-[var(--yrm-ink)]">
                            {systemResponse}
                        </p>
                    </div>
                ) : null}

                {lastLeadMessage ? (
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--yrm-ink)]">
                            <MessageSquare className="h-4 w-4 text-[var(--yrm-muted)]" />
                            Última mensagem do lead
                        </h4>
                        <p className="rounded-2xl border border-[var(--yrm-border)] bg-[rgba(252,250,247,0.84)] p-4 text-sm leading-6 text-[var(--yrm-muted)]">
                            {lastLeadMessage}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
