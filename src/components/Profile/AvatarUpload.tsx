'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Modal, Button, message, Avatar, Slider } from 'antd'
import { 
  CameraOutlined, 
  UserOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined
} from '@ant-design/icons'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
}

interface CropData {
  x: number
  y: number
  scale: number
}

export default function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [originalImage, setOriginalImage] = useState('')
  const [cropData, setCropData] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Função para comprimir imagem
  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calcular dimensões mantendo aspect ratio
        const maxSize = 800 // Tamanho máximo
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para base64 com compressão
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  // Função para gerar avatar circular final
  // Função para gerar preview em tempo real (mesmo cálculo do resultado final)
  const generatePreviewAvatar = useCallback((previewSize: number = 80) => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = imageRef.current

    canvas.width = previewSize
    canvas.height = previewSize

    // Criar clipping circular
    ctx.beginPath()
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2)
    ctx.clip()

    // Calcular posição e tamanho da imagem baseado no crop
    const containerSize = 250 // Mesmo tamanho do preview visual
    const scaledSize = containerSize * cropData.scale
    const sourceX = (scaledSize - containerSize) / 2 - cropData.x
    const sourceY = (scaledSize - containerSize) / 2 - cropData.y
    
    // Desenhar imagem cropada e escalada
    ctx.drawImage(
      img,
      sourceX * (previewSize / containerSize),
      sourceY * (previewSize / containerSize),
      scaledSize * (previewSize / containerSize),
      scaledSize * (previewSize / containerSize)
    )

    return canvas.toDataURL('image/jpeg', 0.9)
  }, [cropData])

  const generateCircularAvatar = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = imageRef.current

    // Tamanho final do avatar
    const size = 200
    canvas.width = size
    canvas.height = size

    // Criar clipping circular
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    // Calcular posição e tamanho da imagem baseado no crop
    const containerSize = 250 // Mesmo tamanho do preview visual
    const scaledSize = containerSize * cropData.scale
    const sourceX = (scaledSize - containerSize) / 2 - cropData.x
    const sourceY = (scaledSize - containerSize) / 2 - cropData.y
    
    // Desenhar imagem cropada e escalada
    ctx.drawImage(
      img,
      sourceX * (size / containerSize),
      sourceY * (size / containerSize),
      scaledSize * (size / containerSize),
      scaledSize * (size / containerSize)
    )

    return canvas.toDataURL('image/jpeg', 0.9)
  }, [cropData])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validações
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('Você só pode fazer upload de arquivos JPG/PNG!')
      return
    }

    try {
      // Comprimir imagem
      const compressedImage = await compressImage(file, 0.8)
      setOriginalImage(compressedImage)
      setCropData({ x: 0, y: 0, scale: 1 })
      setPreviewVisible(true)
    } catch (error) {
      message.error('Erro ao processar imagem')
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Funções de manipulação de mouse para arrastar
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropData.x, y: e.clientY - cropData.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const containerSize = 250 // Mesmo tamanho do preview visual
    const scaledSize = containerSize * cropData.scale
    const maxOffset = (scaledSize - containerSize) / 2

    const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x))
    const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y))

    setCropData(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleScaleChange = (value: number) => {
    setCropData(prev => ({ ...prev, scale: value }))
  }

  const handleSave = () => {
    const finalAvatar = generateCircularAvatar()
    if (finalAvatar) {
      onAvatarChange(finalAvatar)
      setPreviewVisible(false)
      message.success('Foto atualizada com sucesso!')
    }
  }

  const handleCancel = () => {
    setPreviewVisible(false)
    setOriginalImage('')
    setCropData({ x: 0, y: 0, scale: 1 })
  }

  return (
    <>
      <div className="text-center">
        <Avatar
          size={80}
          icon={<UserOutlined />}
          src={currentAvatar}
          className="bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-200"
        />
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            type="link"
            icon={<CameraOutlined />}
            size="small"
            className="text-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            Alterar foto
          </Button>
        </div>
      </div>

      <Modal
        title="Ajustar Foto do Perfil"
        open={previewVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancelar
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            Salvar
          </Button>
        ]}
        width={450}
        className="avatar-crop-modal"
      >
        <div className="text-center">
          <div className="mb-4">
            <div 
              className="relative inline-block"
              style={{
                width: 250,
                height: 250,
                border: '2px solid #1890ff',
                borderRadius: '50%',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {originalImage && (
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Preview"
                  style={{
                    position: 'absolute',
                    width: 250 * cropData.scale,
                    height: 250 * cropData.scale,
                    left: cropData.x - (250 * cropData.scale - 250) / 2,
                    top: cropData.y - (250 * cropData.scale - 250) / 2,
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-center space-x-3">
              <ZoomOutOutlined />
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={cropData.scale}
                onChange={handleScaleChange}
                style={{ width: 200 }}
              />
              <ZoomInOutlined />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Arraste a imagem para posicionar e use o controle para ajustar o zoom
            </p>
          </div>

          {/* Preview final */}
          <div className="mb-4">
            <p className="text-sm mb-2">Preview:</p>
            <Avatar
              size={80}
              src={originalImage ? generatePreviewAvatar(80) : undefined}
              icon={<UserOutlined />}
            />
          </div>
        </div>

        {/* Canvas oculto para gerar imagem final */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Modal>

      <style jsx global>{`
        .avatar-crop-modal .ant-modal-content {
          background: #1f1f1f;
          border: 1px solid #333;
        }
        
        .avatar-crop-modal .ant-modal-header {
          background: #1f1f1f;
          border-bottom: 1px solid #333;
        }
        
        .avatar-crop-modal .ant-modal-title {
          color: #fff;
        }
        
        .avatar-crop-modal .ant-slider-track {
          background: #1890ff;
        }
        
        .avatar-crop-modal .ant-slider-handle {
          border-color: #1890ff;
        }
      `}</style>
    </>
  )
}