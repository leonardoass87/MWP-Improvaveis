export type UserRole = 'admin' | 'instructor' | 'student'

export type BeltColor = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta'

export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: UserRole
  belt?: BeltColor
  degree?: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CheckIn {
  id: number
  userId: number
  date: Date
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: Date
  createdAt: Date
}

export interface CheckInWithUser extends CheckIn {
  user: User
}

export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  monthlyFrequency: number
  todayCheckIns: number
  pendingCheckIns: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  belt?: BeltColor
  degree?: number
  active: boolean
  phone?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  birthDate?: string
  weight?: string
  height?: string
  medicalInfo?: string
  goals?: string
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: UserRole
  belt?: BeltColor
  degree?: number
}

export interface UpdateUserData {
  name?: string
  email?: string
  belt?: BeltColor
  degree?: number
  active?: boolean
}