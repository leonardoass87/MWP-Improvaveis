'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, message, Avatar, Upload, Row, Col, Typography } from 'antd'
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons'
import { AuthUser } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

interface ProfileModalProps {
  visible: boolean
  onClose: () => void
  user: AuthUser
  onUpdate: (updatedUser: AuthUser) => void
}

export default function ProfileModal({ visible, onClose, user, onUpdate }: ProfileModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        belt: user.belt,
        degree: user.degree,
        birthDate: user.birthDate || '',
        weight: user.weight || '',
        height: user.height || '',
        medicalInfo: user.medicalInfo || '',
        goals: user.goals || ''
      })
    }
  }, [visible, user, form])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          id: user.id
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        
        // Atualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Chamar callback para atualizar o estado no componente pai
        onUpdate(updatedUser)
        
        message.success('Perfil atualizado com sucesso!')
        onClose()
      } else {
        const error = await response.json()
        message.error(error.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      message.error('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const getBeltOptions = () => {
    const belts = ['white', 'blue', 'purple', 'brown', 'black']
    return belts.map(belt => (
      <Option key={belt} value={belt}>
        <div className="flex items-center">
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2 border border-gray-300"
            style={{ 
              backgroundColor: belt === 'white' ? '#ffffff' : 
                             belt === 'blue' ? '#1890ff' : 
                             belt === 'purple' ? '#722ed1' : 
                             belt === 'brown' ? '#8b4513' : '#000000'
            }}
          />
          <span className="capitalize">{belt === 'white' ? 'Branca' : 
                                       belt === 'blue' ? 'Azul' : 
                                       belt === 'purple' ? 'Roxa' : 
                                       belt === 'brown' ? 'Marrom' : 'Preta'}</span>
        </div>
      </Option>
    ))
  }

  const getDegreeOptions = () => {
    const maxDegree = user.belt === 'black' ? 10 : 4
    return Array.from({ length: maxDegree }, (_, i) => (
      <Option key={i} value={i}>
        {i}º grau
      </Option>
    ))
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-3">
          <UserOutlined className="text-blue-500" />
          <Title level={4} className="m-0">Editar Perfil</Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="profile-modal"
      style={{ top: 20 }}
    >
      <div className="mb-6 text-center">
        <Avatar
          size={80}
          icon={<UserOutlined />}
          src={avatarUrl}
          className="bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-200"
        />
        <div className="mt-2">
          <Button
            type="link"
            icon={<CameraOutlined />}
            size="small"
            className="text-blue-500"
          >
            Alterar foto
          </Button>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="profile-form"
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Nome Completo"
              name="name"
              rules={[{ required: true, message: 'Nome é obrigatório' }]}
            >
              <Input placeholder="Digite seu nome completo" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email é obrigatório' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input placeholder="Digite seu email" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Telefone"
              name="phone"
            >
              <Input placeholder="(11) 99999-9999" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Data de Nascimento"
              name="birthDate"
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Endereço"
          name="address"
        >
          <Input.TextArea rows={2} placeholder="Digite seu endereço completo" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Contato de Emergência"
              name="emergencyContact"
            >
              <Input placeholder="Nome do contato de emergência" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Telefone de Emergência"
              name="emergencyPhone"
            >
              <Input placeholder="(11) 99999-9999" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Faixa"
              name="belt"
            >
              <Select placeholder="Selecione sua faixa" disabled={user.role === 'student'}>
                {getBeltOptions()}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Grau"
              name="degree"
            >
              <Select placeholder="Grau" disabled={user.role === 'student'}>
                {getDegreeOptions()}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Peso (kg)"
              name="weight"
            >
              <Input type="number" placeholder="70" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Altura (cm)"
              name="height"
            >
              <Input type="number" placeholder="175" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Informações Médicas"
          name="medicalInfo"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Alergias, medicamentos, lesões, etc." 
          />
        </Form.Item>

        <Form.Item
          label="Objetivos no Jiu-Jitsu"
          name="goals"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Descreva seus objetivos e metas no Jiu-Jitsu" 
          />
        </Form.Item>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Salvar Alterações
          </Button>
        </div>
      </Form>

      <style jsx global>{`
        .profile-modal .ant-modal-content {
          background: #1f1f1f;
          border: 1px solid #333;
        }
        
        .profile-modal .ant-modal-header {
          background: #1f1f1f;
          border-bottom: 1px solid #333;
        }
        
        .profile-modal .ant-modal-title {
          color: #fff;
        }
        
        .profile-form .ant-form-item-label > label {
          color: #fff;
          font-weight: 500;
        }
        
        .profile-form .ant-input,
        .profile-form .ant-select-selector,
        .profile-form .ant-input-number {
          background: #2a2a2a;
          border: 1px solid #444;
          color: #fff;
        }
        
        .profile-form .ant-input:focus,
        .profile-form .ant-select-focused .ant-select-selector,
        .profile-form .ant-input-number:focus {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        
        .profile-form .ant-select-dropdown {
          background: #2a2a2a;
          border: 1px solid #444;
        }
        
        .profile-form .ant-select-item {
          color: #fff;
        }
        
        .profile-form .ant-select-item:hover {
          background: #333;
        }
        
        .profile-form .ant-select-item-option-selected {
          background: #1890ff;
        }
      `}</style>
    </Modal>
  )
}