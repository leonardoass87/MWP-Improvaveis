'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Spin, Modal } from 'antd'
import { UserOutlined, LockOutlined, UserAddOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { LoginCredentials, AuthUser } from '@/types'
import RegisterForm from '@/components/Auth/RegisterForm'

const { Title, Text, Link } = Typography

export default function LoginPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [registerModalVisible, setRegisterModalVisible] = useState(false)
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: LoginCredentials) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        message.success('Login realizado com sucesso!')
        
        // Redirecionar para dashboard baseado no role
        router.push(`/dashboard/${data.user.role}`)
      } else {
        message.error(data.error || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: any) => {
    setRegisterLoading(true)
    try {
      console.log('Dados do cadastro:', values)
      
      // Chamada para a API de cadastro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro')
      }

      message.success('Cadastro realizado com sucesso! Você pode fazer login agora.')
      setRegisterModalVisible(false)
      
      // Preencher o email no formulário de login
      form.setFieldsValue({ email: values.email })
    } catch (error: any) {
      console.error('Register error:', error)
      message.error(error.message || 'Erro ao realizar cadastro')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(false)
    message.info('Funcionalidade será implementada em breve!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-discord-darker to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card 
          className="shadow-2xl"
          style={{ 
            background: 'linear-gradient(145deg, #3c4043 0%, #36393f 100%)',
            border: '1px solid #5c6370',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-discord-blurple to-blue-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">🥋</span>
              </div>
            </div>
            <Title level={2} className="text-white mb-2" style={{ color: '#ffffff', marginBottom: '8px' }}>
              BJJ Academy
            </Title>
            <Text className="text-gray-300" style={{ color: '#b9bbbe' }}>
              Faça login para acessar o sistema
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label={<span style={{ color: '#dcddde', fontWeight: '500' }}>Email</span>}
              rules={[
                { required: true, message: 'Por favor, insira seu email!' },
                { type: 'email', message: 'Por favor, insira um email válido!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#b9bbbe' }} />}
                placeholder="Digite seu email"
                style={{
                  background: '#40444b',
                  border: '1px solid #5c6370',
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '12px 16px',
                  borderRadius: '6px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: '#dcddde', fontWeight: '500' }}>Senha</span>}
              rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#b9bbbe' }} />}
                placeholder="Digite sua senha"
                style={{
                  background: '#40444b',
                  border: '1px solid #5c6370',
                  color: '#ffffff',
                  fontSize: '14px',
                  borderRadius: '6px'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(135deg, #5865f2 0%, #4752c4 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 101, 242, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 101, 242, 0.3)';
                }}
              >
                Entrar
              </Button>
            </Form.Item>

            <div className="text-center mb-4">
              <Link
                onClick={() => setForgotPasswordModalVisible(true)}
                style={{ color: '#00a8ff', fontSize: '14px' }}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="text-center">
              <Text style={{ color: '#b9bbbe', fontSize: '14px' }}>
                Não tem uma conta?{' '}
              </Text>
              <Link
                onClick={() => setRegisterModalVisible(true)}
                style={{ color: '#00a8ff', fontSize: '14px', fontWeight: '500' }}
              >
                Cadastre-se aqui
              </Link>
            </div>
          </Form>


        </Card>
      </div>

      {/* Modal de Cadastro */}
      <Modal
        title={
          <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600' }}>
            <UserAddOutlined style={{ marginRight: '8px', color: '#5865f2' }} />
            Cadastro de Novo Aluno
          </div>
        }
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={600}
        style={{
          top: 20,
        }}
        styles={{
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
          content: {
            background: 'linear-gradient(145deg, #3c4043 0%, #36393f 100%)',
            border: '1px solid #5c6370',
            borderRadius: '12px',
            maxHeight: '90vh',
            overflow: 'auto'
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid #5c6370',
            paddingBottom: '16px'
          }
        }}
      >
        <RegisterForm
          onFinish={handleRegister}
          onCancel={() => setRegisterModalVisible(false)}
          loading={registerLoading}
        />
      </Modal>

      {/* Modal de Esqueceu a Senha */}
      <Modal
        title={
          <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
            <QuestionCircleOutlined style={{ marginRight: '8px', color: '#ffa500' }} />
            Esqueceu a Senha?
          </div>
        }
        open={forgotPasswordModalVisible}
        onCancel={() => setForgotPasswordModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setForgotPasswordModalVisible(false)}
            style={{
              background: 'transparent',
              border: '1px solid #5c6370',
              color: '#dcddde',
              borderRadius: '6px'
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleForgotPassword}
            style={{
              background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            Enviar Email
          </Button>
        ]}
        width={400}
        styles={{
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
          content: {
            background: 'linear-gradient(145deg, #3c4043 0%, #36393f 100%)',
            border: '1px solid #5c6370',
            borderRadius: '12px'
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid #5c6370',
            paddingBottom: '16px'
          }
        }}
      >
        <div style={{ padding: '16px 0' }}>
          <Text style={{ color: '#b9bbbe', fontSize: '14px', lineHeight: '1.6' }}>
            Esta funcionalidade será implementada em breve. Você receberá um email com instruções para redefinir sua senha.
          </Text>
          <div style={{ marginTop: '16px', padding: '12px', background: '#40444b', borderRadius: '6px', border: '1px solid #5c6370' }}>
            <Text style={{ color: '#dcddde', fontSize: '13px' }}>
              <strong>Por enquanto:</strong> Entre em contato com a administração da academia para redefinir sua senha.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}