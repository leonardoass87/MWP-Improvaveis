'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InstructorRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar instrutor para dashboard professor
    router.replace('/dashboard/professor')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecionando...</p>
      </div>
    </div>
  )
}