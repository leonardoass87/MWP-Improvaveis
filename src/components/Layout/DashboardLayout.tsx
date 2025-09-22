'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Badge, Divider } from 'antd'
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CrownOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { AuthUser } from '@/types'

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface DashboardLayoutProps {
  children: React.ReactNode
  user: AuthUser
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
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

  const getMenuItems = () => {
    const baseItems = [
      {
        key: `/dashboard/${user.role}`,
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
    ]

    if (user.role === 'admin') {
      baseItems.push(
        {
          key: '/dashboard/admin/users',
          icon: <TeamOutlined />,
          label: 'Usuários',
        },
        {
          key: '/dashboard/admin/checkins',
          icon: <CheckCircleOutlined />,
          label: 'Check-ins',
        }
      )
    } else if (user.role === 'instructor') {
      baseItems.push(
        {
          key: '/dashboard/professor/students',
          icon: <TeamOutlined />,
          label: 'Alunos',
        },
        {
          key: '/dashboard/professor/checkins',
          icon: <CheckCircleOutlined />,
          label: 'Check-ins',
        }
      )
    } else if (user.role === 'student') {
      baseItems.push(
        {
          key: '/dashboard/aluno/checkin',
          icon: <CheckCircleOutlined />,
          label: 'Check-in',
        },
        {
          key: '/dashboard/aluno/students',
          icon: <TeamOutlined />,
          label: 'Alunos',
        }
      )
    }

    return baseItems
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
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
      case 'professor':
        return <StarOutlined className="text-blue-400" />
      default:
        return <UserOutlined className="text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400'
      case 'professor':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={isMobile ? 0 : 80}
        style={{
          position: isMobile ? 'fixed' : 'relative',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header da Sidebar */}
        <div className="h-20 flex items-center justify-center border-b border-gray-600/30 bg-black/20">
          {!collapsed && (
            <div className="text-center">
              <Text className="text-white font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                BJJ Academy
              </Text>
              <div className="text-xs text-gray-300 mt-1">Premium Dashboard</div>
            </div>
          )}
          {collapsed && (
            <div className="text-center">
              <Text className="text-white font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                BJJ
              </Text>
            </div>
          )}
        </div>

        {/* Perfil do Usuário na Sidebar */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-600/30 bg-black/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white/20"
                />
                <div className="absolute -bottom-1 -right-1">
                  {getRoleIcon(user.role)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">
                  {user.name}
                </div>
                <div className={`text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                  {user.role}
                </div>
                {user.belt && (
                  <div className="flex items-center mt-1">
                    <span 
                      className="inline-block w-2 h-2 rounded-full mr-1 border border-white/30"
                      style={{ backgroundColor: getBeltColor(user.belt) }}
                    />
                    <span className="text-xs text-gray-300 capitalize">
                      {user.belt} {user.degree}º grau
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Menu de Navegação */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={getMenuItems()}
            onClick={({ key }) => router.push(key)}
            className="border-none bg-transparent"
            style={{
              background: 'transparent',
            }}
          />
        </div>

        {/* Botão de Logout na Sidebar */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-600/30 bg-black/10">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-400/40 transition-all duration-200"
            >
              Sair da Conta
            </Button>
          </div>
        )}
      </Sider>

      <Layout className={`${isMobile && !collapsed ? 'ml-0' : ''}`}>
        <Header 
          className="px-6 flex items-center justify-between shadow-lg"
          style={{
            background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            height: '70px',
          }}
        >
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-200"
              size="large"
            />
            
            {/* Breadcrumb ou título da página atual */}
            <div className="hidden md:block">
              <Text className="text-white text-lg font-semibold">
                {pathname.includes('admin') ? 'Painel Administrativo' : 
                 pathname.includes('professor') ? 'Painel do Professor' : 
                 pathname.includes('aluno') ? 'Painel do Aluno' : 'Dashboard'}
              </Text>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Indicadores de status ou notificações */}
            <div className="hidden lg:flex items-center space-x-3">
              <Badge count={0} showZero={false}>
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                />
              </Badge>
            </div>
            
            {/* Menu do usuário simplificado */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                icon={<SettingOutlined />}
                className="text-gray-300 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/40"
                size="large"
              />
            </Dropdown>
          </div>
        </Header>

        <Content 
          className="overflow-auto"
          style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
            minHeight: 'calc(100vh - 70px)',
            padding: '24px',
          }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </Content>
      </Layout>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-999"
          onClick={() => setCollapsed(true)}
        />
      )}
    </Layout>
  )
}