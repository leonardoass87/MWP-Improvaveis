'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { AuthUser, CheckInWithUser, User } from '@/types'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function AlunoDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInWithUser[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
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
      // Carregar check-ins de hoje
      const today = new Date().toISOString().split('T')[0]
      const checkInsResponse = await fetch(`/api/checkins?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (checkInsResponse.ok) {
        const checkInsData = await checkInsResponse.json()
        setTodayCheckIns(checkInsData)
        
        // Verificar se já fez check-in hoje
        const userCheckIn = checkInsData.find((c: CheckInWithUser) => c.userId === JSON.parse(localStorage.getItem('user')!).id)
        setHasCheckedInToday(!!userCheckIn)
      }

      // Carregar lista de alunos
      const studentsResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.filter((u: User) => u.role === 'student' && u.active))
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
        <Tag color={getBeltColor(record.user.belt_level || 'white')}>
          {record.user.belt_level} {record.user.degree}º grau
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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <Title level={2} className="text-white mb-2">
            Dashboard do Aluno
          </Title>
          <Text className="text-gray-400">
            Bem-vindo, {user.name}!
          </Text>
        </div>

        {/* Check-in Card */}
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

          {/* Lista de Alunos */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="text-white">
                  Alunos Ativos ({students.length})
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
                locale={{ emptyText: 'Nenhum aluno encontrado' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}