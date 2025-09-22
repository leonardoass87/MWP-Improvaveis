'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spin } from 'antd'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona para a página de login
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darker">
      <Spin size="large" />
    </div>
  )
}