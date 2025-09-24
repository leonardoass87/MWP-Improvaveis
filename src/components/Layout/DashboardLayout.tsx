'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, App } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  MenuOutlined,
  TrophyOutlined,
  CrownOutlined,
  StarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { AuthUser } from '@/types'
import ProfileModal from '@/components/Profile/ProfileModal'

const { Sider, Content } = Layout

interface DashboardLayoutProps {
  children: React.ReactNode
  user: AuthUser
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const { message } = App.useApp()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser>(user)
  const [version, setVersion] = useState('v0.2.0')
  const router = useRouter()
  const pathname = usePathname()

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error)
    }
  }

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version')
        const data = await response.json()
        setVersion(data.version)
      } catch (error) {
        console.error('Erro ao buscar versão:', error)
      }
    }

    fetchVersion()
    refreshUserData()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleUpdateUser = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser)
  }

  const handleOpenProfile = () => {
    setProfileModalVisible(true)
  }

  const getMenuItems = () => {
    const roleToRoute = {
      admin: '/dashboard/admin',
      instructor: '/dashboard/professor',
      student: '/dashboard/aluno'
    }

    const items = [
      {
        key: roleToRoute[user.role as keyof typeof roleToRoute] || '/dashboard/aluno',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      }
    ]

    if (user.role === 'admin') {
      items.push({
        key: '/dashboard/admin/usuarios',
        icon: <UserOutlined />,
        label: 'Usuários',
      })
    } else if (user.role === 'instructor') {
      items.push({
        key: '/dashboard/professor/alunos',
        icon: <UserOutlined />,
        label: 'Alunos',
      })
    } else if (user.role === 'student') {
      items.push({
        key: '/dashboard/aluno/ranking',
        icon: <TrophyOutlined />,
        label: 'Ranking',
      })
    }

    return items
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <EditOutlined />,
      label: 'Editar Perfil',
      onClick: handleOpenProfile,
    },
  ]

  const getBeltColor = (belt: string) => {
    const colors = {
      branca: '#ffffff',
      azul: '#1890ff',
      roxa: '#722ed1',
      marrom: '#8b4513',
      preta: '#000000',
    }
    return colors[belt as keyof typeof colors] || '#ffffff'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined className="text-yellow-400" />
      case 'instructor':
        return <StarOutlined className="text-blue-400" />
      default:
        return <UserOutlined className="text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400'
      case 'instructor':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Layout className="min-h-screen">
      {/* Sidebar apenas para desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible={false}
          width={280}
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header do usuário */}
          <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <Avatar 
                size={56} 
                src={currentUser?.avatar} 
                className="border-2 border-white/20 flex-shrink-0"
              >
                {currentUser?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">
                  {currentUser?.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleIcon(currentUser?.role || '')}
                  <span className={`text-sm font-medium ${getRoleColor(currentUser?.role || '')}`}>
                    {currentUser?.role === 'admin' ? 'Administrador' : 
                     currentUser?.role === 'instructor' ? 'Professor' : 'Aluno'}
                  </span>
                </div>
                {currentUser.role === 'student' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div 
                      className="w-4 h-2 rounded-sm border border-white/30"
                      style={{ backgroundColor: getBeltColor(currentUser.belt || 'branca') }}
                    />
                    <span className="text-gray-300 text-sm capitalize">
                      Faixa {currentUser.belt || 'branca'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de navegação */}
          <div className="flex-1 overflow-y-auto">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              items={getMenuItems()}
              onClick={({ key }) => router.push(key)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '16px',
                height: '100%',
              }}
              className="mt-4 px-2"
            />
          </div>

          {/* Footer com botões de ação */}
          <div className="p-4 border-t border-gray-700/50 flex-shrink-0 space-y-2">
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="topRight"
              trigger={['click']}
            >
              <Button
                type="text"
                className="w-full text-left text-white hover:text-blue-300 hover:bg-blue-500/10 rounded-lg px-3 py-2.5 h-auto flex items-center space-x-3 transition-all duration-200"
              >
                <EditOutlined className="text-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Editar Perfil</div>
                  <div className="text-xs text-gray-400">Configurações</div>
                </div>
              </Button>
            </Dropdown>
            
            {/* Botão de Logout */}
            <Button
              type="text"
              onClick={handleLogout}
              className="w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-2.5 h-auto flex items-center space-x-3 transition-all duration-200"
            >
              <LogoutOutlined className="text-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Sair</div>
                <div className="text-xs text-gray-400">Fazer logout</div>
              </div>
            </Button>
            
            {/* Versão */}
            <div className="text-center text-gray-500 text-xs mt-3 pt-2 border-t border-gray-700/30">
              Versão {version}
            </div>
          </div>
        </Sider>
      )}

      {/* Menu mobile */}
      {isMobile && (
        <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-600/50 p-4 flex justify-between items-center">
          <h1 className="text-white font-semibold text-lg">Menu</h1>
          <div>
          <Dropdown
            open={mobileMenuVisible}
            onOpenChange={setMobileMenuVisible}
            placement="bottomRight"
            popupRender={() => (
              <div className="bg-black/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl p-0 min-w-[280px] overflow-hidden">
                <div className="p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-black">
                  <div className="flex items-center space-x-4">
                    <Avatar 
                      size={56} 
                      src={currentUser?.avatar} 
                      className="border-2 border-white/20"
                    >
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {currentUser?.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleIcon(currentUser?.role || '')}
                        <span className={`text-sm font-medium ${getRoleColor(currentUser?.role || '')}`}>
                          {currentUser?.role === 'admin' ? 'Administrador' : 
                           currentUser?.role === 'instructor' ? 'Professor' : 'Aluno'}
                        </span>
                      </div>
                      {currentUser?.belt && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div 
                            className="w-4 h-2 rounded-sm border border-white/30"
                            style={{ backgroundColor: getBeltColor(currentUser.belt) }}
                          />
                          <span className="text-gray-300 text-sm capitalize">
                            Faixa {currentUser.belt}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2 bg-gray-900/60 backdrop-blur-sm">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                    Navegação
                  </div>
                  
                  <Button
                    type="text"
                    icon={<DashboardOutlined />}
                    onClick={() => {
                      const roleToRoute = {
                        admin: '/dashboard/admin',
                        instructor: '/dashboard/professor',
                        student: '/dashboard/aluno'
                      }
                      const route = roleToRoute[currentUser?.role as keyof typeof roleToRoute] || '/dashboard/aluno'
                      router.push(route)
                      setMobileMenuVisible(false)
                    }}
                    className="w-full text-left text-white hover:text-gray-200 hover:bg-gray-800/50 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                  >
                    <span>Dashboard</span>
                  </Button>
                  
                  {currentUser?.role === 'student' && (
                    <Button
                      type="text"
                      icon={<TrophyOutlined />}
                      onClick={() => {
                        router.push('/dashboard/aluno/ranking')
                        setMobileMenuVisible(false)
                      }}
                      className="w-full text-left text-white hover:text-gray-200 hover:bg-gray-800/50 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                    >
                      <span>Ranking</span>
                    </Button>
                  )}
                  
                  {currentUser?.role === 'instructor' && (
                    <Button
                      type="text"
                      icon={<UserOutlined />}
                      onClick={() => {
                        router.push('/dashboard/professor/alunos')
                        setMobileMenuVisible(false)
                      }}
                      className="w-full text-left text-white hover:text-gray-200 hover:bg-gray-800/50 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                    >
                      <span>Alunos</span>
                    </Button>
                  )}
                  
                  {currentUser?.role === 'admin' && (
                    <Button
                      type="text"
                      icon={<UserOutlined />}
                      onClick={() => {
                        router.push('/dashboard/admin/usuarios')
                        setMobileMenuVisible(false)
                      }}
                      className="w-full text-left text-white hover:text-gray-200 hover:bg-gray-800/50 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                    >
                      <span>Usuários</span>
                    </Button>
                  )}
                </div>

                <div className="p-4 border-t border-gray-700/50 space-y-2 bg-gray-900/60 backdrop-blur-sm">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                    Ações
                  </div>
                  
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      handleOpenProfile()
                      setMobileMenuVisible(false)
                    }}
                    className="w-full text-left text-white hover:text-gray-200 hover:bg-gray-800/50 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                  >
                    <span>Editar Perfil</span>
                  </Button>
                  
                  <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      handleLogout()
                      setMobileMenuVisible(false)
                    }}
                    className="w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-2 h-auto flex items-center space-x-3 transition-all duration-200"
                  >
                    <span>Sair da Conta</span>
                  </Button>
                  
                  {/* Versão do Sistema */}
                  <div className="mt-4 pt-3 border-t border-gray-700/50">
                    <div className="px-3 py-2 flex items-center justify-center space-x-2">
                      <InfoCircleOutlined className="text-gray-500 text-xs" />
                      <span className="text-gray-400 text-xs font-medium">
                        Versão {version}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            trigger={['click']}
          >
            <Button
              type="text"
              className="text-white hover:text-blue-300 hover:bg-blue-500/10 rounded-lg px-2 py-2 h-auto flex items-center space-x-2 transition-all duration-200"
            >
              <MenuOutlined className="text-lg" />
            </Button>
          </Dropdown>
          </div>
        </div>
      )}

      <Content
        style={{
          padding: isMobile ? '16px' : '32px 40px',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          minHeight: '100vh',
          overflow: 'auto',
        }}
        className={isMobile ? '' : 'max-w-none'}
      >
        <div className={isMobile ? '' : 'max-w-7xl mx-auto'}>
          {children}
        </div>
      </Content>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={currentUser}
        onUpdate={handleUpdateUser}
      />
    </Layout>
  )
}