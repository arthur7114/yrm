'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

export default function Navbar() {
    const pathname = usePathname()

    // Do not show navbar on login page
    if (pathname === '/login') return null

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400 tracking-tight">LeadSystem AI</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/'
                                    ? 'border-indigo-500 text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-white'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/settings"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/settings'
                                    ? 'border-indigo-500 text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-white'
                                    }`}
                            >
                                Configurações
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={() => logout()}
                            className="ml-4 px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
