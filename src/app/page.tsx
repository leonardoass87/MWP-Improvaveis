'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spin } from 'antd'

export default function Home() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        
        if (token && user) {
          const userData = JSON.parse(user)
          
          // Mapear roles em inglês para rotas em português
          const roleToRoute = {
            'student': 'aluno',
            'instructor': 'professor',
            'admin': 'admin'
          }
          
          const route = roleToRoute[userData.role as keyof typeof roleToRoute] || userData.role
          setIsRedirecting(true)
          router.replace(`/dashboard/${route}`)
        } else {
          setIsRedirecting(true)
          router.replace('/login')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsRedirecting(true)
        router.replace('/login')
      }
    }

    // Pequeno delay para evitar problemas de hidratação
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darker">
      <Spin size="large" />
      {isRedirecting && (
        <div className="ml-4 text-white">
          Redirecionando...
        </div>
      )}
    </div>
  )
}