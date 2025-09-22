'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col, Statistic, Modal, Space, Checkbox } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, CalendarOutlined, ExclamationCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography
const { confirm } = Modal

interface CheckInRequest {
  id: number
  studentName: string
  studentEmail: string
  date: string
  time: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface StudentStats {
  id: number
  name: string
  email: string
  totalCheckIns: number
  approvedCheckIns: number
  attendanceRate: number
  belt: string
}

export default function ProfessorDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckInRequest[]>([])
  const [selectedCheckIns, setSelectedCheckIns] = useState<number[]>([])
  const [students, setStudents] = useState<StudentStats[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    todayCheckIns: 0
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'professor') {
      router.push(`/dashboard/${parsedUser.role}`)
      return
    }

    setUser(parsedUser)
    loadData()
    
    // Atualizar dados a cada 30 segundos para capturar novos check-ins
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [router])

  const loadData = async () => {
    try {
      // Carregar check-ins pendentes do localStorage
      const savedPendingCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
      
      // Filtrar apenas os pendentes (não aprovados/rejeitados)
      const activePendingCheckIns = savedPendingCheckIns.filter((checkIn: CheckInRequest) => 
        checkIn.status === 'pending'
      )

      setPendingCheckIns(activePendingCheckIns)

      // Simular dados de alunos
      const mockStudents: StudentStats[] = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@teste.com',
          totalCheckIns: 15,
          approvedCheckIns: 14,
          attendanceRate: 93.3,
          belt: 'Azul'
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@teste.com',
          totalCheckIns: 18,
          approvedCheckIns: 17,
          attendanceRate: 94.4,
          belt: 'Branca'
        },
        {
          id: 3,
          name: 'Pedro Costa',
          email: 'pedro@teste.com',
          totalCheckIns: 12,
          approvedCheckIns: 10,
          attendanceRate: 83.3,
          belt: 'Azul'
        },
        {
          id: 4,
          name: 'Ana Oliveira',
          email: 'ana@teste.com',
          totalCheckIns: 20,
          approvedCheckIns: 19,
          attendanceRate: 95.0,
          belt: 'Roxa'
        }
      ]

      setStudents(mockStudents)

      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0]
      const todayCheckIns = activePendingCheckIns.filter(c => c.date === today).length

      setStats({
        totalStudents: mockStudents.length,
        pendingApprovals: activePendingCheckIns.length,
        todayCheckIns
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      message.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveCheckIn = async (checkInId: number) => {
    try {
      const savedCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
      const updatedCheckIns = savedCheckIns.map((checkIn: CheckInRequest) => 
        checkIn.id === checkInId 
          ? { ...checkIn, status: 'approved', approvedBy: user?.name, approvedAt: new Date().toISOString() }
          : checkIn
      )
      
      localStorage.setItem('pendingCheckInsForProfessor', JSON.stringify(updatedCheckIns))
      
      // Remover da lista de pendentes
      setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId))
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }))

      message.success('Check-in aprovado com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar check-in:', error)
      message.error('Erro ao aprovar check-in')
    }
  }

  const handleRejectCheckIn = async (checkInId: number) => {
    try {
      const savedCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
      const updatedCheckIns = savedCheckIns.map((checkIn: CheckInRequest) => 
        checkIn.id === checkInId 
          ? { ...checkIn, status: 'rejected', rejectedBy: user?.name, rejectedAt: new Date().toISOString() }
          : checkIn
      )
      
      localStorage.setItem('pendingCheckInsForProfessor', JSON.stringify(updatedCheckIns))
      
      // Remover da lista de pendentes
      setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId))
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }))

      message.success('Check-in rejeitado!')
    } catch (error) {
      console.error('Erro ao rejeitar check-in:', error)
      message.error('Erro ao rejeitar check-in')
    }
  }

  const handleBulkApprove = () => {
    if (selectedCheckIns.length === 0) {
      message.warning('Selecione pelo menos um check-in para aprovar')
      return
    }

    confirm({
      title: 'Aprovar Check-ins Selecionados',
      content: `Deseja aprovar ${selectedCheckIns.length} check-in(s) selecionado(s)?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Aprovar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const savedCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
          const updatedCheckIns = savedCheckIns.map((checkIn: CheckInRequest) => 
            selectedCheckIns.includes(checkIn.id)
              ? { ...checkIn, status: 'approved', approvedBy: user?.name, approvedAt: new Date().toISOString() }
              : checkIn
          )
          
          localStorage.setItem('pendingCheckInsForProfessor', JSON.stringify(updatedCheckIns))
          
          // Remover da lista de pendentes
          setPendingCheckIns(prev => prev.filter(c => !selectedCheckIns.includes(c.id)))
          
          // Limpar seleção
          setSelectedCheckIns([])
          
          // Atualizar estatísticas
          setStats(prev => ({
            ...prev,
            pendingApprovals: prev.pendingApprovals - selectedCheckIns.length
          }))

          message.success(`${selectedCheckIns.length} check-in(s) aprovado(s) com sucesso!`)
        } catch (error) {
          console.error('Erro ao aprovar check-ins:', error)
          message.error('Erro ao aprovar check-ins')
        }
      }
    })
  }

  const handleBulkReject = () => {
    if (selectedCheckIns.length === 0) {
      message.warning('Selecione pelo menos um check-in para rejeitar')
      return
    }

    confirm({
      title: 'Rejeitar Check-ins Selecionados',
      content: `Deseja rejeitar ${selectedCheckIns.length} check-in(s) selecionado(s)?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Rejeitar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const savedCheckIns = JSON.parse(localStorage.getItem('pendingCheckInsForProfessor') || '[]')
          const updatedCheckIns = savedCheckIns.map((checkIn: CheckInRequest) => 
            selectedCheckIns.includes(checkIn.id)
              ? { ...checkIn, status: 'rejected', rejectedBy: user?.name, rejectedAt: new Date().toISOString() }
              : checkIn
          )
          
          localStorage.setItem('pendingCheckInsForProfessor', JSON.stringify(updatedCheckIns))
          
          // Remover da lista de pendentes
          setPendingCheckIns(prev => prev.filter(c => !selectedCheckIns.includes(c.id)))
          
          // Limpar seleção
          setSelectedCheckIns([])
          
          // Atualizar estatísticas
          setStats(prev => ({
            ...prev,
            pendingApprovals: prev.pendingApprovals - selectedCheckIns.length
          }))

          message.success(`${selectedCheckIns.length} check-in(s) rejeitado(s)!`)
        } catch (error) {
          console.error('Erro ao rejeitar check-ins:', error)
          message.error('Erro ao rejeitar check-ins')
        }
      }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCheckIns(pendingCheckIns.map(c => c.id))
    } else {
      setSelectedCheckIns([])
    }
  }

  const handleSelectCheckIn = (checkInId: number, checked: boolean) => {
    if (checked) {
      setSelectedCheckIns(prev => [...prev, checkInId])
    } else {
      setSelectedCheckIns(prev => prev.filter(id => id !== checkInId))
    }
  }

  const checkInColumns = [
    {
      title: (
        <Checkbox
          checked={selectedCheckIns.length === pendingCheckIns.length && pendingCheckIns.length > 0}
          indeterminate={selectedCheckIns.length > 0 && selectedCheckIns.length < pendingCheckIns.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Selecionar
        </Checkbox>
      ),
      dataIndex: 'select',
      key: 'select',
      width: 100,
      render: (_: any, record: CheckInRequest) => (
        <Checkbox
          checked={selectedCheckIns.includes(record.id)}
          onChange={(e) => handleSelectCheckIn(record.id, e.target.checked)}
        />
      )
    },
    {
      title: 'Aluno',
      dataIndex: 'studentName',
      key: 'studentName'
    },
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR')
    },
    {
      title: 'Horário',
      dataIndex: 'time',
      key: 'time'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="orange">Pendente</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: CheckInRequest) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApproveCheckIn(record.id)}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Aprovar
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleRejectCheckIn(record.id)}
          >
            Rejeitar
          </Button>
        </Space>
      )
    }
  ]

  const studentColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      render: (belt: string) => <Tag color="blue">{belt}</Tag>
    },
    {
      title: 'Check-ins',
      dataIndex: 'totalCheckIns',
      key: 'totalCheckIns'
    },
    {
      title: 'Aprovados',
      dataIndex: 'approvedCheckIns',
      key: 'approvedCheckIns'
    },
    {
      title: 'Frequência',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      render: (rate: number) => `${rate.toFixed(1)}%`
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
            Dashboard do Professor
          </Title>
          <Text style={{ color: '#b9bbbe', fontSize: '16px' }}>
            Bem-vindo, {user?.name}! Gerencie os check-ins e acompanhe seus alunos.
          </Text>
        </div>

        {/* Estatísticas */}
        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col xs={12} sm={8} md={8}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Total Alunos</span>}
                value={stats.totalStudents}
                prefix={<TeamOutlined style={{ color: '#7289da', fontSize: '16px' }} />}
                valueStyle={{ color: '#ffffff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={8}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Pendentes</span>}
                value={stats.pendingApprovals}
                prefix={<ClockCircleOutlined style={{ color: '#faa61a', fontSize: '16px' }} />}
                valueStyle={{ color: '#faa61a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={8}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Hoje</span>}
                value={stats.todayCheckIns}
                prefix={<CalendarOutlined style={{ color: '#43b581', fontSize: '16px' }} />}
                valueStyle={{ color: '#43b581', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Check-ins Pendentes */}
        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col span={24}>
            <Card 
              title={
                <div className="flex justify-between items-center">
                  <span style={{ color: '#ffffff' }}>Check-ins Pendentes de Aprovação</span>
                  {selectedCheckIns.length > 0 && (
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={handleBulkApprove}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      >
                        Aprovar Selecionados ({selectedCheckIns.length})
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={handleBulkReject}
                      >
                        Rejeitar Selecionados ({selectedCheckIns.length})
                      </Button>
                    </Space>
                  )}
                </div>
              }
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              {pendingCheckIns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#b9bbbe' }}>
                  <ClockCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <br />
                  <Text style={{ color: '#b9bbbe', fontSize: '16px' }}>
                    Nenhum check-in pendente no momento
                  </Text>
                </div>
              ) : (
                <Table
                  columns={checkInColumns}
                  dataSource={pendingCheckIns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800 }}
                  style={{ background: 'transparent' }}
                  className="custom-table"
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Lista de Alunos */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title={<span style={{ color: '#ffffff' }}>Gestão de Alunos</span>}
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              <Table
                columns={studentColumns}
                dataSource={students}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
                style={{ background: 'transparent' }}
                className="custom-table"
              />
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
        }
        .custom-table .ant-table-tbody > tr > td {
          background: transparent !important;
          color: #ffffff !important;
          border-bottom: 1px solid #40444b !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #40444b !important;
        }
        .custom-table .ant-pagination-item {
          background: #40444b !important;
          border-color: #5c6370 !important;
        }
        .custom-table .ant-pagination-item a {
          color: #ffffff !important;
        }
        .custom-table .ant-pagination-item-active {
          background: #7289da !important;
          border-color: #7289da !important;
        }
        
        @media (max-width: 768px) {
          .ant-statistic-title {
            font-size: 11px !important;
          }
          .ant-statistic-content {
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  )
}