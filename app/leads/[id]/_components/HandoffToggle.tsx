'use client'

import { useState, useTransition } from 'react'
import { Bot, User, Loader2 } from 'lucide-react'
import { activateHandoffToggle, revertHandoffToggle } from '../actions'

interface HandoffToggleProps {
  leadId: number
  isHumanHandoff: boolean
}

export default function HandoffToggle({ leadId, isHumanHandoff }: HandoffToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    setError(null)
    startTransition(async () => {
      const action = isHumanHandoff ? revertHandoffToggle : activateHandoffToggle
      const result = await action(leadId)

      if (!result.success) {
        setError(result.message || 'Erro ao alterar o modo de atendimento.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface-strong)] p-4 shadow-sm">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="yrm-kicker">Atendimento</span>
            <span className="text-[11px] text-[var(--yrm-muted)]">
              {isHumanHandoff ? 'Operador humano assumiu' : 'IA monitorando e respondendo'}
            </span>
          </div>
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-[var(--yrm-primary)]" />}
        </div>
        
        <div className="flex p-1 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[var(--yrm-border)]">
          <button
            onClick={() => !isHumanHandoff ? null : handleToggle()}
            disabled={isPending}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all
              ${!isHumanHandoff 
                ? 'bg-[var(--yrm-primary)] text-white shadow-sm' 
                : 'text-[var(--yrm-muted)] hover:text-[var(--yrm-ink)]'}
            `}
          >
            <Bot size={14} />
            Auto IA
          </button>
          
          <button
            onClick={() => isHumanHandoff ? null : handleToggle()}
            disabled={isPending}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all
              ${isHumanHandoff 
                ? 'bg-[var(--yrm-warning)] text-white shadow-sm' 
                : 'text-[var(--yrm-muted)] hover:text-[var(--yrm-ink)]'}
            `}
          >
            <User size={14} />
            Humano
          </button>
        </div>
      </div>

      {error && (
        <p className="px-4 text-center text-xs font-medium text-[var(--yrm-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
