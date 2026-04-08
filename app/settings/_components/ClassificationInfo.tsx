import { Flame, SparklesIcon, SnowflakeIcon } from 'lucide-react'

const cards = [
    {
        title: 'Lead frio',
        description:
            'Ainda está em descoberta. Existe interesse inicial, mas sem definição clara de dor, escopo ou momento de compra.',
        icon: SnowflakeIcon,
        tone:
            'border-[rgba(78,122,148,0.28)] bg-[var(--yrm-cold-soft)] text-[var(--yrm-cold)]',
    },
    {
        title: 'Lead morno',
        description:
            'Tem fit com a solução, compara caminhos e precisa de clareza sobre proposta, escopo ou timing.',
        icon: SparklesIcon,
        tone:
            'border-[rgba(201,133,29,0.3)] bg-[var(--yrm-warm-soft)] text-[var(--yrm-warm)]',
    },
    {
        title: 'Lead quente',
        description:
            'Chegou perto da decisão. Existe urgência, orçamento ou intenção clara de seguir para a próxima etapa comercial.',
        icon: Flame,
        tone:
            'border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] text-[var(--yrm-danger)]',
    },
]

export default function ClassificationInfo() {
    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {cards.map((card) => (
                <article key={card.title} className={`rounded-2xl border p-5 ${card.tone}`}>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl border border-current/20 bg-white/50 p-2">
                            <card.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em]">{card.title}</h3>
                    </div>
                    <p className="text-sm leading-6">{card.description}</p>
                </article>
            ))}
        </div>
    )
}
