'use client'

import { useState, useTransition, useEffect } from 'react'
import {
    createQualificationQuestion,
    updateQualificationQuestion,
    deleteQualificationQuestion,
    updateQuestionOrdering,
    QualificationQuestion
} from '../actions'
// @ts-ignore
import { useFormStatus } from 'react-dom'
import { GripVerticalIcon, PlusIcon, Trash2Icon, PencilIcon, CheckIcon, X, PowerIcon, PowerOffIcon } from 'lucide-react'

// Simple drag and drop using HTML5 native APIs for simplicity
// For production, libraries like dnd-kit are better but this keeps it clean.

export default function QuestionsManager({ initialQuestions }: { initialQuestions: QualificationQuestion[] }) {
    const [questions, setQuestions] = useState(initialQuestions)
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    // Drag state
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

    // Sync if initial props change (Next.js server action revalidation)
    useEffect(() => {
        setQuestions(initialQuestions)
    }, [initialQuestions])

    const handleCreate = async (formData: FormData) => {
        setErrorMsg('')
        const res = await createQualificationQuestion(null, formData)
        if (!res.success) {
            setErrorMsg(res.message || 'Erro ao adicionar pergunta.')
        }
        // Form is reset naturally or by revalidation depending on setup
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar esta pergunta? Essa ação não pode ser desfeita.')) return

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

    const startEdit = (q: QualificationQuestion) => {
        setEditingId(q.id)
        setEditValue(q.question_text)
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

    // --- Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index)
        e.dataTransfer.effectAllowed = 'move'
        // Subtle opacity to dragged item
        const target = e.target as HTMLElement
        if (target instanceof HTMLElement) {
            setTimeout(() => target.classList.add('opacity-50'), 0)
        }
    }

    const onDragEnd = (e: React.DragEvent) => {
        setDraggedIdx(null)
        if (e.target instanceof HTMLElement) {
            e.target.classList.remove('opacity-50')
        }
    }

    const onDragOver = (index: number) => {
        if (draggedIdx === null || draggedIdx === index) return

        const newQuestions = [...questions]
        const draggedItem = newQuestions[draggedIdx]

        // Remove item from origin and insert at target
        newQuestions.splice(draggedIdx, 1)
        newQuestions.splice(index, 0, draggedItem)

        setDraggedIdx(index)
        setQuestions(newQuestions)
    }

    const onDrop = async () => {
        if (draggedIdx === null) return

        // Save new order to backend
        const newOrderIds = questions.map(q => q.id)
        startTransition(async () => {
            const res = await updateQuestionOrdering(newOrderIds)
            if (!res.success) setErrorMsg(res.message || 'Erro ao salvar nova ordem.')
        })
    }

    return (
        <section className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
            <div className="mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">3. Perguntas de Qualificação</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Crie perguntas simples e objetivas para a IA utilizar ao qualificar e coletar dados do lead. Arraste para reordenar.
                </p>
            </div>

            {errorMsg && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                </div>
            )}

            {/* Add New Form */}
            <form action={handleCreate} className="mb-6">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        name="question_text"
                        placeholder="Ex: Qual é a sua principal métrica de sucesso para este projeto?"
                        className="flex-1 appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                    <SubmitBtn />
                </div>
            </form>

            {/* Questions List */}
            <div className={`space-y-2 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
                {questions.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                        <p className="text-sm text-gray-500">Nenhuma pergunta cadastrada. Comece adicionando uma acima.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                        {questions.map((q, idx) => (
                            <li
                                key={q.id}
                                className={`flex items-center p-3 sm:px-4 sm:py-3 bg-white transition-colors hover:bg-gray-50
                                    ${q.is_active ? '' : 'bg-gray-100'}`}
                                draggable
                                onDragStart={(e) => onDragStart(e, idx)}
                                onDragEnd={onDragEnd}
                                onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }}
                                onDrop={onDrop}
                            >
                                <div className="flex items-center h-full mr-3 cursor-grab text-gray-400 hover:text-gray-600">
                                    <GripVerticalIcon className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0 pr-4">
                                    {editingId === q.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="flex-1 block w-full px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(q.id)
                                                    if (e.key === 'Escape') setEditingId(null)
                                                }}
                                            />
                                            <button type="button" onClick={() => saveEdit(q.id)} className="text-green-600 hover:text-green-800 p-1">
                                                <CheckIcon className="h-5 w-5" />
                                            </button>
                                            <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className={`text-sm font-medium ${q.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                                            {q.question_text}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-auto shrink-0">
                                    {/* Toggle Active Status */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(q.id, q.is_active)}
                                        className={`p-1.5 rounded-md ${q.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'} transition-colors`}
                                        title={q.is_active ? "Desativar pergunta" : "Ativar pergunta"}
                                    >
                                        {q.is_active ? <PowerIcon className="h-4 w-4" /> : <PowerOffIcon className="h-4 w-4" />}
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                        type="button"
                                        onClick={() => startEdit(q)}
                                        disabled={editingId !== null}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                                        title="Editar texto"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(q.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        </section>
    )
}

function SubmitBtn() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
            <PlusIcon className="h-5 w-5 mr-1" />
            <span>Adicionar</span>
        </button>
    )
}
