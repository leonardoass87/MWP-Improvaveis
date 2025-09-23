'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col, Alert, Statistic, Progress } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, TrophyOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { AuthUser, CheckInWithUser, User } from '@/types'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

interface AbsenceStats {
  studentId: number
  studentName: string
  belt: string
  degree: number
  active: boolean
  monthlyStats: {
    approved: number
    pending: number
    rejected: number
    frequency: number
    expectedTrainings: number
  }
  absenceStats: {
    consecutiveAbsences: number
    lastCheckIn: string | null
    daysSinceLastCheckIn: number | null
  }
  status: string
  statusMessage: string
}

export default function AlunoDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInWithUser[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [absenceData, setAbsenceData] = useState<AbsenceStats | null>(null)
  const [checkInAlert, setCheckInAlert] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'student') {
      router.push(`/dashboard/${parsedUser.role}`)
      return
    }

    if (!parsedUser.active) {
      message.error('Usuário desativado. Procure seu professor para reativar.')
      return
    }

    setUser(parsedUser)
    loadData(token)
  }, [router])

  const loadData = async (token: string) => {
    try {
      const userId = JSON.parse(localStorage.getItem('user')!).id

      // Carregar check-ins de hoje
      const today = new Date().toISOString().split('T')[0]
      const checkInsResponse = await fetch(`/api/checkins?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (checkInsResponse.ok) {
        const checkInsData = await checkInsResponse.json()
        setTodayCheckIns(checkInsData)
        
        // Verificar se já fez check-in hoje
        const userCheckIn = checkInsData.find((c: CheckInWithUser) => c.userId === userId)
        setHasCheckedInToday(!!userCheckIn)
      }

      // Carregar dados de faltas do aluno
      const absenceResponse = await fetch(`/api/students/absences?studentId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (absenceResponse.ok) {
        const absenceData = await absenceResponse.json()
        console.log('Dados de faltas carregados:', absenceData)
        setAbsenceData(absenceData)
      } else {
        console.error('Erro ao carregar dados de faltas:', await absenceResponse.text())
      }

      // Carregar lista de alunos e filtrar os que fizeram check-in hoje
      const studentsResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (studentsResponse.ok && checkInsResponse.ok) {
        const studentsData = await studentsResponse.json()
        const checkInsData = await checkInsResponse.json()
        
        // Obter IDs dos alunos que fizeram check-in hoje
        const checkInUserIds = checkInsData.map((checkIn: CheckInWithUser) => checkIn.userId)
        
        // Filtrar apenas alunos que fizeram check-in hoje
        const studentsWithCheckIn = studentsData.filter((user: User) => 
          user.role === 'student' && 
          user.active && 
          checkInUserIds.includes(user.id)
        )
        
        setStudents(studentsWithCheckIn)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      message.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user) return

    setCheckInLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        message.success('Check-in realizado com sucesso! Aguarde aprovação do professor.')
        
        // Verificar alertas de faltas consecutivas
        if (data.alert) {
          setCheckInAlert(data.alert)
          if (data.alert.type === 'warning') {
            message.warning(data.alert.message)
          } else if (data.alert.type === 'critical') {
            message.error(data.alert.message)
          }
        }
        
        setHasCheckedInToday(true)
        loadData(token!)
      } else {
        message.error(data.error || 'Erro ao fazer check-in')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      message.error('Erro de conexão')
    } finally {
      setCheckInLoading(false)
    }
  }

  const getBeltColor = (belt: string) => {
    const colors = {
      branca: 'default',
      azul: 'blue',
      roxa: 'purple',
      marrom: 'orange',
      preta: 'black',
    }
    return colors[belt as keyof typeof colors] || 'default'
  }

  const studentsColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-gray-400" />
          <span className="text-white">{text}</span>
        </div>
      ),
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      render: (belt: string, record: User) => (
        <Tag color={getBeltColor(belt)}>
          {belt} {record.degree}º grau
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
  ]

  const checkInsColumns = [
    {
      title: 'Aluno',
      dataIndex: ['user', 'name'],
      key: 'userName',
      render: (text: string) => (
        <span className="text-white">{text}</span>
      ),
    },
    {
      title: 'Faixa',
      key: 'belt',
      render: (record: CheckInWithUser) => (
        <Tag color={getBeltColor(record.user.belt || 'white')}>
          {record.user.belt} {record.user.degree}º grau
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Pendente' },
          approved: { color: 'green', text: 'Aprovado' },
          rejected: { color: 'red', text: 'Rejeitado' },
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-darker">
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calcular estatísticas baseadas nos dados existentes
  const stats = {
    totalCheckIns: (absenceData?.monthlyStats?.approved || 0) + (absenceData?.monthlyStats?.pending || 0) + (absenceData?.monthlyStats?.rejected || 0),
    approvedCheckIns: absenceData?.monthlyStats?.approved || 0,
    pendingCheckIns: absenceData?.monthlyStats?.pending || 0,
    attendanceRate: absenceData?.monthlyStats?.frequency || 0
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="relative">
          {/* Header com estilo sutil */}
          <div className="relative mb-6 p-5 rounded-xl bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 border border-slate-700/50">
            <div className="relative z-10">
              <Title 
                level={2} 
                className="mb-2 text-white"
                style={{
                  fontSize: '1.875rem',
                  fontWeight: '600',
                  margin: 0,
                  color: '#ffffff'
                }}
              >
                Dashboard do Aluno
              </Title>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <div>
                  <Text 
                    className="text-base"
                    style={{
                      color: '#cbd5e1',
                      fontSize: '1rem',
                      fontWeight: '400'
                    }}
                  >
                    Bem-vindo de volta,{' '}
                    <span 
                      style={{
                        color: '#60a5fa',
                        fontWeight: '500'
                      }}
                    >
                      {user.name}
                    </span>
                    !
                  </Text>
                  <Text 
                    className="text-sm"
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      marginTop: '2px',
                      display: 'block'
                    }}
                  >
                    Acompanhe seus treinos e progresso
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Premium */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} md={8} lg={4} xl={4}>
            <Card 
              className="premium-stat-card"
              style={{ 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
              <Statistic
                title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>Total de Check-ins</span>}
                value={stats.totalCheckIns}
                prefix={<CalendarOutlined style={{ color: '#60a5fa', fontSize: '18px', filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.4))' }} />}
                valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4}>
            <Card 
              className="premium-stat-card"
              style={{ 
                background: 'linear-gradient(135deg, rgba(5, 46, 22, 0.8) 0%, rgba(22, 101, 52, 0.6) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}></div>
              <Statistic
                title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>Aprovados</span>}
                value={stats.approvedCheckIns}
                prefix={<CheckCircleOutlined style={{ color: '#4ade80', fontSize: '18px', filter: 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.4))' }} />}
                valueStyle={{ color: '#4ade80', fontSize: '24px', fontWeight: '700' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4}>
            <Card 
              className="premium-stat-card"
              style={{ 
                background: 'linear-gradient(135deg, rgba(69, 26, 3, 0.8) 0%, rgba(154, 52, 18, 0.6) 100%)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #fb923c, #f97316)' }}></div>
              <Statistic
                title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>Pendentes</span>}
                value={stats.pendingCheckIns}
                prefix={<ClockCircleOutlined style={{ color: '#fb923c', fontSize: '18px', filter: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.4))' }} />}
                valueStyle={{ color: '#fb923c', fontSize: '24px', fontWeight: '700' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4}>
            <Card 
              className="premium-stat-card"
              style={{ 
                background: 'linear-gradient(135deg, rgba(67, 20, 7, 0.8) 0%, rgba(153, 27, 27, 0.6) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}></div>
              <Statistic
                title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>Frequência</span>}
                value={stats.attendanceRate}
                suffix="%"
                prefix={<TrophyOutlined style={{ color: '#fbbf24', fontSize: '18px', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))' }} />}
                valueStyle={{ color: '#fbbf24', fontSize: '24px', fontWeight: '700' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4} xl={4}>
            <Card 
              className="premium-stat-card"
              style={{ 
                background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.8) 0%, rgba(127, 29, 29, 0.6) 100%)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #f87171, #ef4444)' }}></div>
              <Statistic
                title={<span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>Faltas Consecutivas</span>}
                value={absenceData?.absenceStats.consecutiveAbsences || 0}
                prefix={<WarningOutlined style={{ color: '#f87171', fontSize: '18px', filter: 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.4))' }} />}
                valueStyle={{ color: '#f87171', fontSize: '24px', fontWeight: '700' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Check-in Card */}
          <Col xs={24} md={12} lg={12}>
            <Card 
              title={
                <span className="text-white flex items-center">
                  <CheckCircleOutlined className="mr-2" />
                  Check-in Diário
                </span>
              }
              className="bg-discord-dark border-gray-700"
            >
              <div className="text-center">
                {hasCheckedInToday ? (
                  <div>
                    <CheckCircleOutlined className="text-green-500 text-4xl mb-4" />
                    <Title level={4} className="text-green-500 mb-2">
                      Check-in Realizado!
                    </Title>
                    <Text className="text-gray-400">
                      Você já fez check-in hoje. Aguarde a aprovação do professor.
                    </Text>
                  </div>
                ) : (
                  <div>
                    <ClockCircleOutlined className="text-discord-blurple text-4xl mb-4" />
                    <Title level={4} className="text-white mb-4">
                      Fazer Check-in
                    </Title>
                    <Button
                      type="primary"
                      size="large"
                      loading={checkInLoading}
                      onClick={handleCheckIn}
                      className="bg-discord-blurple hover:bg-blue-600 border-none"
                    >
                      Registrar Presença
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </Col>


        </Row>

        <Row gutter={[16, 16]}>
          {/* Check-ins de Hoje */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="text-white">
                  Check-ins de Hoje ({todayCheckIns.length})
                </span>
              }
              className="bg-discord-dark border-gray-700"
            >
              <Table
                dataSource={todayCheckIns}
                columns={checkInsColumns}
                rowKey="id"
                pagination={false}
                size="small"
                className="bg-transparent"
                locale={{ emptyText: 'Nenhum check-in hoje' }}
              />
            </Card>
          </Col>

          {/* Parceiros de Treino */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="text-white">
                  Parceiros de Treino Hoje ({students.length})
                </span>
              }
              className="bg-discord-dark border-gray-700"
            >
              <Table
                dataSource={students}
                columns={studentsColumns}
                rowKey="id"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                size="small"
                className="bg-transparent"
                locale={{ emptyText: 'Nenhum parceiro de treino hoje' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}