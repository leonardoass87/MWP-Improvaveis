'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, message, Spin, Typography, Row, Col, Statistic, Modal, Form, Select, Input } from 'antd'
import { UserOutlined, TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { AuthUser } from '@/types'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography
const { Option } = Select

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'instructor' | 'student'
  belt: string
  degree: number
  active: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    instructors: 0
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
    if (parsedUser.role !== 'admin') {
      router.push(`/dashboard/${parsedUser.role}`)
      return
    }

    setUser(parsedUser)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Carregar usuários reais da API
      const usersResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      let usersData: User[] = []
      if (usersResponse.ok) {
        const apiUsers = await usersResponse.json()
        usersData = apiUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          belt: user.belt || 'white',
          degree: user.degree || 0,
          active: user.active !== false,
          createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'
        }))
      } else {
        // Fallback para dados mockados se a API falhar
        usersData = [
          {
            id: 1,
            name: 'Admin Principal',
            email: 'admin@teste.com',
            role: 'admin',
            belt: 'black',
            degree: 5,
            active: true,
            createdAt: '2024-01-01'
          },
          {
            id: 2,
            name: 'Professor Silva',
            email: 'professor@teste.com',
            role: 'instructor',
            belt: 'black',
            degree: 3,
            active: true,
            createdAt: '2024-01-05'
          }
        ]
      }

      setUsers(usersData)
      setStats({
        totalUsers: usersData.length,
        activeUsers: usersData.filter(u => u.active).length,
        students: usersData.filter(u => u.role === 'student').length,
        instructors: usersData.filter(u => u.role === 'instructor').length
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      message.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue(user)
    setModalVisible(true)
  }

  const handleDeleteUser = (userId: number) => {
    Modal.confirm({
      title: 'Confirmar Exclusão',
      content: 'Tem certeza que deseja excluir este usuário?',
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okType: 'danger',
      onOk() {
        setUsers(prev => prev.filter(u => u.id !== userId))
        message.success('Usuário excluído com sucesso!')
      }
    })
  }

  const handleToggleActive = (userId: number) => {
    setUsers(prev => 
      prev.map(u => 
        u.id === userId 
          ? { ...u, active: !u.active }
          : u
      )
    )
    message.success('Status do usuário atualizado!')
  }

  const handleSubmit = (values: any) => {
    if (editingUser) {
      // Editar usuário existente
      setUsers(prev => 
        prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...values }
            : u
        )
      )
      message.success('Usuário atualizado com sucesso!')
    } else {
      // Criar novo usuário
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        ...values,
        active: true,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setUsers(prev => [...prev, newUser])
      message.success('Usuário criado com sucesso!')
    }
    
    setModalVisible(false)
    form.resetFields()
    setEditingUser(null)
  }

  const getBeltColor = (belt: string) => {
    const colors: { [key: string]: string } = {
      white: '#ffffff',
      blue: '#1890ff',
      purple: '#722ed1',
      brown: '#8b4513',
      black: '#000000'
    }
    return colors[belt] || '#ffffff'
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'red',
      professor: 'blue',
      student: 'green'
    }
    return colors[role as keyof typeof colors] || 'default'
  }

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      render: (belt: string, record: User) => (
        <Tag color={getBeltColor(belt)} style={{ color: belt === 'white' ? '#000' : '#fff' }}>
          {belt.charAt(0).toUpperCase() + belt.slice(1)} {record.degree}º
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Ativo' : 'Inativo'}
        </Tag>
      )
    },
    {
      title: 'Data de Criação',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR')
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Editar
          </Button>
          <Button 
            size="small" 
            type={record.active ? 'default' : 'primary'}
            onClick={() => handleToggleActive(record.id)}
          >
            {record.active ? 'Desativar' : 'Ativar'}
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id)}
          >
            Excluir
          </Button>
        </div>
      )
    }
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
      <div>
        <Title level={2} className="text-white">Dashboard do Administrador</Title>
        <Text className="text-gray-400">Bem-vindo, {user?.name}!</Text>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300">Total de Usuários</span>}
              value={stats.totalUsers}
              prefix={<UserOutlined className="text-blue-400" />}
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300">Usuários Ativos</span>}
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined className="text-green-400" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300">Alunos</span>}
              value={stats.students}
              prefix={<TeamOutlined className="text-blue-400" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300">Professores</span>}
              value={stats.instructors}
              prefix={<UserOutlined className="text-purple-400" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gestão de Usuários */}
      <Card 
        title={<span className="text-white">Gestão de Usuários</span>}
        className="bg-discord-dark border-gray-700"
        style={{ marginTop: '24px' }}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateUser}
          >
            Novo Usuário
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingUser(null)
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Digite o nome' }]}
          >
            <Input placeholder="Nome completo" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Digite o email' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input placeholder="email@exemplo.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Selecione o role' }]}
          >
            <Select placeholder="Selecione o role">
              <Option value="admin">Admin</Option>
              <Option value="professor">Professor</Option>
              <Option value="student">Aluno</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="belt"
            label="Faixa"
            rules={[{ required: true, message: 'Selecione a faixa' }]}
          >
            <Select placeholder="Selecione a faixa">
              <Option value="white">Branca</Option>
              <Option value="blue">Azul</Option>
              <Option value="purple">Roxa</Option>
              <Option value="brown">Marrom</Option>
              <Option value="black">Preta</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="degree"
            label="Grau"
            rules={[{ required: true, message: 'Selecione o grau' }]}
          >
            <Select placeholder="Selecione o grau">
              {[0, 1, 2, 3, 4, 5].map(degree => (
                <Option key={degree} value={degree}>{degree}º grau</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </DashboardLayout>
  )
}