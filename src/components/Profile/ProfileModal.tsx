'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, message, Row, Col, Typography } from 'antd'
import { UserOutlined, SaveOutlined } from '@ant-design/icons'
import { AuthUser } from '@/types'
import InputMask from 'react-input-mask'
import AvatarUpload from './AvatarUpload'

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
      // Separar endereço em campos individuais se existir
      const addressParts = user.address ? user.address.split(',').map(part => part.trim()) : ['', '', '', '']
      
      // Carregar foto do perfil se existir
      setAvatarUrl(user.avatar || '')
      
      // Separar data de nascimento em dia, mês e ano
      let birthDay = '', birthMonth = '', birthYear = ''
      if (user.birthDate) {
        const dateParts = user.birthDate.split('-')
        if (dateParts.length === 3) {
          birthYear = dateParts[0]
          birthMonth = dateParts[1]
          birthDay = dateParts[2]
        }
      }
      
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        street: addressParts[0] || '',
        number: addressParts[1] || '',
        complement: addressParts[2] || '',
        neighborhood: addressParts[3] || '',
        city: addressParts[4] || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        belt: user.belt,
        degree: user.degree,
        birthDay: birthDay,
        birthMonth: birthMonth,
        birthYear: birthYear,
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
      
      // Combinar campos de endereço
      const addressParts = [
        values.street || '',
        values.number || '',
        values.complement || '',
        values.neighborhood || '',
        values.city || ''
      ].filter(part => part.trim() !== '')
      
      const address = addressParts.join(', ')
      
      // Combinar data de nascimento
      let birthDate = null
      if (values.birthDay && values.birthMonth && values.birthYear) {
        const day = values.birthDay.padStart(2, '0')
        const month = values.birthMonth.padStart(2, '0')
        const year = values.birthYear
        birthDate = `${year}-${month}-${day}`
      }
      
      const submitData = {
        ...values,
        id: user.id,
        address: address,
        birthDate: birthDate,
        avatar: avatarUrl
      }
      
      // Remover campos individuais de endereço e data do submitData
      delete submitData.street
      delete submitData.number
      delete submitData.complement
      delete submitData.neighborhood
      delete submitData.city
      delete submitData.birthDay
      delete submitData.birthMonth
      delete submitData.birthYear
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        // Buscar dados atualizados da API para garantir sincronização
        const profileResponse = await fetch('/api/profile/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (profileResponse.ok) {
          const updatedUser = await profileResponse.json()
          
          // Atualizar localStorage com dados mais recentes
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Chamar callback para atualizar o estado no componente pai
          onUpdate(updatedUser)
          
          message.success('Perfil atualizado com sucesso!')
          onClose()
        } else {
          // Fallback: usar dados da resposta de update
          const updatedUser = await response.json()
          localStorage.setItem('user', JSON.stringify(updatedUser))
          onUpdate(updatedUser)
          message.success('Perfil atualizado com sucesso!')
          onClose()
        }
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
    const belts = [
      { value: 'branca', label: 'Branca', color: '#ffffff' },
      { value: 'azul', label: 'Azul', color: '#1890ff' },
      { value: 'roxa', label: 'Roxa', color: '#722ed1' },
      { value: 'marrom', label: 'Marrom', color: '#8b4513' },
      { value: 'preta', label: 'Preta', color: '#000000' }
    ]
    return belts.map(belt => (
      <Option key={belt.value} value={belt.value}>
        <div className="flex items-center">
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2 border border-gray-300"
            style={{ backgroundColor: belt.color }}
          />
          <span>{belt.label}</span>
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
      <div className="mb-6">
        <AvatarUpload
          currentAvatar={avatarUrl}
          onAvatarChange={setAvatarUrl}
        />
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
              <InputMask mask="(99)99999-9999" maskChar=" ">
                {(inputProps: any) => <Input {...inputProps} placeholder="(11)99999-9999" />}
              </InputMask>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Data de Nascimento"
            >
              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item
                    name="birthDay"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Dia" maxLength={2} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="birthMonth"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Mês" maxLength={2} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="birthYear"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Ano" maxLength={4} />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Rua/Avenida"
              name="street"
            >
              <Input placeholder="Ex: Rua das Flores, Av. Paulista" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item
              label="Número"
              name="number"
            >
              <Input placeholder="123" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item
              label="Complemento"
              name="complement"
            >
              <Input placeholder="Apto 45" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Bairro"
              name="neighborhood"
            >
              <Input placeholder="Centro, Vila Madalena" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Cidade"
              name="city"
            >
              <Input placeholder="São Paulo" />
            </Form.Item>
          </Col>
        </Row>

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
              <InputMask mask="(99)99999-9999" maskChar=" ">
                {(inputProps: any) => <Input {...inputProps} placeholder="(11)99999-9999" />}
              </InputMask>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Faixa"
              name="belt"
            >
              <Select 
                placeholder="Selecione sua faixa" 
                style={{ 
                  background: '#2a2a2a',
                  color: '#fff'
                }}
              >
                {getBeltOptions()}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Grau"
              name="degree"
            >
              <Select 
                placeholder="Grau" 
                style={{ 
                  background: '#2a2a2a',
                  color: '#fff'
                }}
              >
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