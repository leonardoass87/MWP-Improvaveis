'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, Table, Tag, Spin, Typography, Row, Col, Statistic, Modal, Space, Checkbox, Input, Select, Tooltip, App } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, CalendarOutlined, ExclamationCircleOutlined, CheckOutlined, CloseOutlined, SearchOutlined, FilterOutlined, TrophyOutlined, BarChartOutlined, PieChartOutlined, EditOutlined, DashboardOutlined, ArrowLeftOutlined, EyeOutlined, CopyOutlined, UserAddOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import StudentManagement from '@/components/StudentManagement'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import Image from 'next/image'

const { Title, Text } = Typography
const { confirm } = Modal
const { Option } = Select

// Enum para as diferentes telas
enum ProfessorView {
  MENU = 'menu',
  CHECKINS = 'checkins',
  STUDENTS = 'students',
  POSTS = 'posts',
  DASHBOARD = 'dashboard',
  STUDENT_MANAGEMENT = 'student_management'
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
  const { message } = App.useApp()
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

  const loadData = useCallback(async () => {
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
                belt: student.belt || 'white'
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
                belt: student.belt || 'white'
              }
            }
          })
        )
        
        studentsData = studentsWithStats
      } else {
        // Se a API falhar, inicializar com dados vazios
        studentsData = []
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
        const activeStudents = studentsData.filter(s => s.attendanceRate >= 80).length

        setStats({
          totalStudents: studentsData.length,
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
  }, [message])

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
  }, [router, loadData])

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

  const getTimeUntilExpiration = (createdAt: string) => {
    const created = new Date(createdAt)
    const expirationTime = new Date(created.getTime() + (72 * 60 * 60 * 1000)) // 72 horas
    const now = new Date()
    const timeLeft = expirationTime.getTime() - now.getTime()
    
    if (timeLeft <= 0) {
      return { expired: true, timeLeft: 0, text: 'Expirado', color: 'red' }
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    
    // Determinar cor baseada no tempo restante
    let color = 'green'
    if (hours < 12) color = 'red'
    else if (hours < 24) color = 'orange'
    
    return {
      expired: false,
      timeLeft,
      text: `${hours}h ${minutes}m`,
      color
    }
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
      title: 'Tempo Restante',
      dataIndex: 'createdAt',
      key: 'timeLeft',
      render: (createdAt: string) => {
        const timeInfo = getTimeUntilExpiration(createdAt)
        return (
          <Tag color={timeInfo.color}>
            {timeInfo.expired ? '⏰ Expirado' : `⏱️ ${timeInfo.text}`}
          </Tag>
        )
      }
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
      title: 'Aluno',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: StudentStats) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: getBeltColor(record.belt),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: record.belt === 'Branca' ? '#000' : '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              border: '2px solid #ffffff20'
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: '500', fontSize: '14px' }}>
              {name}
            </div>
            <div style={{ 
              color: '#b9bbbe', 
              fontSize: '12px',
              marginTop: '2px'
            }}>
              Faixa {record.belt}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 180,
      render: (_: any, record: StudentStats) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#b9bbbe', fontSize: '12px' }}>Frequência:</span>
            <span style={{ 
              color: record.attendanceRate >= 90 ? '#52c41a' : record.attendanceRate >= 80 ? '#faad14' : '#ff4d4f',
              fontWeight: '600',
              fontSize: '13px'
            }}>
              {record.attendanceRate.toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#b9bbbe', fontSize: '12px' }}>Check-ins:</span>
            <span style={{ color: '#ffffff', fontWeight: '500', fontSize: '13px' }}>
              {record.totalCheckIns}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#b9bbbe', fontSize: '12px' }}>Aprovados:</span>
            <span style={{ color: '#52c41a', fontWeight: '500', fontSize: '13px' }}>
              {record.approvedCheckIns}
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: StudentStats) => {
        const getStatusInfo = () => {
          if (record.attendanceRate >= 90) {
            return { text: 'Excelente', color: '#52c41a', bgColor: '#52c41a20' };
          } else if (record.attendanceRate >= 80) {
            return { text: 'Bom', color: '#faad14', bgColor: '#faad1420' };
          } else if (record.attendanceRate >= 60) {
            return { text: 'Regular', color: '#ff7a45', bgColor: '#ff7a4520' };
          } else {
            return { text: 'Baixo', color: '#ff4d4f', bgColor: '#ff4d4f20' };
          }
        };
        
        const status = getStatusInfo();
        
        return (
          <div style={{
            padding: '6px 12px',
            borderRadius: '16px',
            backgroundColor: status.bgColor,
            border: `1px solid ${status.color}30`,
            textAlign: 'center'
          }}>
            <span style={{ 
              color: status.color,
              fontWeight: '600',
              fontSize: '12px'
            }}>
              {status.text}
            </span>
          </div>
        );
      }
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: any, record: StudentStats) => (
        <Space size="small">
          <Tooltip title="Ver detalhes do aluno">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ 
                color: '#7289da',
                border: '1px solid #7289da30',
                backgroundColor: '#7289da10'
              }}
              onClick={async () => {
                try {
                  // Buscar dados completos do aluno
                  const token = localStorage.getItem('token')
                  const response = await fetch(`/api/users/${record.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  
                  let fullStudentData = null
                  if (response.ok) {
                    fullStudentData = await response.json()
                  }

                  // Calcular idade se birthDate existir
                  const calculateAge = (birthDate: string) => {
                    if (!birthDate) return 'Não informado'
                    const today = new Date()
                    const birth = new Date(birthDate)
                    let age = today.getFullYear() - birth.getFullYear()
                    const monthDiff = today.getMonth() - birth.getMonth()
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                      age--
                    }
                    return `${age} anos`
                  }

                  Modal.info({
                    title: `📋 Detalhes de ${record.name}`,
                    width: 600,
                    content: (
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {/* Informações Básicas */}
                        <div style={{ 
                          background: '#2f3136', 
                          padding: '16px', 
                          borderRadius: '8px', 
                          marginBottom: '16px',
                          border: '1px solid #5c6370'
                        }}>
                          <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                            📊 Informações Básicas
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>📧 Email:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>{record.email}</div>
                            </div>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>🥋 Faixa:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>{record.belt}</div>
                            </div>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>🎂 Idade:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>
                                {fullStudentData?.birthDate ? calculateAge(fullStudentData.birthDate) : 'Não informado'}
                              </div>
                            </div>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>⚖️ Peso:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>
                                {fullStudentData?.weight ? `${fullStudentData.weight} kg` : 'Não informado'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contato */}
                        <div style={{ 
                          background: '#2f3136', 
                          padding: '16px', 
                          borderRadius: '8px', 
                          marginBottom: '16px',
                          border: '1px solid #5c6370'
                        }}>
                          <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                            📞 Contato e Endereço
                          </h4>
                          <div style={{ display: 'grid', gap: '12px' }}>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>🚨 Contato de Emergência:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>
                                {fullStudentData?.emergencyContact ? (
                                  <>
                                    <div>{fullStudentData.emergencyContact}</div>
                                    {fullStudentData.emergencyPhone && (
                                      <div style={{ color: '#43b581', fontWeight: '500' }}>
                                        📱 {fullStudentData.emergencyPhone}
                                      </div>
                                    )}
                                  </>
                                ) : 'Não informado'}
                              </div>
                            </div>
                            <div>
                              <strong style={{ color: '#b9bbbe' }}>🏠 Endereço:</strong>
                              <div style={{ color: '#ffffff', marginTop: '4px' }}>
                                {fullStudentData?.address || 'Não informado'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div style={{ 
                          background: '#2f3136', 
                          padding: '16px', 
                          borderRadius: '8px',
                          border: '1px solid #5c6370'
                        }}>
                          <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                            📈 Performance e Frequência
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <strong style={{ color: '#b9bbbe' }}>Total Check-ins</strong>
                              <div style={{ 
                                color: '#ffffff', 
                                fontSize: '20px', 
                                fontWeight: 'bold',
                                marginTop: '4px'
                              }}>
                                {record.totalCheckIns}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <strong style={{ color: '#b9bbbe' }}>Aprovados</strong>
                              <div style={{ 
                                color: '#52c41a', 
                                fontSize: '20px', 
                                fontWeight: 'bold',
                                marginTop: '4px'
                              }}>
                                {record.approvedCheckIns}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <strong style={{ color: '#b9bbbe' }}>Frequência</strong>
                              <div style={{ 
                                color: record.attendanceRate >= 90 ? '#52c41a' : 
                                      record.attendanceRate >= 80 ? '#faad14' : '#ff4d4f',
                                fontSize: '20px', 
                                fontWeight: 'bold',
                                marginTop: '4px'
                              }}>
                                {record.attendanceRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                    okText: 'Fechar',
                    okButtonProps: { 
                      style: { 
                        background: '#7289da', 
                        borderColor: '#7289da',
                        height: '40px',
                        fontSize: '14px'
                      } 
                    }
                  })
                } catch (error) {
                  console.error('Erro ao carregar detalhes do aluno:', error)
                  // Fallback para o modal simples
                  Modal.info({
                    title: `Detalhes de ${record.name}`,
                    content: (
                      <div style={{ color: '#ffffff' }}>
                        <p><strong>Email:</strong> {record.email}</p>
                        <p><strong>Faixa:</strong> {record.belt}</p>
                        <p><strong>Total de Check-ins:</strong> {record.totalCheckIns}</p>
                        <p><strong>Check-ins Aprovados:</strong> {record.approvedCheckIns}</p>
                        <p><strong>Taxa de Frequência:</strong> {record.attendanceRate.toFixed(1)}%</p>
                      </div>
                    ),
                    okText: 'Fechar',
                    okButtonProps: { style: { background: '#7289da', borderColor: '#7289da' } }
                  })
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Editar informações">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ 
                color: '#52c41a',
                border: '1px solid #52c41a30',
                backgroundColor: '#52c41a10'
              }}
              onClick={() => {
                // Implementar edição
                // TODO: Implementar funcionalidade de edição
              }}
            />
          </Tooltip>
        </Space>
      )
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
              Lista Alunos
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Visualizar contato dos seus alunos
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

      {/* Segunda linha de cards */}
      <Row gutter={[24, 24]} justify="center" className="mt-6">
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
            onClick={() => setCurrentView(ProfessorView.STUDENT_MANAGEMENT)}
          >
            <UserAddOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#ffffff', textAlign: 'center', margin: 0 }}>
              Gestão de Alunos
            </Title>
            <Text style={{ color: '#b9bbbe', textAlign: 'center', marginTop: '8px' }}>
              Promover usuários e editar faixas
            </Text>
            <Tag color="green" style={{ marginTop: '8px' }}>
              Novo
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

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div>
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

                    <div className="grid grid-cols-3 gap-3 mb-4">
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
                      <div>
                        <Text style={{ color: '#b9bbbe', fontSize: '12px', display: 'block' }}>
                          Tempo Restante
                        </Text>
                        {(() => {
                          const timeInfo = getTimeUntilExpiration(checkIn.createdAt)
                          return (
                            <Tag color={timeInfo.color} style={{ margin: 0, fontSize: '11px' }}>
                              {timeInfo.expired ? '⏰ Expirado' : `⏱️ ${timeInfo.text}`}
                            </Tag>
                          )
                        })()}
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
          {renderHeader('')}
          
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
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#40444b',
                  borderRadius: '8px',
                  border: '1px solid #5c6370'
                }}>
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-5">
                    {/* Search Input - Full width on mobile */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <SearchOutlined style={{ color: '#7289da', fontSize: '16px' }} />
                        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                          Buscar Aluno
                        </span>
                      </div>
                      <Input
                        placeholder="Digite o nome do aluno..."
                        prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#2f3136',
                          border: searchTerm ? '2px solid #7289da' : '1px solid #5c6370',
                          color: '#ffffff',
                          borderRadius: '12px',
                          height: '48px',
                          fontSize: '16px'
                        }}
                        className="search-input"
                        suffix={
                          searchTerm && (
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => setSearchTerm('')}
                              style={{ 
                                color: '#b9bbbe',
                                padding: '2px',
                                minWidth: 'auto',
                                height: 'auto'
                              }}
                            />
                          )
                        }
                      />
                    </div>
                    
                    {/* Filter Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FilterOutlined style={{ color: '#7289da', fontSize: '16px' }} />
                        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                          Filtrar por Faixa
                        </span>
                        {filterBelt && (
                          <div style={{
                            background: '#7289da',
                            color: '#ffffff',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}>
                            ATIVO
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Select
                          placeholder="Selecione uma faixa"
                          value={filterBelt}
                          onChange={setFilterBelt}
                          style={{ 
                            flex: 1,
                            background: '#2f3136'
                          }}
                          className="filter-select"
                          suffixIcon={<FilterOutlined style={{ color: '#b9bbbe' }} />}
                          size="large"
                          dropdownStyle={{
                            background: '#36393f',
                            border: '1px solid #5c6370'
                          }}
                        >
                          <Option value="">🎯 Todas as Faixas</Option>
                          <Option value="Branca">🤍 Faixa Branca</Option>
                          <Option value="Azul">🔵 Faixa Azul</Option>
                          <Option value="Roxa">🟣 Faixa Roxa</Option>
                          <Option value="Marrom">🤎 Faixa Marrom</Option>
                          <Option value="Preta">⚫ Faixa Preta</Option>
                        </Select>
                      </div>
                    </div>


                    
                    {/* Results Counter */}
                    <div className="flex items-center p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border border-gray-600">
                      <div className="flex items-center gap-3">
                        <div style={{
                          background: '#7289da',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TeamOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                        </div>
                        <div>
                          <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''}
                          </div>
                          <div style={{ color: '#b9bbbe', fontSize: '12px' }}>
                            {searchTerm || filterBelt ? 'Filtrado' + (filteredStudents.length !== 1 ? 's' : '') : 'Total'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Input
                        placeholder="Buscar aluno por nome..."
                        prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '280px',
                          background: '#36393f',
                          border: '1px solid #5c6370',
                          color: '#ffffff',
                          borderRadius: '6px'
                        }}
                        className="search-input"
                      />
                      <Select
                        placeholder="Filtrar por faixa"
                        value={filterBelt}
                        onChange={setFilterBelt}
                        style={{ 
                          width: '160px',
                          background: '#36393f'
                        }}
                        className="filter-select"
                        suffixIcon={<FilterOutlined style={{ color: '#b9bbbe' }} />}
                      >
                        <Option value="">Todas as faixas</Option>
                        <Option value="Branca">🤍 Branca</Option>
                        <Option value="Azul">🔵 Azul</Option>
                        <Option value="Roxa">🟣 Roxa</Option>
                        <Option value="Marrom">🤎 Marrom</Option>
                        <Option value="Preta">⚫ Preta</Option>
                      </Select>
                    </div>
                    
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{ 
                        color: '#b9bbbe', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <TeamOutlined style={{ color: '#7289da' }} />
                        <span>
                          {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} 
                          {searchTerm || filterBelt ? ' encontrado' + (filteredStudents.length !== 1 ? 's' : '') : ''}
                        </span>
                      </div>
                      
                      {(searchTerm || filterBelt) && (
                        <Button
                          type="text"
                          size="small"
                          onClick={() => {
                            setSearchTerm('');
                            setFilterBelt('');
                          }}
                          style={{
                            color: '#ff7a45',
                            fontSize: '12px',
                            padding: '4px 8px',
                            height: 'auto'
                          }}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table
                    columns={studentColumns}
                    dataSource={filteredStudents}
                    rowKey="id"
                    pagination={{ 
                      pageSize: 8,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      pageSizeOptions: ['8', '16', '24'],
                      showTotal: (total, range) => (
                        <span style={{ color: '#b9bbbe', fontSize: '13px' }}>
                          Exibindo {range[0]}-{range[1]} de {total} alunos
                        </span>
                      ),
                      style: { marginTop: '16px' }
                    }}
                    scroll={{ x: 720 }}
                    style={{ background: 'transparent' }}
                    className="custom-table"
                    size="middle"
                    rowClassName={(record, index) => 
                      index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                    }
                  />
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      style={{ 
                        background: '#36393f', 
                        border: '1px solid #5c6370',
                        borderRadius: '12px'
                      }}
                      bodyStyle={{ padding: '16px' }}
                    >
                      {/* Header com nome e faixa */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: student.belt === 'Branca' ? '#ffffff' :
                                         student.belt === 'Azul' ? '#1890ff' :
                                         student.belt === 'Roxa' ? '#722ed1' :
                                         student.belt === 'Marrom' ? '#8b4513' :
                                         student.belt === 'Preta' ? '#000000' : '#d9d9d9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: student.belt === 'Branca' ? '2px solid #d9d9d9' : 'none',
                              flexShrink: 0
                            }}
                          >
                            <Image 
                              src="/logo.png" 
                              alt="BJJ Logo" 
                              width={32} 
                              height={32}
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Text strong style={{ color: '#ffffff', fontSize: '16px', display: 'block' }}>
                              {student.name}
                            </Text>
                            <Text style={{ color: '#b9bbbe', fontSize: '13px', display: 'block' }}>
                              {student.email}
                            </Text>
                          </div>
                        </div>
                        <Tag 
                          color={student.belt === 'Branca' ? 'default' :
                                 student.belt === 'Azul' ? 'blue' :
                                 student.belt === 'Roxa' ? 'purple' :
                                 student.belt === 'Marrom' ? 'orange' :
                                 student.belt === 'Preta' ? 'black' : 'default'}
                          style={{ margin: 0, fontSize: '12px' }}
                        >
                          {student.belt}
                        </Tag>
                      </div>

                      {/* Estatísticas em grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-700 rounded-lg">
                          <Text style={{ color: '#b9bbbe', fontSize: '11px', display: 'block' }}>
                            Check-ins
                          </Text>
                          <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>
                            {student.totalCheckIns}
                          </Text>
                        </div>
                        <div className="text-center p-2 bg-gray-700 rounded-lg">
                          <Text style={{ color: '#b9bbbe', fontSize: '11px', display: 'block' }}>
                            Aprovados
                          </Text>
                          <Text strong style={{ color: '#43b581', fontSize: '16px' }}>
                            {student.approvedCheckIns}
                          </Text>
                        </div>
                      </div>

                      {/* Taxa de frequência */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>
                            Taxa de Frequência
                          </Text>
                          <Text strong style={{ 
                            color: student.attendanceRate >= 80 ? '#43b581' : 
                                   student.attendanceRate >= 60 ? '#faa61a' : '#f04747',
                            fontSize: '14px'
                          }}>
                            {student.attendanceRate.toFixed(1)}%
                          </Text>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#40444b',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${student.attendanceRate}%`,
                            height: '100%',
                            backgroundColor: student.attendanceRate >= 80 ? '#43b581' : 
                                           student.attendanceRate >= 60 ? '#faa61a' : '#f04747',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Botão de ação */}
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={async () => {
                          try {
                            // Buscar dados completos do aluno
                            const token = localStorage.getItem('token')
                            const response = await fetch(`/api/users/${student.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            })
                            
                            let fullStudentData = null
                            if (response.ok) {
                              fullStudentData = await response.json()
                            }

                            // Calcular idade se birthDate existir
                            const calculateAge = (birthDate: string) => {
                              if (!birthDate) return 'Não informado'
                              const today = new Date()
                              const birth = new Date(birthDate)
                              let age = today.getFullYear() - birth.getFullYear()
                              const monthDiff = today.getMonth() - birth.getMonth()
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                age--
                              }
                              return `${age} anos`
                            }

                            // Detectar se é mobile
                            const isMobile = window.innerWidth < 768;
                            
                            Modal.info({
                              title: (
                                <span style={{ color: '#ffffff' }}>
                                  Detalhes de {student.name}
                                </span>
                              ),
                              width: isMobile ? '95%' : 600,
                              style: {
                                backgroundColor: '#2f3136'
                              },
                              bodyStyle: {
                                backgroundColor: '#2f3136',
                                padding: '0'
                              },
                              maskStyle: {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)'
                              },
                              className: 'dark-modal',
                              content: (
                                <div style={{ color: '#ffffff', fontSize: '14px', backgroundColor: '#2f3136' }}>
                                  {/* Versão Mobile - Apenas Contato e Endereço */}
                                  {isMobile ? (
                                    <div style={{ 
                                      background: '#2f3136', 
                                      padding: '20px', 
                                      borderRadius: '8px',
                                      border: '1px solid #404249'
                                    }}>
                                      <h4 style={{ 
                                        color: '#ffffff', 
                                        margin: '0 0 20px 0', 
                                        fontSize: '18px', 
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        borderBottom: '1px solid #404249',
                                        paddingBottom: '12px'
                                      }}>
                                        Informações de Contato
                                      </h4>
                                      <div style={{ display: 'grid', gap: '20px' }}>
                                        <div>
                                          <div style={{ 
                                            marginBottom: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#b9bbbe',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                          }}>
                                            Contato de Emergência
                                          </div>
                                          <div style={{ 
                                            background: '#36393f', 
                                            padding: '16px', 
                                            borderRadius: '6px',
                                            border: '1px solid #404249'
                                          }}>
                                            {fullStudentData?.emergencyContact ? (
                                              <>
                                                <div style={{ 
                                                  fontSize: '16px', 
                                                  fontWeight: '500',
                                                  color: '#ffffff',
                                                  marginBottom: '12px'
                                                }}>
                                                  {fullStudentData.emergencyContact}
                                                </div>
                                                {fullStudentData.emergencyPhone && (
                                                  <div 
                                                    style={{ 
                                                      fontSize: '16px',
                                                      fontWeight: '500',
                                                      color: '#7289da',
                                                      cursor: 'pointer',
                                                      padding: '8px 12px',
                                                      background: '#2f3136',
                                                      borderRadius: '4px',
                                                      border: '1px solid #404249',
                                                      transition: 'all 0.2s ease',
                                                      userSelect: 'none'
                                                    }}
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(fullStudentData.emergencyPhone)
                                                      message.success('Telefone copiado!')
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      (e.target as HTMLElement).style.background = '#404249';
                                                      (e.target as HTMLElement).style.color = '#ffffff'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      (e.target as HTMLElement).style.background = '#2f3136';
                                                      (e.target as HTMLElement).style.color = '#7289da'
                                                    }}
                                                  >
                                                    {fullStudentData.emergencyPhone}
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <span style={{ 
                                                color: '#72767d', 
                                                fontStyle: 'italic',
                                                fontSize: '14px'
                                              }}>
                                                Não informado
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ 
                                            marginBottom: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#b9bbbe',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                          }}>
                                            Endereço
                                          </div>
                                          <div style={{ 
                                            background: '#36393f', 
                                            padding: '16px', 
                                            borderRadius: '6px',
                                            border: '1px solid #404249',
                                            minHeight: '60px',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}>
                                            <span style={{ 
                                              fontSize: '15px', 
                                              lineHeight: '1.5',
                                              color: fullStudentData?.address ? '#ffffff' : '#72767d',
                                              fontStyle: fullStudentData?.address ? 'normal' : 'italic'
                                            }}>
                                              {fullStudentData?.address || 'Não informado'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Versão Desktop - Todas as informações */
                                    <>
                                      {/* Informações Básicas */}
                                      <div style={{ 
                                        background: '#2f3136', 
                                        padding: '16px', 
                                        borderRadius: '8px', 
                                        marginBottom: '16px',
                                        border: '1px solid #5c6370'
                                      }}>
                                        <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                                          📊 Informações Básicas
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>📧 Email:</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span>{student.email}</span>
                                              <Button
                                                type="text"
                                                size="small"
                                                icon={<CopyOutlined />}
                                                style={{ 
                                                  color: '#7289da',
                                                  padding: '0 4px',
                                                  minWidth: 'auto',
                                                  height: 'auto'
                                                }}
                                                onClick={() => {
                                                  navigator.clipboard.writeText(student.email)
                                                  message.success('Email copiado!')
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>🥋 Faixa:</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span>{student.belt}</span>
                                              <Button
                                                type="text"
                                                size="small"
                                                icon={<CopyOutlined />}
                                                style={{ 
                                                  color: '#7289da',
                                                  padding: '0 4px',
                                                  minWidth: 'auto',
                                                  height: 'auto'
                                                }}
                                                onClick={() => {
                                                  navigator.clipboard.writeText(student.belt)
                                                  message.success('Faixa copiada!')
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>🎂 Idade:</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span>
                                                {fullStudentData?.birthDate ? calculateAge(fullStudentData.birthDate) : 'Não informado'}
                                              </span>
                                              {fullStudentData?.birthDate && (
                                                <Button
                                                  type="text"
                                                  size="small"
                                                  icon={<CopyOutlined />}
                                                  style={{ 
                                                    color: '#7289da',
                                                    padding: '0 4px',
                                                    minWidth: 'auto',
                                                    height: 'auto'
                                                  }}
                                                  onClick={() => {
                                                    const age = calculateAge(fullStudentData.birthDate)
                                                    navigator.clipboard.writeText(age.toString())
                                                    message.success('Idade copiada!')
                                                  }}
                                                />
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>⚖️ Peso:</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span>
                                                {fullStudentData?.weight ? `${fullStudentData.weight} kg` : 'Não informado'}
                                              </span>
                                              {fullStudentData?.weight && (
                                                <Button
                                                  type="text"
                                                  size="small"
                                                  icon={<CopyOutlined />}
                                                  style={{ 
                                                    color: '#7289da',
                                                    padding: '0 4px',
                                                    minWidth: 'auto',
                                                    height: 'auto'
                                                  }}
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(`${fullStudentData.weight} kg`)
                                                    message.success('Peso copiado!')
                                                  }}
                                                />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Contato */}
                                      <div style={{ 
                                        background: '#2f3136', 
                                        padding: '16px', 
                                        borderRadius: '8px', 
                                        marginBottom: '16px',
                                        border: '1px solid #5c6370'
                                      }}>
                                        <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                                          📞 Contato e Endereço
                                        </h4>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>🚨 Contato de Emergência:</strong>
                                            <div style={{ color: '#ffffff', marginTop: '4px' }}>
                                              {fullStudentData?.emergencyContact ? (
                                                <>
                                                  <div style={{ 
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '4px'
                                                  }}>
                                                    <span>{fullStudentData.emergencyContact}</span>
                                                    <Button
                                                      type="text"
                                                      size="small"
                                                      icon={<CopyOutlined />}
                                                      style={{ 
                                                        color: '#7289da',
                                                        padding: '0 4px',
                                                        minWidth: 'auto',
                                                        height: 'auto'
                                                      }}
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(fullStudentData.emergencyContact)
                                                        message.success('Contato de emergência copiado!')
                                                      }}
                                                    />
                                                  </div>
                                                  {fullStudentData.emergencyPhone && (
                                                    <div style={{ 
                                                      color: '#43b581', 
                                                      fontWeight: '500',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'space-between'
                                                    }}>
                                                      <span>📱 {fullStudentData.emergencyPhone}</span>
                                                      <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<CopyOutlined />}
                                                        style={{ 
                                                          color: '#7289da',
                                                          padding: '0 4px',
                                                          minWidth: 'auto',
                                                          height: 'auto'
                                                        }}
                                                        onClick={() => {
                                                          navigator.clipboard.writeText(fullStudentData.emergencyPhone)
                                                          message.success('Telefone de emergência copiado!')
                                                        }}
                                                      />
                                                    </div>
                                                  )}
                                                </>
                                              ) : 'Não informado'}
                                            </div>
                                          </div>
                                          <div>
                                            <strong style={{ color: '#b9bbbe' }}>🏠 Endereço:</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              marginTop: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between'
                                            }}>
                                              <span style={{ flex: 1, marginRight: '8px' }}>
                                                {fullStudentData?.address || 'Não informado'}
                                              </span>
                                              {fullStudentData?.address && (
                                                <Button
                                                  type="text"
                                                  size="small"
                                                  icon={<CopyOutlined />}
                                                  style={{ 
                                                    color: '#7289da',
                                                    padding: '0 4px',
                                                    minWidth: 'auto',
                                                    height: 'auto'
                                                  }}
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(fullStudentData.address)
                                                    message.success('Endereço copiado!')
                                                  }}
                                                />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Performance */}
                                      <div style={{ 
                                        background: '#2f3136', 
                                        padding: '16px', 
                                        borderRadius: '8px',
                                        border: '1px solid #5c6370'
                                      }}>
                                        <h4 style={{ color: '#7289da', margin: '0 0 12px 0', fontSize: '16px' }}>
                                          📈 Performance e Frequência
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                          <div style={{ textAlign: 'center' }}>
                                            <strong style={{ color: '#b9bbbe' }}>Total Check-ins</strong>
                                            <div style={{ 
                                              color: '#ffffff', 
                                              fontSize: '20px', 
                                              fontWeight: 'bold',
                                              marginTop: '4px'
                                            }}>
                                              {student.totalCheckIns}
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'center' }}>
                                            <strong style={{ color: '#b9bbbe' }}>Aprovados</strong>
                                            <div style={{ 
                                              color: '#52c41a', 
                                              fontSize: '20px', 
                                              fontWeight: 'bold',
                                              marginTop: '4px'
                                            }}>
                                              {student.approvedCheckIns}
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'center' }}>
                                            <strong style={{ color: '#b9bbbe' }}>Frequência</strong>
                                            <div style={{ 
                                              color: student.attendanceRate >= 90 ? '#52c41a' : 
                                                    student.attendanceRate >= 80 ? '#faad14' : '#ff4d4f',
                                              fontSize: '20px', 
                                              fontWeight: 'bold',
                                              marginTop: '4px'
                                            }}>
                                              {student.attendanceRate.toFixed(1)}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ),
                              okText: 'Fechar',
                              okButtonProps: { 
                                style: { 
                                  background: '#7289da', 
                                  borderColor: '#7289da',
                                  height: '40px',
                                  fontSize: '14px'
                                } 
                              },
                              footer: (
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '8px', 
                                  justifyContent: 'center',
                                  flexWrap: 'wrap',
                                  padding: '8px 0'
                                }}>
                                  <Button
                                     key="copy-all"
                                     icon={<CopyOutlined />}
                                     style={{ 
                                       background: '#43b581', 
                                       borderColor: '#43b581',
                                       color: '#ffffff',
                                       height: '44px',
                                       fontSize: '16px',
                                       minWidth: '120px',
                                       flex: '1',
                                       maxWidth: '150px',
                                       borderRadius: '8px',
                                       fontWeight: '500'
                                     }}
                                    onClick={() => {
                                      const allInfo = [
                                        `Nome: ${student.name}`,
                                        `Email: ${student.email}`,
                                        `Faixa: ${student.belt}`,
                                        fullStudentData?.birthDate ? `Idade: ${calculateAge(fullStudentData.birthDate)}` : null,
                                        fullStudentData?.weight ? `Peso: ${fullStudentData.weight} kg` : null,
                                        fullStudentData?.emergencyContact ? `Contato de Emergência: ${fullStudentData.emergencyContact}` : null,
                                        fullStudentData?.emergencyPhone ? `Telefone de Emergência: ${fullStudentData.emergencyPhone}` : null,
                                        fullStudentData?.address ? `Endereço: ${fullStudentData.address}` : null,
                                        `Total Check-ins: ${student.totalCheckIns}`,
                                        `Check-ins Aprovados: ${student.approvedCheckIns}`,
                                        `Frequência: ${student.attendanceRate.toFixed(1)}%`
                                      ].filter(Boolean).join('\n')
                                      
                                      navigator.clipboard.writeText(allInfo)
                                      message.success('Todas as informações copiadas!')
                                    }}
                                  >
                                    Copiar Tudo
                                  </Button>
                                  <Button
                                     key="close"
                                     style={{ 
                                       background: '#7289da', 
                                       borderColor: '#7289da',
                                       color: '#ffffff',
                                       height: '44px',
                                       fontSize: '16px',
                                       minWidth: '80px',
                                       flex: '1',
                                       maxWidth: '100px',
                                       borderRadius: '8px',
                                       fontWeight: '500'
                                     }}
                                    onClick={() => Modal.destroyAll()}
                                  >
                                    Fechar
                                  </Button>
                                </div>
                              )
                            })
                          } catch (error) {
                            console.error('Erro ao carregar detalhes do aluno:', error)
                            // Fallback para o modal simples
                            Modal.info({
                              title: `Detalhes de ${student.name}`,
                              content: (
                                <div style={{ color: '#ffffff' }}>
                                  <p><strong>Email:</strong> {student.email}</p>
                                  <p><strong>Faixa:</strong> {student.belt}</p>
                                  <p><strong>Total de Check-ins:</strong> {student.totalCheckIns}</p>
                                  <p><strong>Check-ins Aprovados:</strong> {student.approvedCheckIns}</p>
                                  <p><strong>Taxa de Frequência:</strong> {student.attendanceRate.toFixed(1)}%</p>
                                </div>
                              ),
                              okText: 'Fechar',
                              okButtonProps: { style: { background: '#7289da', borderColor: '#7289da' } }
                            })
                          }
                        }}
                        style={{ 
                          width: '100%',
                          background: '#7289da',
                          borderColor: '#7289da',
                          height: '40px',
                          fontSize: '14px'
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </Card>
                  ))}

                  {/* Mobile Pagination */}
                  {filteredStudents.length > 6 && (
                    <div className="text-center mt-6 p-4 bg-gray-800 rounded-lg">
                      <Text style={{ color: '#b9bbbe', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                        Mostrando {Math.min(6, filteredStudents.length)} de {filteredStudents.length} alunos
                      </Text>
                      <Button 
                        type="primary" 
                        style={{ background: '#7289da', borderColor: '#7289da' }}
                        size="small"
                      >
                        Carregar Mais
                      </Button>
                    </div>
                  )}
                </div>
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
        <Row gutter={[12, 12]} className="mb-6 md:mb-8">
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#36393f', 
                border: '1px solid #5c6370',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
              bodyStyle={{ 
                padding: window.innerWidth < 768 ? '20px 16px' : '16px 12px',
                textAlign: 'center'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#b9bbbe', 
                    fontSize: window.innerWidth < 768 ? '14px' : '12px',
                    fontWeight: '500'
                  }}>
                    Total de Alunos
                  </span>
                }
                value={stats.totalStudents}
                prefix={<TeamOutlined style={{ 
                  color: '#7289da', 
                  fontSize: window.innerWidth < 768 ? '20px' : '16px',
                  marginRight: '8px'
                }} />}
                valueStyle={{ 
                  color: '#ffffff', 
                  fontSize: window.innerWidth < 768 ? '28px' : '20px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#36393f', 
                border: '1px solid #5c6370',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
              bodyStyle={{ 
                padding: window.innerWidth < 768 ? '20px 16px' : '16px 12px',
                textAlign: 'center'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#b9bbbe', 
                    fontSize: window.innerWidth < 768 ? '14px' : '12px',
                    fontWeight: '500'
                  }}>
                    Alunos Ativos
                  </span>
                }
                value={stats.activeStudents}
                prefix={<UserOutlined style={{ 
                  color: '#43b581', 
                  fontSize: window.innerWidth < 768 ? '20px' : '16px',
                  marginRight: '8px'
                }} />}
                valueStyle={{ 
                  color: '#43b581', 
                  fontSize: window.innerWidth < 768 ? '28px' : '20px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#36393f', 
                border: '1px solid #5c6370',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
              bodyStyle={{ 
                padding: window.innerWidth < 768 ? '20px 16px' : '16px 12px',
                textAlign: 'center'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#b9bbbe', 
                    fontSize: window.innerWidth < 768 ? '14px' : '12px',
                    fontWeight: '500'
                  }}>
                    Check-ins Pendentes
                  </span>
                }
                value={stats.pendingApprovals}
                prefix={<ClockCircleOutlined style={{ 
                  color: '#faa61a', 
                  fontSize: window.innerWidth < 768 ? '20px' : '16px',
                  marginRight: '8px'
                }} />}
                valueStyle={{ 
                  color: '#faa61a', 
                  fontSize: window.innerWidth < 768 ? '28px' : '20px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#36393f', 
                border: '1px solid #5c6370',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }} 
              bodyStyle={{ 
                padding: window.innerWidth < 768 ? '20px 16px' : '16px 12px',
                textAlign: 'center'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#b9bbbe', 
                    fontSize: window.innerWidth < 768 ? '14px' : '12px',
                    fontWeight: '500'
                  }}>
                    Check-ins Hoje
                  </span>
                }
                value={stats.todayCheckIns}
                prefix={<CalendarOutlined style={{ 
                  color: '#43b581', 
                  fontSize: window.innerWidth < 768 ? '20px' : '16px',
                  marginRight: '8px'
                }} />}
                valueStyle={{ 
                  color: '#43b581', 
                  fontSize: window.innerWidth < 768 ? '28px' : '20px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Gráficos e Análises */}
        {/* <Row gutter={[16, 16]} className="mb-6 md:mb-8">
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
                  <RechartsTooltip 
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
                  <RechartsTooltip 
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
        </Row> */}

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
                  <RechartsTooltip 
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

        {currentView === ProfessorView.STUDENT_MANAGEMENT && (
          <div className="max-w-7xl mx-auto">
            {renderHeader('Gestão de Alunos')}
            <StudentManagement />
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
          
          /* Melhorar layout dos modais em mobile */
          .ant-modal {
            margin: 16px !important;
            max-width: calc(100vw - 32px) !important;
          }
          
          .ant-modal-content {
            border-radius: 12px !important;
          }
          
          .ant-modal-footer {
            padding: 16px 24px !important;
            border-top: 1px solid #5c6370 !important;
          }
          
          /* Botões do modal responsivos */
          .ant-modal-footer .ant-btn {
            height: 44px !important;
            font-size: 16px !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
          }
        }
      `}</style>
      </div>
    </DashboardLayout>
  )
}