const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCheckinFlow() {
  try {
    console.log('🔍 Testando fluxo de check-in...\n')

    // 1. Verificar usuários existentes
    console.log('1. Verificando usuários...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    })
    
    console.log(`   Encontrados ${users.length} usuários:`)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.active ? 'Ativo' : 'Inativo'}`)
    })

    // 2. Verificar check-ins existentes
    console.log('\n2. Verificando check-ins...')
    const checkins = await prisma.checkin.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`   Encontrados ${checkins.length} check-ins:`)
    checkins.forEach(checkin => {
      console.log(`   - ${checkin.user.name}: ${checkin.date} (${checkin.status})`)
    })

    // 3. Verificar check-ins pendentes especificamente
    console.log('\n3. Verificando check-ins pendentes...')
    const pendingCheckins = await prisma.checkin.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    console.log(`   Encontrados ${pendingCheckins.length} check-ins pendentes:`)
    pendingCheckins.forEach(checkin => {
      console.log(`   - ${checkin.user.name}: ${checkin.date} (criado em ${checkin.createdAt})`)
    })

    // 4. Criar um check-in de teste se não houver alunos
    const students = users.filter(u => u.role === 'student' && u.active)
    if (students.length === 0) {
      console.log('\n4. Nenhum aluno ativo encontrado. Criando aluno de teste...')
      
      const testStudent = await prisma.user.create({
        data: {
          name: 'Aluno Teste',
          email: 'aluno.teste@bjj.com',
          password: '$2b$10$test.hash.password',
          role: 'student',
          belt: 'branca',
          active: true
        }
      })
      
      console.log(`   Aluno criado: ${testStudent.name}`)
      
      // Criar check-in pendente
      const today = new Date().toISOString().split('T')[0]
      const testCheckin = await prisma.checkin.create({
        data: {
          userId: testStudent.id,
          date: today,
          status: 'pending'
        }
      })
      
      console.log(`   Check-in criado: ${testCheckin.id} para ${today}`)
    } else if (pendingCheckins.length === 0) {
      console.log('\n4. Criando check-in de teste para aluno existente...')
      
      const student = students[0]
      const today = new Date().toISOString().split('T')[0]
      
      // Verificar se já existe check-in hoje
      const existingToday = await prisma.checkin.findFirst({
        where: {
          userId: student.id,
          date: today
        }
      })
      
      if (!existingToday) {
        const testCheckin = await prisma.checkin.create({
          data: {
            userId: student.id,
            date: today,
            status: 'pending'
          }
        })
        
        console.log(`   Check-in criado: ${testCheckin.id} para ${student.name}`)
      } else {
        console.log(`   ${student.name} já tem check-in hoje: ${existingToday.status}`)
      }
    }

    // 5. Verificar professores/instrutores
    console.log('\n5. Verificando professores/instrutores...')
    const instructors = users.filter(u => u.role === 'instructor' || u.role === 'admin')
    console.log(`   Encontrados ${instructors.length} professores/admins:`)
    instructors.forEach(instructor => {
      console.log(`   - ${instructor.name} (${instructor.role})`)
    })

    if (instructors.length === 0) {
      console.log('\n   Criando professor de teste...')
      const testInstructor = await prisma.user.create({
        data: {
          name: 'Professor Teste',
          email: 'professor.teste@bjj.com',
          password: '$2b$10$test.hash.password',
          role: 'instructor',
          belt: 'preta',
          degree: 1,
          active: true
        }
      })
      console.log(`   Professor criado: ${testInstructor.name}`)
    }

    console.log('\n✅ Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCheckinFlow()