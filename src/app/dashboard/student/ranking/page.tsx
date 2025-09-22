'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Avatar, Tag, Input, Select, Row, Col, Statistic, Typography, Space, Button } from 'antd';
import { UsergroupAddOutlined, FireOutlined, CalendarOutlined, SearchOutlined, FilterOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ActiveStudent {
  id: string;
  name: string;
  avatar?: string;
  totalCheckIns: number;
  weeklyCheckIns: number;
  monthlyCheckIns: number;
  frequency: number;
  lastCheckIn: string;
  belt: string;
  beltLevel: string;
  joinDate: string;
}

export default function ActiveStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('frequency');
  const [filterBelt, setFilterBelt] = useState('all');

  // Carregar dados dos alunos ativos (em produção seria da API)
  useEffect(() => {
    // Inicializar com dados vazios
    const studentsData: ActiveStudent[] = [];

    setTimeout(() => {
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtros e busca
  useEffect(() => {
    let filtered = [...students];

    // Filtro por nome (corrigido)
    if (searchTerm.trim()) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    // Filtro por faixa
    if (filterBelt !== 'all') {
      filtered = filtered.filter(student => student.belt === filterBelt);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'belt':
          // Ordem das faixas: Preta > Marrom > Roxa > Azul > Branca
          const beltOrder = { 'Preta': 5, 'Marrom': 4, 'Roxa': 3, 'Azul': 2, 'Branca': 1 };
          const orderA = beltOrder[a.belt as keyof typeof beltOrder] || 0;
          const orderB = beltOrder[b.belt as keyof typeof beltOrder] || 0;
          if (orderB !== orderA) return orderB - orderA;
          // Se mesma faixa, ordenar por grau (extrair número do grau)
          const grauA = parseInt(a.beltLevel.match(/\d+/)?.[0] || '0');
          const grauB = parseInt(b.beltLevel.match(/\d+/)?.[0] || '0');
          return grauB - grauA;
        case 'monthlyCheckIns':
          return b.monthlyCheckIns - a.monthlyCheckIns;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.frequency - a.frequency;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, sortBy, filterBelt]);

  const getBeltColor = (belt: string) => {
    const colors: { [key: string]: string } = {
      'Branca': '#f0f0f0',
      'Azul': '#1890ff',
      'Roxa': '#722ed1',
      'Marrom': '#8b4513',
      'Preta': '#000000'
    };
    return colors[belt] || '#f0f0f0';
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      flex: 1,
      minWidth: 120,
      render: (name: string) => (
        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
          {name}
        </div>
      ),
    },
    {
      title: 'Faixa',
      dataIndex: 'belt',
      key: 'belt',
      width: 100,
      render: (belt: string, record: ActiveStudent) => (
        <div style={{ textAlign: 'center' }}>
          <Tag 
            color={getBeltColor(belt)}
            style={{ 
              color: belt === 'Branca' ? '#000' : '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '4px',
              margin: 0
            }}
          >
            {belt} {record.beltLevel}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Frequência',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 90,
      render: (frequency: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: frequency >= 80 ? '#52c41a' : frequency >= 60 ? '#faad14' : '#ff4d4f' 
          }}>
            {frequency}%
          </div>
        </div>
      ),
    },
  ];

  const totalStudents = students.length;
  const activeStudents = students.filter(s => {
    const lastCheckIn = new Date(s.lastCheckIn);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastCheckIn >= weekAgo;
  }).length;

  const averageFrequency = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.frequency, 0) / students.length)
    : 0;

  return (
    <div style={{ padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.back()}
          style={{ marginBottom: '12px', backgroundColor: '#1f1f1f', borderColor: '#333', color: '#fff' }}
        >
          Voltar
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <UsergroupAddOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
          <Title level={3} style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
            Alunos Ativos
          </Title>
        </div>
        <Text style={{ color: '#666', fontSize: '14px' }}>
          Alunos presentes este mês
        </Text>
      </div>

      {/* Estatísticas */}
      <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ backgroundColor: '#1f1f1f', borderColor: '#333', textAlign: 'center' }} bodyStyle={{ padding: '16px' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: '12px' }}>Alunos Ativos</span>}
              value={totalStudents}
              valueStyle={{ color: '#fff', fontSize: '20px' }}
              prefix={<FireOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ backgroundColor: '#1f1f1f', borderColor: '#333', textAlign: 'center' }} bodyStyle={{ padding: '16px' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: '12px' }}>Sua Frequência</span>}
              value={85}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ backgroundColor: '#1f1f1f', borderColor: '#333', textAlign: 'center' }} bodyStyle={{ padding: '16px' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: '12px' }}>Média Geral</span>}
              value={averageFrequency}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              suffix="%"
              prefix={<FireOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ backgroundColor: '#1f1f1f', borderColor: '#333', marginBottom: '20px' }} bodyStyle={{ padding: '16px' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              prefix={<SearchOutlined style={{ color: '#666' }} />}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              placeholder="Ordenar por"
            >
              <Option value="frequency">Frequência</Option>
              <Option value="belt">Graduação</Option>
              <Option value="monthlyCheckIns">Check-ins do Mês</Option>
              <Option value="name">Nome</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filterBelt}
              onChange={setFilterBelt}
              style={{ width: '100%' }}
              placeholder="Filtrar faixa"
              prefix={<FilterOutlined />}
            >
              <Option value="all">Todas as Faixas</Option>
              <Option value="Branca">Branca</Option>
              <Option value="Azul">Azul</Option>
              <Option value="Roxa">Roxa</Option>
              <Option value="Marrom">Marrom</Option>
              <Option value="Preta">Preta</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tabela de Alunos Ativos */}
      <Card 
        style={{ backgroundColor: '#1f1f1f', borderColor: '#333' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} alunos`,
            style: { textAlign: 'center', marginTop: '16px' }
          }}
          scroll={{ x: 320, y: 400 }}
          size="small"
          className="active-students-table"
          style={{ backgroundColor: 'transparent' }}
        />
      </Card>

      <style jsx global>{`
        .active-students-table .ant-table {
          background: transparent !important;
        }
        
        .active-students-table .ant-table-thead > tr > th {
          background: #262626 !important;
          color: #fff !important;
          border-bottom: 1px solid #333 !important;
          font-weight: bold !important;
          text-align: center !important;
          padding: 8px 12px !important;
          font-size: 13px !important;
        }
        
        .active-students-table .ant-table-tbody > tr > td {
          background: #1f1f1f !important;
          border-bottom: 1px solid #333 !important;
          color: #fff !important;
          padding: 8px 12px !important;
        }
        
        .active-students-table .ant-table-tbody > tr:hover > td {
          background: #262626 !important;
        }
        
        .active-students-table .ant-pagination {
          text-align: center !important;
          margin-top: 16px !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-item {
          background: #262626 !important;
          border-color: #333 !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-item a {
          color: #fff !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-item-active {
          background: #52c41a !important;
          border-color: #52c41a !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-prev,
        .active-students-table .ant-pagination .ant-pagination-next {
          background: #262626 !important;
          border-color: #333 !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-prev a,
        .active-students-table .ant-pagination .ant-pagination-next a {
          color: #fff !important;
        }
        
        .active-students-table .ant-pagination .ant-pagination-total-text {
          color: #fff !important;
        }
        
        @media (max-width: 768px) {
          .active-students-table .ant-table-thead > tr > th,
          .active-students-table .ant-table-tbody > tr > td {
            padding: 6px 8px !important;
            font-size: 12px !important;
          }
          
          .active-students-table .ant-pagination {
            margin-top: 12px !important;
          }
          
          .active-students-table .ant-pagination .ant-pagination-prev,
          .active-students-table .ant-pagination .ant-pagination-next,
          .active-students-table .ant-pagination .ant-pagination-item {
            min-width: 32px !important;
            height: 32px !important;
            line-height: 30px !important;
            font-size: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .ranking-table .ant-table-thead > tr > th,
          .ranking-table .ant-table-tbody > tr > td {
            padding: 6px 2px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}