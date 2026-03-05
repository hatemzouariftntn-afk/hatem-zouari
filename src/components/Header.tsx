'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Header() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">أرشيف المستندات</h1>
            <div className="animate-pulse">جاري التحميل...</div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900">أرشيف المستندات</h1>
          
          {session ? (
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-700">
                مرحباً، {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link
                href="/auth/signin"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm text-green-600 hover:text-green-800"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
