'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, Table, Tag, Spin, Typography, Row, Col, Statistic, Modal, Form, Select, Input, Tabs, App } from 'antd'
import { UserOutlined, TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
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

interface Post {
  id: number
  title: string
  content: string
  published: boolean
  created_at: string
  updated_at: string
  author_name: string
  author_email: string
  author_role: string
}

export default function AdminDashboard() {
  const { message } = App.useApp()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('users')
  const [form] = Form.useForm()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    instructors: 0
  })
  const router = useRouter()

  const loadData = useCallback(async () => {
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
        // Se a API falhar, inicializar com dados vazios
        usersData = []
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
  }, [message])

  const loadPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
      message.error('Erro ao carregar posts')
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
    if (parsedUser.role !== 'admin') {
      router.push(`/dashboard/${parsedUser.role}`)
      return
    }

    setUser(parsedUser)
    loadData()
  }, [router, loadData])

  useEffect(() => {
    if (activeTab === 'posts' && user) {
      loadPosts()
    }
  }, [activeTab, user, loadPosts])

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
      async onOk() {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            // Remover da interface apenas após sucesso na API
            setUsers(prev => prev.filter(u => u.id !== userId))
            // Atualizar estatísticas
            setStats(prev => ({
              ...prev,
              totalUsers: prev.totalUsers - 1,
              activeUsers: prev.activeUsers - 1
            }))
            message.success('Usuário excluído com sucesso!')
          } else {
            const error = await response.json()
            message.error(error.error || 'Erro ao excluir usuário')
          }
        } catch (error) {
          console.error('Erro ao excluir usuário:', error)
          message.error('Erro ao excluir usuário')
        }
      }
    })
  }

  const handleDeletePost = async (postId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        message.success('Post deletado com sucesso!')
        await loadPosts() // Recarregar posts
      } else {
        const error = await response.json()
        message.error(error.message || 'Erro ao deletar post')
      }
    } catch (error) {
      console.error('Erro ao deletar post:', error)
      message.error('Erro ao deletar post')
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const user = users.find(u => u.id === userId)
      if (!user) return

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: !user.active
        })
      })

      if (response.ok) {
        // Atualizar na interface apenas após sucesso na API
        setUsers(prev => 
          prev.map(u => 
            u.id === userId 
              ? { ...u, active: !u.active }
              : u
          )
        )
        // Atualizar estatísticas
        setStats(prev => ({
          ...prev,
          activeUsers: user.active ? prev.activeUsers - 1 : prev.activeUsers + 1
        }))
        message.success('Status do usuário atualizado!')
      } else {
        const error = await response.json()
        message.error(error.error || 'Erro ao atualizar status do usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      message.error('Erro ao atualizar status do usuário')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      
      if (editingUser) {
        // Editar usuário existente
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })

        if (response.ok) {
          const updatedUser = await response.json()
          setUsers(prev => 
            prev.map(u => 
              u.id === editingUser.id 
                ? { ...u, ...updatedUser }
                : u
            )
          )
          message.success('Usuário atualizado com sucesso!')
        } else {
          const error = await response.json()
          message.error(error.error || 'Erro ao atualizar usuário')
          return
        }
      } else {
        // Criar novo usuário
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...values,
            active: true
          })
        })

        if (response.ok) {
          const newUser = await response.json()
          setUsers(prev => [...prev, newUser])
          setStats(prev => ({
            ...prev,
            totalUsers: prev.totalUsers + 1,
            activeUsers: prev.activeUsers + 1
          }))
          message.success('Usuário criado com sucesso!')
        } else {
          const error = await response.json()
          message.error(error.error || 'Erro ao criar usuário')
          return
        }
      }
      
      setModalVisible(false)
      form.resetFields()
      setEditingUser(null)
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      message.error('Erro ao salvar usuário')
    }
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

  const userColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="text-white">{text}</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <span className="text-gray-300">{text}</span>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          instructor: 'blue',
          student: 'green'
        }
        const labels = {
          admin: 'Admin',
          instructor: 'Professor',
          student: 'Aluno'
        }
        return <Tag color={colors[role as keyof typeof colors]}>{labels[role as keyof typeof labels]}</Tag>
      }
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      render: (belt: string, record: User) => {
        const beltColors = {
          white: '#ffffff',
          blue: '#1890ff',
          purple: '#722ed1',
          brown: '#8b4513',
          black: '#000000'
        }
        const beltLabels = {
          white: 'Branca',
          blue: 'Azul',
          purple: 'Roxa',
          brown: 'Marrom',
          black: 'Preta'
        }
        return (
          <Tag color={beltColors[belt as keyof typeof beltColors]}>
            {beltLabels[belt as keyof typeof beltLabels]} {record.degree}º
          </Tag>
        )
      }
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
      render: (date: string) => (
        <span className="text-gray-300">
          {new Date(date).toLocaleDateString('pt-BR')}
        </span>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (record: User) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            className="text-xs"
            style={{ minWidth: '60px' }}
          >
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button 
            size="small" 
            type={record.active ? 'default' : 'primary'}
            onClick={() => handleToggleActive(record.id)}
            className="text-xs"
            style={{ minWidth: '60px' }}
          >
            <span className="hidden sm:inline">{record.active ? 'Desativar' : 'Ativar'}</span>
            <span className="sm:hidden">{record.active ? 'Off' : 'On'}</span>
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id)}
            className="text-xs"
            style={{ minWidth: '60px' }}
          >
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </div>
      )
    }
  ]

  const postColumns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="text-white">{text}</span>
    },
    {
      title: 'Autor',
      dataIndex: 'author_name',
      key: 'author_name',
      render: (text: string, record: Post) => (
        <div>
          <div className="text-white">{text}</div>
          <div className="text-gray-400 text-sm">{record.author_email}</div>
        </div>
      )
    },
    {
      title: 'Role do Autor',
      dataIndex: 'author_role',
      key: 'author_role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          instructor: 'blue',
          student: 'green'
        }
        const labels = {
          admin: 'Admin',
          instructor: 'Professor',
          student: 'Aluno'
        }
        return <Tag color={colors[role as keyof typeof colors]}>{labels[role as keyof typeof labels]}</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => (
        <Tag color={published ? 'green' : 'orange'}>
          {published ? 'Publicado' : 'Rascunho'}
        </Tag>
      )
    },
    {
      title: 'Data de Criação',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <span className="text-gray-300">
          {new Date(date).toLocaleDateString('pt-BR')}
        </span>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (record: Post) => (
        <Button 
          size="small" 
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeletePost(record.id)}
          className="text-xs"
          style={{ minWidth: '60px' }}
        >
          <span className="hidden sm:inline">Excluir</span>
        </Button>
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
      <div className="p-2 sm:p-4">
        <Title level={2} className="text-white text-lg sm:text-xl md:text-2xl mb-2">Dashboard do Administrador</Title>
        <Text className="text-gray-400 text-sm sm:text-base">Bem-vindo, {user?.name}!</Text>

      {/* Estatísticas - Mobile Optimized */}
      <Row gutter={[8, 8]} style={{ marginTop: '16px' }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300 text-xs sm:text-sm">Total de Usuários</span>}
              value={stats.totalUsers}
              prefix={<UserOutlined className="text-blue-400" />}
              valueStyle={{ color: '#ffffff', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300 text-xs sm:text-sm">Usuários Ativos</span>}
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined className="text-green-400" />}
              valueStyle={{ color: '#52c41a', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300 text-xs sm:text-sm">Alunos</span>}
              value={stats.students}
              prefix={<TeamOutlined className="text-blue-400" />}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card className="bg-discord-dark border-gray-700">
            <Statistic
              title={<span className="text-gray-300 text-xs sm:text-sm">Professores</span>}
              value={stats.instructors}
              prefix={<UserOutlined className="text-purple-400" />}
              valueStyle={{ color: '#722ed1', fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gestão de Usuários e Posts - Mobile Optimized */}
      <Card 
        title={<span className="text-white text-sm sm:text-base">Gestão de Usuários e Posts</span>}
        className="bg-discord-dark border-gray-700"
        style={{ marginTop: '16px' }}
        extra={
          activeTab === 'users' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
              size="small"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Novo Usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={[
            {
              key: 'users',
              label: (
                <span className="text-white text-xs sm:text-sm">
                  <UserOutlined /> <span className="hidden sm:inline">Usuários</span>
                </span>
              ),
              children: (
                <div className="overflow-x-auto">
                  <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: false,
                      showQuickJumper: false,
                      size: 'small'
                    }}
                    scroll={{ x: 800 }}
                    size="small"
                  />
                </div>
              )
            },
            {
              key: 'posts',
              label: (
                <span className="text-white text-xs sm:text-sm">
                  <FileTextOutlined /> <span className="hidden sm:inline">Posts</span>
                </span>
              ),
              children: (
                <div className="overflow-x-auto">
                  <Table
                    columns={postColumns}
                    dataSource={posts}
                    rowKey="id"
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: false,
                      showQuickJumper: false,
                      size: 'small'
                    }}
                    scroll={{ x: 600 }}
                    size="small"
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Modal de Criação/Edição - Mobile Optimized */}
      <Modal
        title={<span className="text-sm sm:text-base">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</span>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingUser(null)
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '500px' }}
        centered
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