'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

const signUpSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
})

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(false)
    setErrors({})

    try {
      // Validate form data
      const validatedData = signUpSchema.parse(formData)
      
      // Sign in (which creates the user)
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false
      })

      if (result?.error) {
        setErrors({ general: 'فشل إنشاء الحساب. حاول مرة أخرى.' })
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: 'حدث خطأ غير متوقع' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            إنشاء حساب جديد
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            أنشئ حسابك للوصول إلى أرشيف المستندات
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                الاسم الكامل
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                تأكيد كلمة المرور
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                سجل دخولك
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
