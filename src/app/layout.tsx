'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'

const inter = Inter({ subsets: ['latin'] })

const themeConfig = {
  token: {
    colorPrimary: '#5865f2',
    colorBgBase: '#2f3136',
    colorBgContainer: '#36393f',
    colorText: '#dcddde',
    colorTextSecondary: '#b9bbbe',
    colorBorder: '#40444b',
    borderRadius: 4,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Impravaveis BJJ MVP</title>
        <meta name="description" content="Sistema de gestão para academia de Jiu-Jitsu" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#5865f2" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Impravaveis BJJ" />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={themeConfig}>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}