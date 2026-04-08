'use client'

import { useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import {
    CheckIcon,
    GripVerticalIcon,
    PencilIcon,
    PlusIcon,
    PowerIcon,
    PowerOffIcon,
    Trash2Icon,
    X,
} from 'lucide-react'

import {
    createQualificationQuestion,
    deleteQualificationQuestion,
    QualificationQuestion,
    updateQualificationQuestion,
    updateQuestionOrdering,
} from '../actions'

export default function QuestionsManager({ initialQuestions }: { initialQuestions: QualificationQuestion[] }) {
    const [questions, setQuestions] = useState(initialQuestions)
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

    useEffect(() => {
        setQuestions(initialQuestions)
    }, [initialQuestions])

    const handleCreate = async (formData: FormData) => {
        setErrorMsg('')
        const res = await createQualificationQuestion(null, formData)
        if (!res.success) {
            setErrorMsg(res.message || 'Erro ao adicionar pergunta.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar esta pergunta?')) return

        setErrorMsg('')
        startTransition(async () => {
            const res = await deleteQualificationQuestion(id)
            if (!res.success) setErrorMsg(res.message || 'Erro ao deletar.')
        })
    }

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        setErrorMsg('')
        startTransition(async () => {
            const res = await updateQualificationQuestion(id, { is_active: !currentStatus })
            if (!res.success) setErrorMsg(res.message || 'Erro ao atualizar status.')
        })
    }

    const startEdit = (question: QualificationQuestion) => {
        setEditingId(question.id)
        setEditValue(question.question_text)
    }

    const saveEdit = async (id: string) => {
        if (!editValue.trim()) {
            setEditingId(null)
            return
        }

        setErrorMsg('')
        startTransition(async () => {
            const res = await updateQualificationQuestion(id, { question_text: editValue })
            if (!res.success) setErrorMsg(res.message || 'Erro ao salvar edição.')
            setEditingId(null)
        })
    }

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index)
        e.dataTransfer.effectAllowed = 'move'
        const target = e.currentTarget
        setTimeout(() => target.classList.add('opacity-50'), 0)
    }

    const onDragEnd = (e: React.DragEvent) => {
        setDraggedIdx(null)
        e.currentTarget.classList.remove('opacity-50')
    }

    const onDragOver = (index: number) => {
        if (draggedIdx === null || draggedIdx === index) return

        const newQuestions = [...questions]
        const draggedItem = newQuestions[draggedIdx]
        newQuestions.splice(draggedIdx, 1)
        newQuestions.splice(index, 0, draggedItem)

        setDraggedIdx(index)
        setQuestions(newQuestions)
    }

    const onDrop = async () => {
        if (draggedIdx === null) return
        const newOrderIds = questions.map((question) => question.id)
        startTransition(async () => {
            const res = await updateQuestionOrdering(newOrderIds)
            if (!res.success) setErrorMsg(res.message || 'Erro ao salvar nova ordem.')
        })
    }

    return (
        <div className="space-y-5">
            {errorMsg ? (
                <div className="rounded-2xl border border-[rgba(178,74,63,0.28)] bg-[var(--yrm-danger-soft)] p-4 text-sm text-[var(--yrm-danger)]">
                    {errorMsg}
                </div>
            ) : null}

            <form action={handleCreate} className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    name="question_text"
                    placeholder="Ex: Qual é a urgência comercial desse lead?"
                    className="flex-1 rounded-xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)] px-4 py-3 text-sm text-[var(--yrm-ink)]"
                    required
                />
                <SubmitBtn />
            </form>

            <div className={`space-y-2 ${isPending ? 'pointer-events-none opacity-60' : ''}`}>
                {questions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--yrm-border-strong)] bg-[rgba(252,250,247,0.84)] p-6 text-sm text-[var(--yrm-muted)]">
                        Nenhuma pergunta cadastrada. Adicione a primeira para compor a qualificação.
                    </div>
                ) : (
                    <ul className="overflow-hidden rounded-2xl border border-[var(--yrm-border)] bg-[var(--yrm-surface)]">
                        {questions.map((question, idx) => (
                            <li
                                key={question.id}
                                className={`flex items-center gap-3 border-b border-[rgba(183,166,148,0.35)] px-4 py-4 last:border-b-0 ${
                                    question.is_active ? '' : 'bg-[rgba(111,101,93,0.08)]'
                                }`}
                                draggable
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragEnd={onDragEnd}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    onDragOver(idx)
                                }}
                                onDrop={onDrop}
                            >
                                <div className="cursor-grab text-[var(--yrm-muted-soft)]">
                                    <GripVerticalIcon className="h-5 w-5" />
                                </div>

                                <div className="min-w-0 flex-1 pr-2">
                                    {editingId === question.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 rounded-xl border border-[var(--yrm-border-strong)] bg-[var(--yrm-surface)] px-3 py-2 text-sm text-[var(--yrm-ink)]"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(question.id)
                                                    if (e.key === 'Escape') setEditingId(null)
                                                }}
                                            />
                                            <button type="button" onClick={() => saveEdit(question.id)} className="rounded-lg p-1 text-[var(--yrm-human)] hover:bg-[var(--yrm-human-soft)]">
                                                <CheckIcon className="h-5 w-5" />
                                            </button>
                                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-1 text-[var(--yrm-muted)] hover:bg-[var(--yrm-surface-strong)]">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className={`text-sm leading-6 ${question.is_active ? 'text-[var(--yrm-ink)]' : 'text-[var(--yrm-muted)] line-through'}`}>
                                            {question.question_text}
                                        </p>
                                    )}
                                </div>

                                <div className="ml-auto flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(question.id, question.is_active)}
                                        className="rounded-lg p-2 text-[var(--yrm-human)] hover:bg-[var(--yrm-human-soft)]"
                                        title={question.is_active ? 'Desativar pergunta' : 'Ativar pergunta'}
                                    >
                                        {question.is_active ? <PowerIcon className="h-4 w-4" /> : <PowerOffIcon className="h-4 w-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(question)}
                                        disabled={editingId !== null}
                                        className="rounded-lg p-2 text-[var(--yrm-cold)] hover:bg-[var(--yrm-cold-soft)] disabled:opacity-50"
                                        title="Editar texto"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(question.id)}
                                        className="rounded-lg p-2 text-[var(--yrm-danger)] hover:bg-[var(--yrm-danger-soft)]"
                                        title="Apagar pergunta"
                                    >
                                        <Trash2Icon className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function SubmitBtn() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--yrm-accent)] bg-[var(--yrm-accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--yrm-accent-strong)] disabled:opacity-50"
        >
            <PlusIcon className="mr-1 h-5 w-5" />
            Adicionar
        </button>
    )
}
