'use client'

import React from 'react'
import { Form, Input, Button, Typography } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'

const { Text } = Typography

interface RegisterFormData {
  // Dados básicos para cadastro
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface RegisterFormProps {
  onFinish: (values: RegisterFormData) => void
  onCancel: () => void
  loading?: boolean
}

export default function RegisterForm({ onFinish, onCancel, loading = false }: RegisterFormProps) {
  const [form] = Form.useForm()

  const handleFinish = async (values: RegisterFormData) => {
    onFinish(values)
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <Text style={{ color: '#b9bbbe', fontSize: '14px', lineHeight: '1.6' }}>
          Crie sua conta com os dados básicos. Você poderá completar seu perfil após fazer login.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label={<span style={{ color: '#dcddde', fontWeight: '500' }}>Nome Completo</span>}
          rules={[{ required: true, message: 'Por favor, insira seu nome completo!' }]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#b9bbbe' }} />}
            placeholder="Digite seu nome completo"
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
          name="email"
          label={<span style={{ color: '#dcddde', fontWeight: '500' }}>Email</span>}
          rules={[
            { required: true, message: 'Por favor, insira seu email!' },
            { type: 'email', message: 'Por favor, insira um email válido!' }
          ]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: '#b9bbbe' }} />}
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
          rules={[
            { required: true, message: 'Por favor, insira sua senha!' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres!' }
          ]}
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

        <Form.Item
          name="confirmPassword"
          label={<span style={{ color: '#dcddde', fontWeight: '500' }}>Confirmar Senha</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Por favor, confirme sua senha!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('As senhas não coincidem!'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#b9bbbe' }} />}
            placeholder="Confirme sua senha"
            style={{
              background: '#40444b',
              border: '1px solid #5c6370',
              color: '#ffffff',
              fontSize: '14px',
              borderRadius: '6px'
            }}
          />
        </Form.Item>

        <div className="flex justify-between mt-6">
          <Button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid #5c6370',
              color: '#dcddde',
              borderRadius: '6px',
              padding: '8px 24px'
            }}
          >
            Cancelar
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              background: 'linear-gradient(135deg, #57f287 0%, #3ba55c 100%)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 24px',
              fontWeight: '600'
            }}
          >
            Criar Conta
          </Button>
        </div>
      </Form>
    </div>
  )
}