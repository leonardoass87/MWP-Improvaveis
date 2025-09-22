'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col, Statistic, Modal, Space, Checkbox, Input, Select } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, CalendarOutlined, ExclamationCircleOutlined, CheckOutlined, CloseOutlined, SearchOutlined, FilterOutlined, TrophyOutlined, BarChartOutlined, PieChartOutlined, EditOutlined, DashboardOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const { Title, Text } = Typography
const { confirm } = Modal
const { Option } = Select

// Enum para as diferentes telas
enum ProfessorView {
  MENU = 'menu',
  CHECKINS = 'checkins',
  STUDENTS = 'students',
  POSTS = 'posts',
  DASHBOARD = 'dashboard'
}

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
  const [currentView, setCurrentView] = useState<ProfessorView>(ProfessorView.MENU)
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckInRequest[]>([])
  const [selectedCheckIns, setSelectedCheckIns] = useState<number[]>([])
  const [students, setStudents] = useState<StudentStats[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBelt, setFilterBelt] = useState('all')
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    todayCheckIns: 0,
    activeStudents: 0
  })
  const [chartData, setChartData] = useState({
    weeklyCheckIns: [] as { day: string; checkIns: number }[],
    beltDistribution: [] as { belt: string; count: number; color: string }[],
    monthlyTrend: [] as { month: string; checkIns: number; students: number }[]
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
    if (parsedUser.role !== 'instructor') {
      router.push(`/dashboard/${parsedUser.role}`)
      return
    }

    setUser(parsedUser)
    loadData()
    
    // Atualizar dados a cada 30 segundos para capturar novos check-ins
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [router])

  const generateChartData = (studentsData: StudentStats[], checkInsData: CheckInRequest[]) => {
    // Dados para gráfico de check-ins semanais
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const weeklyData = weekDays.map((day, index) => ({
      day,
      checkIns: Math.floor(Math.random() * 20) + 5 // Dados simulados
    }))

    // Dados para distribuição de faixas
    const beltCounts: { [key: string]: number } = {}
    const beltColors: { [key: string]: string } = {
      'Branca': '#ffffff',
      'Azul': '#1890ff',
      'Roxa': '#722ed1',
      'Marrom': '#8b4513',
      'Preta': '#000000'
    }

    studentsData.forEach(student => {
      beltCounts[student.belt] = (beltCounts[student.belt] || 0) + 1
    })

    const beltDistribution = Object.entries(beltCounts).map(([belt, count]) => ({
      belt,
      count,
      color: beltColors[belt] || '#666666'
    }))

    // Dados para tendência mensal
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const monthlyTrend = months.map(month => ({
      month,
      checkIns: Math.floor(Math.random() * 100) + 50,
      students: Math.floor(Math.random() * 30) + 20
    }))

    setChartData({
      weeklyCheckIns: weeklyData,
      beltDistribution,
      monthlyTrend
    })
  }

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Carregar check-ins pendentes da API
      const checkInsResponse = await fetch('/api/checkins?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      let activePendingCheckIns: CheckInRequest[] = []
      if (checkInsResponse.ok) {
        const checkInsData = await checkInsResponse.json()
        // Converter formato da API para o formato esperado pelo componente
        activePendingCheckIns = checkInsData.map((checkIn: any) => ({
          id: checkIn.id,
          studentName: checkIn.user.name,
          studentEmail: checkIn.user.email || `user${checkIn.userId}@teste.com`,
          date: checkIn.date,
          time: new Date(checkIn.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: checkIn.status,
          createdAt: checkIn.createdAt
        }))
      }

      setPendingCheckIns(activePendingCheckIns)

      // Carregar dados reais de alunos da API
      const usersResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      let studentsData: StudentStats[] = []
      if (usersResponse.ok) {
        const users = await usersResponse.json()
        const students = users.filter((u: any) => u.role === 'student' && u.active)
        
        // Para cada aluno, calcular estatísticas de check-ins
        const studentsWithStats = await Promise.all(
          students.map(async (student: any) => {
            try {
              const checkInsResponse = await fetch(`/api/checkins?userId=${student.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              
              let totalCheckIns = 0
              let approvedCheckIns = 0
              
              if (checkInsResponse.ok) {
                const checkIns = await checkInsResponse.json()
                totalCheckIns = checkIns.length
                approvedCheckIns = checkIns.filter((c: any) => c.status === 'approved').length
              }
              
              const attendanceRate = totalCheckIns > 0 ? (approvedCheckIns / totalCheckIns) * 100 : 0
              
              return {
                id: student.id,
                name: student.name,
                email: student.email,
                totalCheckIns,
                approvedCheckIns,
                attendanceRate,
                belt: student.belt_level || 'white'
              }
            } catch (error) {
              console.error(`Erro ao carregar dados do aluno ${student.name}:`, error)
              return {
                id: student.id,
                name: student.name,
                email: student.email,
                totalCheckIns: 0,
                approvedCheckIns: 0,
                attendanceRate: 0,
                belt: student.belt_level || 'white'
              }
            }
          })
        )
        
        studentsData = studentsWithStats
      } else {
        // Fallback para dados mockados se a API falhar
        studentsData = [
          {
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            totalCheckIns: 156,
            approvedCheckIns: 148,
            attendanceRate: 94.9,
            belt: 'Azul'
          },
          {
            id: 2,
            name: 'Maria Santos',
            email: 'maria@teste.com',
            totalCheckIns: 142,
            approvedCheckIns: 138,
            attendanceRate: 97.2,
            belt: 'Roxa'
          }
        ]
      }

      setStudents(studentsData)
      setFilteredStudents(studentsData)

      // Carregar estatísticas da API
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          totalStudents: statsData.totalStudents,
          pendingApprovals: statsData.pendingCheckIns,
          todayCheckIns: statsData.todayCheckIns,
          activeStudents: statsData.activeStudents
        })
      } else {
        // Fallback para estatísticas calculadas localmente
        const today = new Date().toISOString().split('T')[0]
        const todayCheckIns = activePendingCheckIns.filter(c => c.date === today).length
        const activeStudents = mockStudents.filter(s => s.attendanceRate >= 80).length

        setStats({
          totalStudents: mockStudents.length,
          pendingApprovals: activePendingCheckIns.length,
          todayCheckIns,
          activeStudents
        })
      }

      // Gerar dados para gráficos
      generateChartData(studentsData, activePendingCheckIns)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      message.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Função para filtrar alunos
  useEffect(() => {
    let filtered = students

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por faixa
    if (filterBelt !== 'all') {
      filtered = filtered.filter(student => student.belt === filterBelt)
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, filterBelt])

  const getBeltColor = (belt: string) => {
    const colors: { [key: string]: string } = {
      'Branca': '#ffffff',
      'Azul': '#1890ff',
      'Roxa': '#722ed1',
      'Marrom': '#8b4513',
      'Preta': '#000000'
    }
    return colors[belt] || '#ffffff'
  }

  const handleApproveCheckIn = async (checkInId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/checkins/${checkInId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' })
      })

      if (response.ok) {
        // Remover da lista de pendentes
        setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId))
        
        // Atualizar estatísticas
        setStats(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1,
          todayCheckIns: prev.todayCheckIns + 1
        }))

        message.success('Check-in aprovado com sucesso!')
      } else {
        const errorData = await response.json()
        message.error(errorData.error || 'Erro ao aprovar check-in')
      }
    } catch (error) {
      console.error('Erro ao aprovar check-in:', error)
      message.error('Erro ao aprovar check-in')
    }
  }

  const handleRejectCheckIn = async (checkInId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/checkins/${checkInId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (response.ok) {
        // Remover da lista de pendentes
        setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId))
        
        // Atualizar estatísticas
        setStats(prev => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1
        }))

        message.success('Check-in rejeitado!')
      } else {
        const errorData = await response.json()
        message.error(errorData.error || 'Erro ao rejeitar check-in')
      }
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
          const token = localStorage.getItem('token')
          if (!token) return

          // Aprovar cada check-in individualmente
          const approvalPromises = selectedCheckIns.map(checkInId =>
            fetch(`/api/checkins/${checkInId}/approve`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: 'approved' })
            })
          )

          const responses = await Promise.all(approvalPromises)
          const successCount = responses.filter(response => response.ok).length
          
          if (successCount > 0) {
            // Remover da lista de pendentes
            setPendingCheckIns(prev => prev.filter(c => !selectedCheckIns.includes(c.id)))
            
            // Limpar seleção
            setSelectedCheckIns([])
            
            // Atualizar estatísticas
            setStats(prev => ({
              ...prev,
              pendingApprovals: prev.pendingApprovals - successCount,
              todayCheckIns: prev.todayCheckIns + successCount
            }))

            message.success(`${successCount} check-in(s) aprovado(s) com sucesso!`)
          }

          if (successCount < selectedCheckIns.length) {
            message.warning(`${selectedCheckIns.length - successCount} check-in(s) não puderam ser aprovados`)
          }
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
          const token = localStorage.getItem('token')
          if (!token) return

          // Rejeitar cada check-in individualmente
          const rejectionPromises = selectedCheckIns.map(checkInId =>
            fetch(`/api/checkins/${checkInId}/approve`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: 'rejected' })
            })
          )

          const responses = await Promise.all(rejectionPromises)
          const successCount = responses.filter(response => response.ok).length
          
          if (successCount > 0) {
            // Remover da lista de pendentes
            setPendingCheckIns(prev => prev.filter(c => !selectedCheckIns.includes(c.id)))
            
            // Limpar seleção
            setSelectedCheckIns([])
            
            // Atualizar estatísticas
            setStats(prev => ({
              ...prev,
              pendingApprovals: prev.pendingApprovals - successCount
            }))

            message.success(`${successCount} check-in(s) rejeitado(s)!`)
          }

          if (successCount < selectedCheckIns.length) {
            message.warning(`${selectedCheckIns.length - successCount} check-in(s) não puderam ser rejeitados`)
          }
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
      key: 'name',
      flex: 1,
      minWidth: 150,
      render: (name: string, record: StudentStats) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getBeltColor(record.belt),
              border: '1px solid #ffffff30'
            }}
          />
          <span style={{ color: '#ffffff', fontWeight: '500' }}>{name}</span>
        </div>
      )
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      width: 100,
      render: (belt: string) => (
        <Tag 
          color={getBeltColor(belt)} 
          style={{ 
            color: belt === 'Branca' ? '#000' : '#fff',
            fontWeight: '500',
            border: 'none'
          }}
        >
          {belt}
        </Tag>
      )
    },
    {
      title: 'Frequência',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 120,
      render: (rate: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            color: rate >= 90 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {rate.toFixed(1)}%
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#b9bbbe',
            marginTop: '2px'
          }}>
            {rate >= 90 ? 'Excelente' : rate >= 80 ? 'Bom' : 'Regular'}
          </div>
        </div>
      )
    },
    {
       title: 'Check-ins',
       dataIndex: 'totalCheckIns',
       key: 'totalCheckIns',
       width: 100,
       render: (total: number, record: StudentStats) => (
         <div style={{ textAlign: 'center' }}>
           <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
             {total}
           </div>
           <div style={{ 
             fontSize: '11px', 
             color: '#52c41a',
             marginTop: '2px'
           }}>
             {record.approvedCheckIns} aprovados
           </div>
         </div>
       )
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

  // Componente do Menu Principal
  const renderMainMenu = () => (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Title level={1} style={{ color: '#ffffff', marginBottom: '8px' }}>
          Área do Professor
        </Title>
        <Text style={{ color: '#b9bbbe', fontSize: '18px' }}>
          Bem-vindo, {user?.name}! Escolha uma opção para começar.
        </Text>
      </div>

      {/* Menu de Opções */}
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="menu-card"
            style={{ 
              background: 'linear-gradient(145deg, #36393f 0%, #2f3136 100%)',
              border: '1px solid #5c6370',
              borderRadius: '12px',
              height: '200px',
              cursor: 'pointer'
            }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '24px'
            }}
            onClick={() => setCurrentView(ProfessorView.CHECKINS)}
          >
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#faa61a', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              Aprovação de Check-ins
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Aprovar ou rejeitar check-ins dos alunos
            </Text>
            {stats.pendingApprovals > 0 && (
              <Tag color="orange" style={{ marginTop: '8px' }}>
                {stats.pendingApprovals} pendente{stats.pendingApprovals !== 1 ? 's' : ''}
              </Tag>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="menu-card"
            style={{ 
              background: 'linear-gradient(145deg, #36393f 0%, #2f3136 100%)',
              border: '1px solid #5c6370',
              borderRadius: '12px',
              height: '200px',
              cursor: 'pointer'
            }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '24px'
            }}
            onClick={() => setCurrentView(ProfessorView.STUDENTS)}
          >
            <TeamOutlined style={{ fontSize: '48px', color: '#43b581', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              Gerenciar Alunos
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Visualizar e gerenciar seus alunos
            </Text>
            <Tag color="green" style={{ marginTop: '8px' }}>
              {stats.totalStudents} aluno{stats.totalStudents !== 1 ? 's' : ''}
            </Tag>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="menu-card"
            style={{ 
              background: 'linear-gradient(145deg, #36393f 0%, #2f3136 100%)',
              border: '1px solid #5c6370',
              borderRadius: '12px',
              height: '200px',
              cursor: 'pointer'
            }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '24px'
            }}
            onClick={() => setCurrentView(ProfessorView.POSTS)}
          >
            <EditOutlined style={{ fontSize: '48px', color: '#7289da', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              Postagens
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Criar e gerenciar postagens
            </Text>
            <Tag color="blue" style={{ marginTop: '8px' }}>
              Em breve
            </Tag>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            className="menu-card"
            style={{ 
              background: 'linear-gradient(145deg, #36393f 0%, #2f3136 100%)',
              border: '1px solid #5c6370',
              borderRadius: '12px',
              height: '200px',
              cursor: 'pointer'
            }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: '24px'
            }}
            onClick={() => setCurrentView(ProfessorView.DASHBOARD)}
          >
            <DashboardOutlined style={{ fontSize: '48px', color: '#f04747', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              Dashboard
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Estatísticas e relatórios
            </Text>
            <Tag color="red" style={{ marginTop: '8px' }}>
              Análises
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* Estatísticas Resumidas */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={12} sm={6}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe' }}>Total Alunos</span>}
              value={stats.totalStudents}
              prefix={<TeamOutlined style={{ color: '#43b581' }} />}
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe' }}>Pendentes</span>}
              value={stats.pendingApprovals}
              prefix={<ClockCircleOutlined style={{ color: '#faa61a' }} />}
              valueStyle={{ color: '#faa61a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe' }}>Hoje</span>}
              value={stats.todayCheckIns}
              prefix={<CalendarOutlined style={{ color: '#7289da' }} />}
              valueStyle={{ color: '#7289da' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe' }}>Ativos</span>}
              value={stats.activeStudents}
              prefix={<UserOutlined style={{ color: '#43b581' }} />}
              valueStyle={{ color: '#43b581' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  // Componente de Header com botão voltar
  const renderHeader = (title: string) => (
    <div className="mb-6 flex items-center flex-wrap">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => setCurrentView(ProfessorView.MENU)}
        style={{ 
          color: '#b9bbbe', 
          marginRight: '16px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}
        className="mb-2 sm:mb-0"
      >
        <span className="hidden sm:inline">Voltar ao Menu</span>
        <span className="sm:hidden">Voltar</span>
      </Button>
      <Title 
        level={2} 
        style={{ color: '#ffffff', margin: 0 }}
        className="text-lg sm:text-xl md:text-2xl break-words"
      >
        {title}
      </Title>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 p-4 md:p-6">
      {currentView === ProfessorView.MENU && renderMainMenu()}
      
      {currentView === ProfessorView.CHECKINS && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {renderHeader('Aprovação de Check-ins')}
          
          {/* Ações em Lote - Mobile Optimized */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex flex-col gap-3">
              {/* Botão Selecionar/Fazer Check-in de Todos */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="default"
                  icon={<TeamOutlined />}
                  onClick={() => {
                    const allIds = pendingCheckIns.map(checkIn => checkIn.id);
                    setSelectedCheckIns(selectedCheckIns.length === pendingCheckIns.length ? [] : allIds);
                  }}
                  className="flex-1 sm:flex-none"
                  size="large"
                  style={{ borderColor: '#5c6370', color: '#ffffff' }}
                >
                  <span className="hidden sm:inline">
                    {selectedCheckIns.length === pendingCheckIns.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </span>
                  <span className="sm:hidden">
                    {selectedCheckIns.length === pendingCheckIns.length ? 'Desmarcar' : 'Selecionar'}
                  </span>
                  {pendingCheckIns.length > 0 && ` (${pendingCheckIns.length})`}
                </Button>
                
                {pendingCheckIns.length > 0 && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      const allIds = pendingCheckIns.map(checkIn => checkIn.id);
                      setSelectedCheckIns(allIds);
                      handleBulkApprove();
                    }}
                    style={{ background: '#1890ff', borderColor: '#1890ff' }}
                    className="flex-1 sm:flex-none"
                    size="large"
                  >
                    <span className="hidden sm:inline">Fazer Check-in de Todos</span>
                    <span className="sm:hidden">Check-in Todos</span>
                  </Button>
                )}
              </div>

              {/* Botões de Ação para Selecionados */}
              {selectedCheckIns.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-600">
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleBulkApprove}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    className="flex-1 sm:flex-none"
                    size="large"
                  >
                    <span className="hidden sm:inline">Aprovar Selecionados</span>
                    <span className="sm:hidden">Aprovar</span> ({selectedCheckIns.length})
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleBulkReject}
                    className="flex-1 sm:flex-none"
                    size="large"
                  >
                    <span className="hidden sm:inline">Rejeitar Selecionados</span>
                    <span className="sm:hidden">Rejeitar</span> ({selectedCheckIns.length})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Check-ins Pendentes */}
          {pendingCheckIns.length === 0 ? (
            <Card 
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
              bodyStyle={{ textAlign: 'center', padding: '40px' }}
            >
              <ClockCircleOutlined style={{ fontSize: '48px', color: '#b9bbbe', marginBottom: '16px' }} />
              <br />
              <Text style={{ color: '#b9bbbe', fontSize: '16px' }}>
                Nenhum check-in pendente no momento
              </Text>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Card 
                  title={
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#ffffff' }}>Check-ins Pendentes de Aprovação</span>
                    </div>
                  }
                  style={{ background: '#36393f', border: '1px solid #5c6370' }}
                >
                  <Table
                    columns={checkInColumns}
                    dataSource={pendingCheckIns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                    style={{ background: 'transparent' }}
                    className="custom-table"
                  />
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {pendingCheckIns.map((checkIn) => (
                  <Card
                    key={checkIn.id}
                    style={{ 
                      background: '#36393f', 
                      border: '1px solid #5c6370',
                      borderRadius: '8px'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCheckIns.includes(checkIn.id)}
                          onChange={(e) => handleSelectCheckIn(checkIn.id, e.target.checked)}
                        />
                        <div>
                          <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>
                            {checkIn.studentName}
                          </Text>
                          <br />
                          <Text style={{ color: '#b9bbbe', fontSize: '14px' }}>
                            {checkIn.studentEmail}
                          </Text>
                        </div>
                      </div>
                      <Tag color="orange" style={{ margin: 0 }}>
                        Pendente
                      </Tag>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <Text style={{ color: '#b9bbbe', fontSize: '12px', display: 'block' }}>
                          Data
                        </Text>
                        <Text style={{ color: '#ffffff', fontSize: '14px' }}>
                          {new Date(checkIn.date).toLocaleDateString('pt-BR')}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: '#b9bbbe', fontSize: '12px', display: 'block' }}>
                          Horário
                        </Text>
                        <Text style={{ color: '#ffffff', fontSize: '14px' }}>
                          {checkIn.time}
                        </Text>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApproveCheckIn(checkIn.id)}
                        style={{ 
                          background: '#52c41a', 
                          borderColor: '#52c41a',
                          flex: 1
                        }}
                        size="large"
                      >
                        Aprovar
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleRejectCheckIn(checkIn.id)}
                        style={{ flex: 1 }}
                        size="large"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Mobile Pagination */}
                {pendingCheckIns.length > 5 && (
                  <div className="text-center mt-4">
                    <Text style={{ color: '#b9bbbe', fontSize: '14px' }}>
                      Mostrando {Math.min(5, pendingCheckIns.length)} de {pendingCheckIns.length} check-ins
                    </Text>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        )}

        {currentView === ProfessorView.STUDENTS && (
        <div className="max-w-7xl mx-auto">
          {renderHeader('Gerenciar Alunos')}
          
          {/* Lista de Alunos */}
          <Row gutter={[16, 16]} className="mb-6 md:mb-8">
            <Col span={24}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined style={{ color: '#7289da', fontSize: '18px' }} />
                    <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                      Gestão de Alunos
                    </span>
                  </div>
                }
                style={{ background: '#36393f', border: '1px solid #5c6370' }}
              >
                {/* Filtros e Busca */}
                <div style={{ 
                  marginBottom: '20px', 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <Input
                    placeholder="Buscar por nome..."
                    prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '250px',
                      background: '#40444b',
                      border: '1px solid #5c6370',
                      color: '#ffffff'
                    }}
                    className="search-input"
                  />
                  <Select
                    placeholder="Filtrar por faixa"
                    value={filterBelt}
                    onChange={setFilterBelt}
                    style={{ 
                      width: '180px',
                      background: '#40444b'
                    }}
                    className="filter-select"
                    suffixIcon={<FilterOutlined style={{ color: '#b9bbbe' }} />}
                  >
                    <Option value="">Todas as faixas</Option>
                    <Option value="Branca">Branca</Option>
                    <Option value="Azul">Azul</Option>
                    <Option value="Roxa">Roxa</Option>
                    <Option value="Marrom">Marrom</Option>
                    <Option value="Preta">Preta</Option>
                  </Select>
                  <div style={{ 
                    color: '#b9bbbe', 
                    fontSize: '14px',
                    marginLeft: 'auto'
                  }}>
                    {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <Table
                  columns={studentColumns}
                  dataSource={filteredStudents}
                  rowKey="id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} de ${total} alunos`
                  }}
                  scroll={{ x: 800 }}
                  style={{ background: 'transparent' }}
                  className="custom-table"
                />
              </Card>
            </Col>
          </Row>
        </div>
        )}

        {currentView === ProfessorView.POSTS && (
        <div className="max-w-7xl mx-auto">
          {renderHeader('Postagens')}
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card 
                style={{ background: '#36393f', border: '1px solid #5c6370' }}
                bodyStyle={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: '400px',
                  padding: '60px'
                }}
              >
                <EditOutlined style={{ fontSize: '72px', color: '#7289da', marginBottom: '24px' }} />
                <Title level={3} style={{ color: '#ffffff', textAlign: 'center', marginBottom: '16px' }}>
                  Sistema de Postagens
                </Title>
                <Text style={{ color: '#b9bbbe', fontSize: '16px', textAlign: 'center', marginBottom: '24px' }}>
                  Esta funcionalidade será implementada em breve. Aqui você poderá criar e gerenciar postagens para seus alunos.
                </Text>
                <Tag color="blue" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  Em desenvolvimento
                </Tag>
              </Card>
            </Col>
          </Row>
        </div>
        )}

        {currentView === ProfessorView.DASHBOARD && (
        <div className="max-w-7xl mx-auto">
          {renderHeader('Dashboard e Estatísticas')}

        {/* Estatísticas */}
        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col xs={12} sm={6} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Total Alunos</span>}
                value={stats.totalStudents}
                prefix={<TeamOutlined style={{ color: '#7289da', fontSize: '16px' }} />}
                valueStyle={{ color: '#ffffff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Ativos</span>}
                value={stats.activeStudents}
                prefix={<UserOutlined style={{ color: '#43b581', fontSize: '16px' }} />}
                valueStyle={{ color: '#43b581', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370' }} bodyStyle={{ padding: '16px 12px' }}>
              <Statistic
                title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Pendentes</span>}
                value={stats.pendingApprovals}
                prefix={<ClockCircleOutlined style={{ color: '#faa61a', fontSize: '16px' }} />}
                valueStyle={{ color: '#faa61a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={6}>
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

        {/* Gráficos e Análises */}
        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ color: '#ffffff' }}>
                  <BarChartOutlined style={{ marginRight: '8px' }} />
                  Check-ins da Semana
                </span>
              }
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.weeklyCheckIns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#5c6370" />
                  <XAxis dataKey="day" stroke="#b9bbbe" />
                  <YAxis stroke="#b9bbbe" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2f3136', 
                      border: '1px solid #5c6370',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }} 
                  />
                  <Bar dataKey="checkIns" fill="#7289da" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ color: '#ffffff' }}>
                  <PieChartOutlined style={{ marginRight: '8px' }} />
                  Distribuição de Faixas
                </span>
              }
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.beltDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ belt, count }) => `${belt}: ${count}`}
                  >
                    {chartData.beltDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#36393f" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2f3136', 
                      border: '1px solid #5c6370',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col span={24}>
            <Card 
              title={
                <span style={{ color: '#ffffff' }}>
                  <TrophyOutlined style={{ marginRight: '8px' }} />
                  Tendência Mensal
                </span>
              }
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#5c6370" />
                  <XAxis dataKey="month" stroke="#b9bbbe" />
                  <YAxis stroke="#b9bbbe" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2f3136', 
                      border: '1px solid #5c6370',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="checkIns" 
                    stroke="#7289da" 
                    strokeWidth={2}
                    name="Check-ins"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#43b581" 
                    strokeWidth={2}
                    name="Alunos Ativos"
                  />
                </LineChart>
              </ResponsiveContainer>
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

        {/* Lista de Alunos */}
        <Row gutter={[16, 16]} className="mb-6 md:mb-8">
          <Col span={24}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrophyOutlined style={{ color: '#7289da', fontSize: '18px' }} />
                  <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                    Gestão de Alunos
                  </span>
                </div>
              }
              style={{ background: '#36393f', border: '1px solid #5c6370' }}
            >
              {/* Filtros e Busca */}
              <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                gap: '12px', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <Input
                  placeholder="Buscar por nome..."
                  prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '250px',
                    background: '#40444b',
                    border: '1px solid #5c6370',
                    color: '#ffffff'
                  }}
                  className="search-input"
                />
                <Select
                  placeholder="Filtrar por faixa"
                  value={filterBelt}
                  onChange={setFilterBelt}
                  style={{ 
                    width: '180px',
                    background: '#40444b'
                  }}
                  className="filter-select"
                  suffixIcon={<FilterOutlined style={{ color: '#b9bbbe' }} />}
                >
                  <Option value="">Todas as faixas</Option>
                  <Option value="Branca">Branca</Option>
                  <Option value="Azul">Azul</Option>
                  <Option value="Roxa">Roxa</Option>
                  <Option value="Marrom">Marrom</Option>
                  <Option value="Preta">Preta</Option>
                </Select>
                <div style={{ 
                  color: '#b9bbbe', 
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}>
                  {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
                </div>
              </div>

              <Table
                columns={studentColumns}
                dataSource={filteredStudents}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} de ${total} alunos`
                }}
                scroll={{ x: 800 }}
                style={{ background: 'transparent' }}
                className="custom-table"
              />
            </Card>
          </Col>
        </Row>
        </div>
        )}

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

        .search-input .ant-input {
          background: #40444b !important;
          border: 1px solid #5c6370 !important;
          color: #ffffff !important;
        }
        .search-input .ant-input::placeholder {
          color: #b9bbbe !important;
        }
        .search-input .ant-input:focus {
          border-color: #7289da !important;
          box-shadow: 0 0 0 2px rgba(114, 137, 218, 0.2) !important;
        }

        .filter-select .ant-select-selector {
          background: #40444b !important;
          border: 1px solid #5c6370 !important;
          color: #ffffff !important;
        }
        .filter-select .ant-select-selection-placeholder {
          color: #b9bbbe !important;
        }
        .filter-select .ant-select-arrow {
          color: #b9bbbe !important;
        }
        .filter-select.ant-select-focused .ant-select-selector {
          border-color: #7289da !important;
          box-shadow: 0 0 0 2px rgba(114, 137, 218, 0.2) !important;
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