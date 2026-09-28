import { Navigate } from 'react-router-dom'

const normalizeUserRole = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'admin' || normalized === 'owner') return 'admin'
  if (normalized === 'customer' || normalized === 'user') return 'customer'
  if (normalized === 'administrator') return 'admin'
  return normalized
}

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
    const parsedUser = rawUser ? JSON.parse(rawUser) : null

    if (!parsedUser) {
      return null
    }

    const roleValue = parsedUser.role?.value ?? parsedUser.role ?? parsedUser.user?.role?.value ?? parsedUser.user?.role ?? parsedUser.user_role
    return {
      ...parsedUser,
      role: normalizeUserRole(roleValue),
    }
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export default function OwnerRoute({ children }) {
  const token = localStorage.getItem('token')
  const user = readStoredUser()
  const role = normalizeUserRole(user?.role || user?.user?.role || user?.user_role || '')

  if (!token || !user || role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return children
}
