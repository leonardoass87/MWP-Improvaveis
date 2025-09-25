'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Select, 
  Input, 
  Tag, 
  Space, 
  Typography, 
  App,
  Row,
  Col,
  Statistic,
  Avatar,
  List,
  Empty,
  Divider,
  Badge,
  Tooltip,
  Spin
} from 'antd'
import { 
  UserAddOutlined, 
  EditOutlined, 
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  StarOutlined,
  PlusOutlined,
  FilterOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

interface User {
  id: number
  name: string
  email: string
  role: string
  belt?: string
  degree?: number
  active: boolean
  createdAt: string
}

interface StudentManagementProps {
  onBack?: () => void
}

const StudentManagement: React.FC<StudentManagementProps> = ({ onBack }) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<User[]>([])
  const [nonStudents, setNonStudents] = useState<User[]>([])
  const [promoteModalVisible, setPromoteModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [promoteForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'promote'>('overview')
  const [beltFilter, setBeltFilter] = useState<string>('')

  const beltColors = [
    { value: 'white', label: 'Branca', color: '#ffffff', textColor: '#000000' },
    { value: 'blue', label: 'Azul', color: '#1890ff', textColor: '#ffffff' },
    { value: 'purple', label: 'Roxa', color: '#722ed1', textColor: '#ffffff' },
    { value: 'brown', label: 'Marrom', color: '#8b4513', textColor: '#ffffff' },
    { value: 'black', label: 'Preta', color: '#000000', textColor: '#ffffff' },
    { value: 'coral', label: 'Coral', color: '#ff7875', textColor: '#ffffff' },
    { value: 'red', label: 'Vermelha', color: '#f5222d', textColor: '#ffffff' }
  ]

  const getBeltInfo = (belt: string) => {
    return beltColors.find(b => b.value === belt) || beltColors[0]
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Carregar alunos
      const studentsResponse = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (studentsResponse.ok) {
        const allUsers = await studentsResponse.json()
        const studentUsers = allUsers.filter((user: User) => user.role === 'student')
        setStudents(studentUsers)
      }

      // Carregar usuários não-alunos
      const nonStudentsResponse = await fetch('/api/users/non-students', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (nonStudentsResponse.ok) {
        const nonStudentUsers = await nonStudentsResponse.json()
        setNonStudents(nonStudentUsers)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      message.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePromoteUser = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser?.id,
          belt: values.belt,
          degree: values.degree
        })
      })

      if (response.ok) {
        message.success('Usuário promovido a aluno com sucesso!')
        setPromoteModalVisible(false)
        promoteForm.resetFields()
        setSelectedUser(null)
        loadData()
      } else {
        const error = await response.json()
        message.error(error.error || 'Erro ao promover usuário')
      }
    } catch (error) {
      console.error('Erro ao promover usuário:', error)
      message.error('Erro ao promover usuário')
    }
  }

  const handleEditStudent = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students/belt-degree', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedUser?.id,
          belt: values.belt,
          degree: values.degree
        })
      })

      if (response.ok) {
        message.success('Faixa e grau atualizados com sucesso!')
        setEditModalVisible(false)
        editForm.resetFields()
        setSelectedUser(null)
        loadData()
      } else {
        const error = await response.json()
        message.error(error.error || 'Erro ao atualizar faixa e grau')
      }
    } catch (error) {
      console.error('Erro ao atualizar faixa e grau:', error)
      message.error('Erro ao atualizar faixa e grau')
    }
  }

  const openPromoteModal = (user: User) => {
    setSelectedUser(user)
    promoteForm.setFieldsValue({
      belt: 'white',
      degree: 0
    })
    setPromoteModalVisible(true)
  }

  const openEditModal = (student: User) => {
    setSelectedUser(student)
    editForm.setFieldsValue({
      belt: student.belt,
      degree: student.degree
    })
    setEditModalVisible(true)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBelt = !beltFilter || student.belt === beltFilter
    return matchesSearch && matchesBelt
  })

  const filteredNonStudents = nonStudents.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBeltStats = () => {
    const stats = beltColors.map(belt => ({
      ...belt,
      count: students.filter(s => s.belt === belt.value).length
    }))
    return stats
  }

  const renderOverview = () => (
    <div>
      {/* Estatísticas - Mobile Optimized */}
      <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              minHeight: '100px'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>Total de Alunos</span>}
              value={students.length}
              prefix={<TeamOutlined style={{ color: '#ffffff', fontSize: '18px' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: '12px',
              minHeight: '100px'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>Usuários para Promover</span>}
              value={nonStudents.length}
              prefix={<UserAddOutlined style={{ color: '#ffffff', fontSize: '18px' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '12px',
              minHeight: '100px'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>Faixas Diferentes</span>}
              value={getBeltStats().filter(b => b.count > 0).length}
              prefix={<TrophyOutlined style={{ color: '#ffffff', fontSize: '18px' }} />}
              valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>



      {/* Ações Rápidas - Mobile Optimized */}
      <Card 
        title={
          <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
            <StarOutlined style={{ marginRight: '6px' }} />
            Ações Rápidas
          </span>
        }
        style={{ 
          background: '#36393f', 
          border: '1px solid #5c6370',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              size="middle"
              icon={<TeamOutlined />}
              onClick={() => setActiveTab('students')}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Gerenciar Alunos
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              size="middle"
              icon={<UserAddOutlined />}
              onClick={() => setActiveTab('promote')}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Promover Usuários
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )

  const renderStudents = () => (
    <div>
      {/* Filtros - Mobile Optimized */}
      <Card 
        style={{ 
          background: '#36393f', 
          border: '1px solid #5c6370',
          borderRadius: '12px',
          marginBottom: '16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={12}>
            <Input
              placeholder="Buscar aluno..."
              prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="middle"
              style={{
                background: '#40444b',
                border: '1px solid #5c6370',
                borderRadius: '8px'
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Select
              placeholder="Filtrar por faixa"
              value={beltFilter}
              onChange={setBeltFilter}
              size="middle"
              style={{ width: '100%' }}
              allowClear
            >
              {beltColors.map(belt => (
                <Option key={belt.value} value={belt.value}>
                  <Tag color={belt.color} style={{ color: belt.textColor }}>
                    {belt.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={24}>
            <Text style={{ color: '#b9bbbe', fontSize: '14px', textAlign: 'center', display: 'block' }}>
              {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Lista de Alunos - Mobile Optimized */}
      <Card 
        style={{ 
          background: '#36393f', 
          border: '1px solid #5c6370',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        {filteredStudents.length === 0 ? (
          <Empty 
            description={
              <span style={{ color: '#b9bbbe', fontSize: '14px' }}>
                {searchTerm || beltFilter ? 'Nenhum aluno encontrado com os filtros aplicados' : 'Nenhum aluno cadastrado'}
              </span>
            }
            style={{ padding: '30px 0' }}
          />
        ) : (
          <List
            grid={{ 
              gutter: 12, 
              xs: 1, 
              sm: 2, 
              md: 2, 
              lg: 3, 
              xl: 3, 
              xxl: 4 
            }}
            dataSource={filteredStudents}
            renderItem={(student) => {
              const beltInfo = getBeltInfo(student.belt || 'white')
              return (
                <List.Item>
                  <Card
                    hoverable
                    style={{
                      background: '#40444b',
                      border: '1px solid #5c6370',
                      borderRadius: '10px',
                      minHeight: '180px'
                    }}
                    bodyStyle={{ 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <Avatar 
                        size={64} 
                        icon={<UserOutlined />} 
                        style={{ 
                          background: beltInfo.color,
                          color: beltInfo.textColor,
                          marginBottom: '12px'
                        }}
                      />
                      <div>
                        <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>
                          {student.name}
                        </Text>
                        <br />
                        <Text style={{ color: '#b9bbbe', fontSize: '12px' }}>
                          {student.email}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <Tag 
                        color={beltInfo.color}
                        style={{ 
                          color: beltInfo.textColor,
                          fontSize: '12px',
                          padding: '4px 12px',
                          borderRadius: '16px'
                        }}
                      >
                        {beltInfo.label} - {student.degree}º Grau
                      </Tag>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(student)}
                        style={{
                          width: '100%',
                          height: '36px',
                          borderRadius: '6px',
                          background: '#7289da',
                          border: 'none',
                          fontSize: '12px'
                        }}
                      >
                        Editar Faixa
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )
            }}
          />
        )}
      </Card>
    </div>
  )

  const renderPromote = () => (
    <div>
      {/* Barra de Pesquisa - Mobile Optimized */}
      <Card 
        style={{ 
          background: '#36393f', 
          border: '1px solid #5c6370',
          borderRadius: '12px',
          marginBottom: '16px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Input
          placeholder="Buscar usuário para promover..."
          prefix={<SearchOutlined style={{ color: '#b9bbbe' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="middle"
          style={{
            background: '#40444b',
            border: '1px solid #5c6370',
            borderRadius: '8px'
          }}
        />
      </Card>

      {/* Lista de Usuários para Promover - Mobile Optimized */}
      <Card 
        title={
          <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
            <UserAddOutlined style={{ marginRight: '6px' }} />
            Usuários Disponíveis para Promoção
          </span>
        }
        style={{ 
          background: '#36393f', 
          border: '1px solid #5c6370',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        {filteredNonStudents.length === 0 ? (
          <Empty 
            description={
              <span style={{ color: '#b9bbbe', fontSize: '14px' }}>
                {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já são alunos'}
              </span>
            }
            style={{ padding: '30px 0' }}
          />
        ) : (
          <List
            grid={{ 
              gutter: 12, 
              xs: 1, 
              sm: 2, 
              md: 2, 
              lg: 3, 
              xl: 3, 
              xxl: 4 
            }}
            dataSource={filteredNonStudents}
            renderItem={(user) => (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    background: '#40444b',
                    border: '1px solid #5c6370',
                    borderRadius: '10px',
                    minHeight: '180px'
                  }}
                  bodyStyle={{ 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <Avatar 
                      size={48} 
                      icon={<UserOutlined />} 
                      style={{ 
                        background: '#7289da',
                        marginBottom: '8px'
                      }}
                    />
                    <div>
                      <Text strong style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.2' }}>
                        {user.name}
                      </Text>
                      <br />
                      <Text style={{ color: '#b9bbbe', fontSize: '11px' }}>
                        {user.email}
                      </Text>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <Tag color="blue" style={{ fontSize: '11px' }}>
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'instructor' ? 'Professor' : 'Usuário'}
                    </Tag>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => openPromoteModal(user)}
                      style={{
                        width: '100%',
                        height: '36px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        border: 'none',
                        fontSize: '12px'
                      }}
                    >
                      Promover a Aluno
                    </Button>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      padding: '8px 12px',
      minHeight: '100vh'
    }}>
      {/* Header com Navegação */}
      <div style={{ marginBottom: '20px' }}>
        <Title 
          level={3} 
          style={{ 
            color: '#ffffff', 
            margin: 0, 
            marginBottom: '6px',
            fontSize: '20px',
            lineHeight: '1.2'
          }}
        >
          Gestão de Alunos
        </Title>
        <Text style={{ 
          color: '#b9bbbe', 
          fontSize: '14px',
          display: 'block',
          lineHeight: '1.4'
        }}>
          Gerencie alunos, promova usuários e acompanhe estatísticas
        </Text>
        
        {/* Navegação por Tabs - Fit to Screen */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            width: '100%'
          }}>
            <Button
              type={activeTab === 'overview' ? 'primary' : 'default'}
              icon={<StarOutlined />}
              onClick={() => setActiveTab('overview')}
              size="small"
              style={{
                flex: 1,
                borderRadius: '16px',
                background: activeTab === 'overview' ? '#7289da' : 'transparent',
                border: activeTab === 'overview' ? 'none' : '1px solid #5c6370',
                color: activeTab === 'overview' ? '#ffffff' : '#b9bbbe',
                fontSize: '11px',
                height: '36px',
                padding: '0 8px',
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Visão Geral
              </span>
            </Button>
            <Button
              type={activeTab === 'students' ? 'primary' : 'default'}
              icon={<TeamOutlined />}
              onClick={() => setActiveTab('students')}
              size="small"
              style={{
                flex: 1,
                borderRadius: '16px',
                background: activeTab === 'students' ? '#7289da' : 'transparent',
                border: activeTab === 'students' ? 'none' : '1px solid #5c6370',
                color: activeTab === 'students' ? '#ffffff' : '#b9bbbe',
                fontSize: '11px',
                height: '36px',
                padding: '0 8px',
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Alunos ({students.length})
              </span>
            </Button>
            <Button
              type={activeTab === 'promote' ? 'primary' : 'default'}
              icon={<UserAddOutlined />}
              onClick={() => setActiveTab('promote')}
              size="small"
              style={{
                flex: 1,
                borderRadius: '16px',
                background: activeTab === 'promote' ? '#7289da' : 'transparent',
                border: activeTab === 'promote' ? 'none' : '1px solid #5c6370',
                color: activeTab === 'promote' ? '#ffffff' : '#b9bbbe',
                fontSize: '11px',
                height: '36px',
                padding: '0 8px',
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Promover ({nonStudents.length})
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <Spin spinning={loading}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'promote' && renderPromote()}
      </Spin>

      {/* Modal de Promoção */}
      <Modal
        title={
          <span style={{ color: '#ffffff' }}>
            <UserAddOutlined style={{ marginRight: '8px' }} />
            Promover Usuário a Aluno
          </span>
        }
        open={promoteModalVisible}
        onCancel={() => {
          setPromoteModalVisible(false)
          promoteForm.resetFields()
          setSelectedUser(null)
        }}
        footer={null}
        style={{ top: 20 }}
        styles={{
          content: {
            background: '#36393f',
            border: '1px solid #5c6370'
          },
          header: {
            background: '#36393f',
            borderBottom: '1px solid #5c6370'
          }
        }}
      >
        {selectedUser && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: '12px' }} />
            <div>
              <Text strong style={{ color: '#ffffff', fontSize: '18px' }}>
                {selectedUser.name}
              </Text>
              <br />
              <Text style={{ color: '#b9bbbe' }}>
                {selectedUser.email}
              </Text>
            </div>
          </div>
        )}
        
        <Form
          form={promoteForm}
          layout="vertical"
          onFinish={handlePromoteUser}
        >
          <Form.Item
            name="belt"
            label={<span style={{ color: '#ffffff' }}>Faixa Inicial</span>}
            rules={[{ required: true, message: 'Selecione uma faixa' }]}
          >
            <Select placeholder="Selecione a faixa">
              {beltColors.map(belt => (
                <Option key={belt.value} value={belt.value}>
                  <Tag color={belt.color} style={{ color: belt.textColor }}>
                    {belt.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="degree"
            label={<span style={{ color: '#ffffff' }}>Grau Inicial</span>}
            rules={[{ required: true, message: 'Selecione um grau' }]}
          >
            <Select placeholder="Selecione o grau">
              {[0, 1, 2, 3, 4].map(degree => (
                <Option key={degree} value={degree}>
                  {degree}º Grau
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setPromoteModalVisible(false)
                  promoteForm.resetFields()
                  setSelectedUser(null)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #5c6370',
                  color: '#b9bbbe'
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none'
                }}
              >
                Promover a Aluno
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        title={
          <span style={{ color: '#ffffff' }}>
            <EditOutlined style={{ marginRight: '8px' }} />
            Editar Faixa e Grau
          </span>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          editForm.resetFields()
          setSelectedUser(null)
        }}
        footer={null}
        style={{ top: 20 }}
        styles={{
          content: {
            background: '#36393f',
            border: '1px solid #5c6370'
          },
          header: {
            background: '#36393f',
            borderBottom: '1px solid #5c6370'
          }
        }}
      >
        {selectedUser && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Avatar 
              size={64} 
              icon={<UserOutlined />} 
              style={{ 
                background: getBeltInfo(selectedUser.belt || 'white').color,
                color: getBeltInfo(selectedUser.belt || 'white').textColor,
                marginBottom: '12px'
              }} 
            />
            <div>
              <Text strong style={{ color: '#ffffff', fontSize: '18px' }}>
                {selectedUser.name}
              </Text>
              <br />
              <Text style={{ color: '#b9bbbe' }}>
                {selectedUser.email}
              </Text>
              <br />
              <Tag 
                color={getBeltInfo(selectedUser.belt || 'white').color}
                style={{ 
                  color: getBeltInfo(selectedUser.belt || 'white').textColor,
                  marginTop: '8px'
                }}
              >
                Atual: {getBeltInfo(selectedUser.belt || 'white').label} - {selectedUser.degree}º Grau
              </Tag>
            </div>
          </div>
        )}
        
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditStudent}
        >
          <Form.Item
            name="belt"
            label={<span style={{ color: '#ffffff' }}>Nova Faixa</span>}
            rules={[{ required: true, message: 'Selecione uma faixa' }]}
          >
            <Select placeholder="Selecione a faixa">
              {beltColors.map(belt => (
                <Option key={belt.value} value={belt.value}>
                  <Tag color={belt.color} style={{ color: belt.textColor }}>
                    {belt.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="degree"
            label={<span style={{ color: '#ffffff' }}>Novo Grau</span>}
            rules={[{ required: true, message: 'Selecione um grau' }]}
          >
            <Select placeholder="Selecione o grau">
              {[0, 1, 2, 3, 4].map(degree => (
                <Option key={degree} value={degree}>
                  {degree}º Grau
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setEditModalVisible(false)
                  editForm.resetFields()
                  setSelectedUser(null)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #5c6370',
                  color: '#b9bbbe'
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Atualizar Faixa
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StudentManagement