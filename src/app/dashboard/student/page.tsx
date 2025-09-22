'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col, Statistic, Progress, Alert } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, TrophyOutlined, LoadingOutlined } from '@ant-design/icons'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'

const { Title, Text } = Typography

interface CheckIn {
  id: number
  date: string
  time: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  createdAt?: string
}

interface PendingCheckIn {
  id: number
  startTime: number
  timeRemaining: number
}

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null)
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    approvedCheckIns: 0,
    pendingCheckIns: 0,
    attendanceRate: 0
  })
  const router = useRouter()

  // Timer para check-in pendente
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (pendingCheckIn) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - pendingCheckIn.startTime
        const remaining = Math.max(0, 1200000 - elapsed) // 20 minutos = 1200000ms

        if (remaining === 0) {
          // Timer expirou
          setPendingCheckIn(null)
          message.warning('Tempo limite para aprovação expirado. Faça um novo check-in se necessário.')
        } else {
          setPendingCheckIn(prev => prev ? { ...prev, timeRemaining: remaining } : null)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pendingCheckIn])

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

    setUser(parsedUser)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      // Inicializar com dados vazios (em produção seria carregado da API)
      const checkInsData: CheckIn[] = []

      setCheckIns(checkInsData)
      
      // Verificar se já fez check-in hoje
      const today = new Date().toISOString().split('T')[0]
      const todayCheckIn = checkInsData.find(c => c.date === today)
      setHasCheckedInToday(!!todayCheckIn)

      // Verificar se há check-in pendente no localStorage
      const savedPendingCheckIn = localStorage.getItem('pendingCheckIn')
      if (savedPendingCheckIn) {
        const parsed = JSON.parse(savedPendingCheckIn)
        const now = Date.now()
        const elapsed = now - parsed.startTime
        
        if (elapsed < 1200000) { // Ainda dentro dos 20 minutos
          setPendingCheckIn({
            ...parsed,
            timeRemaining: 1200000 - elapsed
          })
          setHasCheckedInToday(true)
        } else {
          localStorage.removeItem('pendingCheckIn')
        }
      }

      // Calcular estatísticas
      const totalCheckIns = checkInsData.length
      const approvedCheckIns = checkInsData.filter(c => c.status === 'approved').length
      const pendingCheckIns = checkInsData.filter(c => c.status === 'pending').length
      const attendanceRate = totalCheckIns > 0 ? (approvedCheckIns / totalCheckIns) * 100 : 0

      setStats({
        totalCheckIns,
        approvedCheckIns,
        pendingCheckIns,
        attendanceRate
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      message.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setCheckInLoading(true)
    try {
      const now = Date.now()
      const newPendingCheckIn: PendingCheckIn = {
        id: Date.now(),
        startTime: now,
        timeRemaining: 1200000 // 20 minutos
      }

      // Salvar no localStorage para persistir durante reloads
      localStorage.setItem('pendingCheckIn', JSON.stringify(newPendingCheckIn))
      
      setPendingCheckIn(newPendingCheckIn)
      setHasCheckedInToday(true)

      // Simular envio para o professor (em produção seria uma API)
      const pendingCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
      const newCheckInForProfessor = {
        id: Date.now(),
        studentName: user?.name || 'Aluno',
        studentEmail: user?.email || '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        createdAt: new Date().toISOString()
      }
      
      pendingCheckIns.push(newCheckInForProfessor)
      localStorage.setItem('pendingCheckInsForProfessor', JSON.stringify(pendingCheckIns))

      message.success('Check-in realizado! Aguardando aprovação do professor (20 minutos).')
    } catch (error) {
      console.error('Erro no check-in:', error)
      message.error('Erro ao realizar check-in')
    } finally {
      setCheckInLoading(false)
    }
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimerProgress = () => {
    if (!pendingCheckIn) return 0
    return ((1200000 - pendingCheckIn.timeRemaining) / 1200000) * 100
  }

  const columns = [
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any
    },
    {
      title: 'Horário',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'] as any
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Pendente' },
          approved: { color: 'green', text: 'Aprovado' },
          rejected: { color: 'red', text: 'Rejeitado' }
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as any
    },
    {
      title: 'Aprovado por',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      width: 150,
      render: (approvedBy: string) => approvedBy || '-',
      responsive: ['md', 'lg', 'xl'] as any
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Seção de boas-vindas e ação principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Text style={{ color: '#b9bbbe', fontSize: '16px' }}>
              Bem-vindo, {user?.name}! Acompanhe sua frequência e progresso.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<TrophyOutlined />}
            onClick={() => router.push('/dashboard/student/ranking')}
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
              borderColor: '#ffd700',
              color: '#000',
              fontWeight: 'bold',
              height: '40px',
              borderRadius: '8px'
            }}
          >
            Ver Ranking
          </Button>
        </div>

        {/* Estatísticas - Layout Mobile Responsivo */}
        <Row gutter={[16, 16]}>
          {/* Mobile: 2 cards por linha */}
          <Col xs={12} sm={12} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Total</span>}
                value={stats.totalCheckIns}
                prefix={<CalendarOutlined style={{ color: '#7289da', fontSize: '16px' }} />}
                valueStyle={{ color: '#ffffff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Aprovados</span>}
                value={stats.approvedCheckIns}
                prefix={<CheckCircleOutlined style={{ color: '#43b581', fontSize: '16px' }} />}
                valueStyle={{ color: '#43b581', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Pendentes</span>}
                value={stats.pendingCheckIns + (pendingCheckIn ? 1 : 0)}
                prefix={<ClockCircleOutlined style={{ color: '#faa61a', fontSize: '16px' }} />}
                valueStyle={{ color: '#faa61a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Frequência</span>}
                value={stats.attendanceRate}
                suffix="%"
                prefix={<TrophyOutlined style={{ color: '#7289da', fontSize: '16px' }} />}
                valueStyle={{ color: '#ffffff', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Taxa de Frequência - Barra de Progresso */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }}>
              <div className="flex items-center justify-between mb-2">
                <Text style={{ color: '#b9bbbe', fontSize: '14px' }}>Taxa de Frequência Geral</Text>
                <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{stats.attendanceRate.toFixed(1)}%</Text>
              </div>
              <Progress 
                percent={stats.attendanceRate} 
                showInfo={false} 
                strokeColor="#7289da"
                trailColor="#40444b"
                strokeWidth={8}
              />
            </Card>
          </Col>
        </Row>

        {/* Check-in com Timer */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              style={{ 
                background: '#36393f', 
                border: '1px solid #5c6370',
                textAlign: 'center'
              }}
            >
              <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
                Check-in de Hoje
              </Title>
              
              {pendingCheckIn ? (
                <div>
                  <LoadingOutlined style={{ fontSize: '48px', color: '#faa61a', marginBottom: '16px' }} />
                  <br />
                  <Text style={{ color: '#faa61a', fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    Aguardando Aprovação
                  </Text>
                  <Text style={{ color: '#b9bbbe', fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                    Tempo restante: {formatTime(pendingCheckIn.timeRemaining)}
                  </Text>
                  <Progress 
                    percent={getTimerProgress()} 
                    showInfo={false} 
                    strokeColor="#faa61a"
                    trailColor="#40444b"
                    strokeWidth={6}
                    className="mb-4"
                  />
                  <Alert
                    message="Check-in enviado para aprovação do professor"
                    description="Você receberá a confirmação em até 20 minutos"
                    type="warning"
                    showIcon
                    style={{ 
                      background: '#40444b', 
                      border: '1px solid #faa61a',
                      color: '#ffffff'
                    }}
                  />
                </div>
              ) : hasCheckedInToday ? (
                <div>
                  <CheckCircleOutlined style={{ fontSize: '48px', color: '#43b581', marginBottom: '16px' }} />
                  <br />
                  <Text style={{ color: '#43b581', fontSize: '16px' }}>
                    Check-in aprovado para hoje!
                  </Text>
                </div>
              ) : (
                <div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={checkInLoading}
                    onClick={handleCheckIn}
                    style={{
                      background: '#7289da',
                      borderColor: '#7289da',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  >
                    Fazer Check-in
                  </Button>
                  <br />
                  <Text style={{ color: '#b9bbbe', marginTop: '8px', display: 'block' }}>
                    Registre sua presença na aula de hoje
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Histórico de Check-ins */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title={<span style={{ color: '#ffffff' }}>Histórico de Check-ins</span>}
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
              bodyStyle={{ padding: '16px 12px' }}
            >
              {checkIns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#b9bbbe' }}>
                  <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <br />
                  <Text style={{ color: '#b9bbbe', fontSize: '16px' }}>
                    Nenhum check-in realizado ainda
                  </Text>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    columns={columns}
                    dataSource={checkIns}
                    rowKey="id"
                    pagination={{ 
                      pageSize: 8,
                      showSizeChanger: false,
                      showQuickJumper: false,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} de ${total} check-ins`,
                      style: { marginBottom: 0 }
                    }}
                    scroll={{ x: 'max-content', y: 400 }}
                    size="small"
                    style={{ background: 'transparent' }}
                    className="custom-table mobile-table"
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .custom-table .ant-table {
          background: transparent !important;
        }
        .custom-table .ant-table-thead > tr > th {
          background: #40444b !important;
          color: #ffffff !important;
          border-bottom: 1px solid #5c6370 !important;
          font-size: 14px !important;
          padding: 12px 8px !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          background: transparent !important;
          color: #ffffff !important;
          border-bottom: 1px solid #40444b !important;
          font-size: 13px !important;
          padding: 12px 8px !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #40444b !important;
        }
        .custom-table .ant-pagination {
          margin-top: 16px !important;
        }
        .custom-table .ant-pagination-item {
          background: #40444b !important;
          border-color: #5c6370 !important;
          min-width: 32px !important;
          height: 32px !important;
          line-height: 30px !important;
        }
        .custom-table .ant-pagination-item a {
          color: #ffffff !important;
        }
        .custom-table .ant-pagination-item-active {
          background: #7289da !important;
          border-color: #7289da !important;
        }
        .custom-table .ant-pagination-prev,
        .custom-table .ant-pagination-next {
          background: #40444b !important;
          border-color: #5c6370 !important;
          color: #ffffff !important;
        }
        .custom-table .ant-pagination-total-text {
          color: #b9bbbe !important;
          font-size: 12px !important;
        }
        
        /* Mobile specific styles */
        .mobile-table .ant-table-container {
          border-radius: 6px !important;
          overflow: hidden !important;
        }
        
        .mobile-table .ant-table-body {
          overflow-x: auto !important;
          overflow-y: auto !important;
        }
        
        @media (max-width: 768px) {
          .ant-statistic-title {
            font-size: 11px !important;
          }
          .ant-statistic-content {
            font-size: 18px !important;
          }
          
          .mobile-table .ant-table-thead > tr > th {
            font-size: 12px !important;
            padding: 8px 6px !important;
            white-space: nowrap !important;
          }
          .mobile-table .ant-table-tbody > tr > td {
            font-size: 12px !important;
            padding: 8px 6px !important;
            white-space: nowrap !important;
          }
          .mobile-table .ant-tag {
            font-size: 11px !important;
            padding: 2px 6px !important;
            margin: 0 !important;
          }
          .mobile-table .ant-pagination {
            text-align: center !important;
          }
          .mobile-table .ant-pagination-item {
            min-width: 28px !important;
            height: 28px !important;
            line-height: 26px !important;
            margin: 0 2px !important;
          }
          .mobile-table .ant-pagination-total-text {
            display: block !important;
            margin-bottom: 8px !important;
          }
        }
        
        @media (max-width: 480px) {
          .mobile-table .ant-table-thead > tr > th {
            font-size: 11px !important;
            padding: 6px 4px !important;
          }
          .mobile-table .ant-table-tbody > tr > td {
            font-size: 11px !important;
            padding: 6px 4px !important;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}