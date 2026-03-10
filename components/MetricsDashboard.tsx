'use client'

import { BarChart3, Users, Flame, ThermometerSun, Snowflake, MessageSquareText, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface DailyData {
    date: string
    total: number
    quente: number
    morno: number
    frio: number
}

interface MetricsProps {
    totalLeads: number
    hotLeads: number
    warmLeads: number
    coldLeads: number
    unclassifiedLeads: number
    totalMessages: number
    dailyData: DailyData[]
}

const COLORS = {
    quente: '#ef4444',
    morno: '#f59e0b',
    frio: '#3b82f6',
    unclassified: '#6b7280',
}

export default function MetricsDashboard({ metrics }: { metrics: MetricsProps }) {
    const calcPercent = (val: number) => {
        if (metrics.totalLeads === 0) return 0
        return Math.round((val / metrics.totalLeads) * 100)
    }

    const pieData = [
        { name: 'Quentes', value: metrics.hotLeads, color: COLORS.quente },
        { name: 'Mornos', value: metrics.warmLeads, color: COLORS.morno },
        { name: 'Frios', value: metrics.coldLeads, color: COLORS.frio },
        { name: 'Sem classif.', value: metrics.unclassifiedLeads, color: COLORS.unclassified },
    ].filter(d => d.value > 0)

    const hasAnyData = metrics.totalLeads > 0
    const hasTemporalData = metrics.dailyData.some(d => d.total > 0)

    return (
        <div className="mb-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={22} className="text-indigo-500" />
                Visão Geral
            </h2>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Leads */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center space-x-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total de Leads</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalLeads}</h3>
                    </div>
                </div>

                {/* Hot Leads */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center space-x-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
                        <Flame size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quentes</p>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.hotLeads}</h3>
                            <span className="text-xs text-gray-400 dark:text-gray-500">({calcPercent(metrics.hotLeads)}%)</span>
                        </div>
                    </div>
                </div>

                {/* Warm Leads */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center space-x-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 rounded-lg">
                        <ThermometerSun size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mornos</p>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.warmLeads}</h3>
                            <span className="text-xs text-gray-400 dark:text-gray-500">({calcPercent(metrics.warmLeads)}%)</span>
                        </div>
                    </div>
                </div>

                {/* Total Messages */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center space-x-4 transition-all hover:shadow-md">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                        <MessageSquareText size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mensagens</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalMessages}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar Chart — Leads por Dia (takes 2 cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-500" />
                        Leads nos Últimos 14 Dias
                    </h3>
                    {hasTemporalData ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={metrics.dailyData} barGap={2}>
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(17,24,39,0.95)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                    labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                                />
                                <Bar dataKey="quente" stackId="a" fill={COLORS.quente} radius={[0, 0, 0, 0]} name="Quentes" />
                                <Bar dataKey="morno" stackId="a" fill={COLORS.morno} radius={[0, 0, 0, 0]} name="Mornos" />
                                <Bar dataKey="frio" stackId="a" fill={COLORS.frio} radius={[4, 4, 0, 0]} name="Frios" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
                            Nenhum lead nos últimos 14 dias
                        </div>
                    )}
                </div>

                {/* Pie Chart — Distribuição */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Distribuição</h3>
                    {hasAnyData ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    iconSize={10}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(17,24,39,0.95)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
                            Sem dados para exibir
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Snowflake className="text-blue-400" size={18} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Leads Frios</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                        {metrics.coldLeads}
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">({calcPercent(metrics.coldLeads)}%)</span>
                    </span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <BarChart3 className="text-gray-400" size={18} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Aguardando Classificação</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{metrics.unclassifiedLeads}</span>
                </div>
            </div>
        </div>
    )
}
