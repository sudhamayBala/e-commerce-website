import { API_BASE_URL } from '../api'

export const getUserCart = async (userId) => {
  if (!userId) return { user_id: userId, items: [] }

  const response = await fetch(`${API_BASE_URL}/cart/${userId}`)
  if (!response.ok) {
    if (response.status === 404) return { user_id: userId, items: [] }
    throw new Error('Failed to load cart')
  }

  return response.json()
}

export const saveUserCart = async (userId, items) => {
  if (!userId) return { user_id: userId, items: items || [] }

  const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items || [] }),
  })

  if (!response.ok) {
    throw new Error('Failed to save cart')
  }

  return response.json()
}

export const clearUserCart = async (userId) => {
  if (!userId) return { user_id: userId, items: [] }

  const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to clear cart')
  }

  return response.json()
}
