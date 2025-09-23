'use client'

import React, { useState, useEffect } from 'react'
import { Card, Typography, Row, Col, Avatar, Tag, Spin, Statistic, Button, message } from 'antd'
import { TeamOutlined, CalendarOutlined, TrophyOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

interface StudentData {
  id: number
  name: string
  avatar?: string
  totalCheckIns: number
  weeklyCheckIns: number
  monthlyCheckIns: number
  frequency: number
  lastCheckIn: string
  belt: string
  beltLevel: string
  joinDate: string
}

interface StatsData {
  totalActiveStudents: number
  averageFrequency: number
  currentUserFrequency: number
}

export default function RankingAluno() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [alunosFrequentes, setAlunosFrequentes] = useState<StudentData[]>([])
  const [stats, setStats] = useState<StatsData>({ totalActiveStudents: 0, averageFrequency: 0, currentUserFrequency: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const getBeltColor = (beltLevel: string) => {
    const colors = {
      branca: '#ffffff',
      azul: '#1890ff',
      roxa: '#722ed1',
      marrom: '#8b4513',
      preta: '#000000',
    }
    return colors[beltLevel as keyof typeof colors] || '#ffffff'
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      router.push('/login')
      return
    }

    const loadStudentsData = async () => {
      try {

        const response = await fetch('/api/students/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAlunosFrequentes(data.students)
          setStats(data.stats)
        } else {
          message.error('Erro ao carregar dados dos alunos')
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        message.error('Erro ao conectar com o servidor')
      } finally {
        setLoading(false)
      }
    }

    loadStudentsData()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
      <div>
        <div className="hidden md:flex items-center gap-3 mb-4">
           <Button
             type="text"
             icon={<ArrowLeftOutlined />}
             onClick={() => router.push('/dashboard/aluno')}
             style={{
               color: '#b9bbbe',
               border: '1px solid #5c6370',
               background: '#36393f'
             }}
             className="flex items-center justify-center hover:bg-gray-600 transition-colors"
           >
             <span>Voltar ao Dashboard</span>
           </Button>
         </div>
        <Title level={2} className="text-white mb-2">
          Frequência dos Alunos
        </Title>
        <Text className="text-gray-400">
          Acompanhe a frequência e compare com seus colegas
        </Text>
      </div>

      {/* Estatísticas Gerais */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Total de Alunos Ativos</span>}
              value={stats.totalActiveStudents}
              prefix={<TeamOutlined style={{ color: '#7289da', fontSize: '16px' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Frequência Média</span>}
              value={stats.averageFrequency}
              suffix="%"
              prefix={<CalendarOutlined style={{ color: '#43b581', fontSize: '16px' }} />}
              valueStyle={{ color: '#43b581', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#36393f', border: '1px solid #5c6370' }}>
            <Statistic
              title={<span style={{ color: '#b9bbbe', fontSize: '12px' }}>Maior Frequência</span>}
              value={alunosFrequentes.length > 0 ? Math.max(...alunosFrequentes.map(a => a.frequency)) : 0}
              suffix="%"
              prefix={<UserOutlined style={{ color: '#ffd700', fontSize: '16px' }} />}
              valueStyle={{ color: '#ffd700', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Lista de Alunos */}
      <Row gutter={[16, 16]}>
        {alunosFrequentes.length === 0 ? (
          <Col xs={24}>
            <Card style={{ background: '#36393f', border: '1px solid #5c6370', textAlign: 'center' }}>
              <Text style={{ color: '#b9bbbe' }}>
                Nenhum aluno ativo encontrado nos últimos 30 dias.
              </Text>
            </Card>
          </Col>
        ) : (
          alunosFrequentes.map((aluno) => (
            <Col xs={24} sm={12} lg={8} key={aluno.id}>
              <Card
                hoverable
                style={{ 
                  background: aluno.frequency >= stats.averageFrequency 
                    ? 'linear-gradient(145deg, rgba(67, 181, 129, 0.1) 0%, #36393f 100%)' 
                    : '#36393f',
                  border: aluno.frequency >= stats.averageFrequency 
                    ? '1px solid rgba(67, 181, 129, 0.3)' 
                    : '1px solid #5c6370',
                  borderRadius: '8px',
                  boxShadow: aluno.frequency >= stats.averageFrequency 
                    ? '0 4px 16px rgba(67, 181, 129, 0.1)' 
                    : 'none'
                }}
                styles={{ 
                  body: {
                    padding: '16px'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {aluno.avatar ? (
                    <Avatar 
                      size={48} 
                      src={aluno.avatar}
                      style={{ 
                        border: `2px solid ${getBeltColor(aluno.beltLevel)}`
                      }}
                    />
                  ) : (
                    <Avatar 
                      size={48} 
                      style={{ 
                        backgroundColor: getBeltColor(aluno.beltLevel),
                        color: aluno.beltLevel === 'branca' ? '#000000' : '#ffffff',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      {aluno.name.charAt(0)}
                    </Avatar>
                  )}
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                      {aluno.name}
                    </Title>
                    <Tag 
                      color={getBeltColor(aluno.beltLevel)} 
                      style={{ 
                        color: aluno.beltLevel === 'branca' ? '#000000' : '#ffffff',
                        fontSize: '11px',
                        marginTop: '2px'
                      }}
                    >
                      {aluno.belt}
                    </Tag>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>Frequência</Text>
                  <Text style={{ 
                    color: aluno.frequency >= stats.averageFrequency ? '#43b581' : '#7289da', 
                    fontSize: '14px', 
                    fontWeight: 'bold' 
                  }}>
                    {aluno.frequency}%
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>Check-ins Totais</Text>
                  <Text style={{ color: '#ffffff', fontSize: '14px' }}>
                    {aluno.totalCheckIns}
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>Este Mês</Text>
                  <Text style={{ color: '#ffffff', fontSize: '14px' }}>
                    {aluno.monthlyCheckIns}
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>Último Check-in</Text>
                  <Text style={{ color: '#ffffff', fontSize: '12px' }}>
                    {aluno.lastCheckIn === 'Nunca' ? 'Nunca' : new Date(aluno.lastCheckIn).toLocaleDateString('pt-BR')}
                  </Text>
                </div>

                {aluno.frequency >= stats.averageFrequency && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '4px 8px', 
                    background: 'rgba(67, 181, 129, 0.2)', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#43b581', fontSize: '11px', fontWeight: 'bold' }}>
                      Acima da Média
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))
        )}
      </Row>
      </div>
    </DashboardLayout>
  )
}