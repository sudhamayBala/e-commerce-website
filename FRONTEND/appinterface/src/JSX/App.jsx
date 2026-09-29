import Login from '../pages/login'
import OwnerRoute from '../features/authentication/ownerRoute'
import Home from '../pages/home'
import Cart from '../pages/cart'
import Owner from '../pages/owner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import '../css/App.css'
import { useEffect, useState } from 'react'
import { getProducts } from '../api/product/getProducts'
import { getUserCart, saveUserCart } from '../api/cart'
import { API_BASE_URL } from '../api.jsx'

const normalizeUserRole = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === 'admin' || normalized === 'owner' || normalized === 'administrator') return 'admin'
  if (normalized === 'customer' || normalized === 'user') return 'customer'
  return normalized
}

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
    const parsedUser = rawUser ? JSON.parse(rawUser) : null
    if (!parsedUser) return null

    const roleValue = parsedUser.role?.value ?? parsedUser.role ?? parsedUser.user?.role?.value ?? parsedUser.user?.role ?? parsedUser.user_role
    return { ...parsedUser, role: normalizeUserRole(roleValue) }
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const hasValidSession = () => {
  const token = localStorage.getItem('token')
  const user = getStoredUser()

  if (!token || !user || !user.email) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return false
  }

  return true
}

const readPersistedCart = () => {
  try {
    const rawCart = localStorage.getItem('shopnest-cart')
    const parsed = rawCart ? JSON.parse(rawCart) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function App() {
  const [cart, setCart] = useState(() => readPersistedCart())
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    localStorage.setItem('shopnest-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const syncCartToBackend = async () => {
      const storedUser = getStoredUser()
      const userId = Number(storedUser?.id ?? storedUser?.user_id ?? 0)
      if (!userId) return

      try {
        const backendCart = await getUserCart(userId)
        const backendItems = Array.isArray(backendCart?.items) ? backendCart.items : []
        const localItems = Object.entries(cart).map(([product_id, quantity]) => ({
          product_id: Number(product_id),
          quantity: Number(quantity || 0),
        }))

        if (backendItems.length === 0 && localItems.length > 0) {
          await saveUserCart(userId, localItems)
          return
        }

        if (localItems.length > 0) {
          await saveUserCart(userId, localItems)
        }
      } catch (error) {
        console.error('Cart sync failed:', error)
      }
    }

    syncCartToBackend()
  }, [cart])

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      try {
        const backendProducts = await getProducts()
        if (isMounted) {
          setProducts(Array.isArray(backendProducts) ? backendProducts : [])
        }
      } catch (error) {
        console.error('Failed to load products from backend:', error)
        if (isMounted) setProducts([])
      }
    }

    const loadOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`)
        if (!response.ok) {
          throw new Error(`Orders request failed: ${response.status}`)
        }

        const backendOrders = await response.json()
        if (isMounted) {
          setOrders(Array.isArray(backendOrders) ? backendOrders : [])
        }
      } catch (error) {
        console.error('Failed to load orders from backend:', error)
        if (isMounted) setOrders([])
      }
    }

    loadProducts()
    loadOrders()
    return () => {
      isMounted = false
    }
  }, [])

  const user = getStoredUser()
  const isAuthenticated = hasValidSession()
  const token = isAuthenticated ? localStorage.getItem('token') : null
  const userRole = normalizeUserRole(user?.role || '')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token && userRole === 'admin' ? '/owner' : token ? '/home' : '/login'} replace />} />
        <Route path="/login" element={token ? <Navigate to={userRole === 'admin' ? '/owner' : '/home'} replace /> : <Login />} />
        <Route path="/home" element={<Home cart={cart} setCart={setCart} productsList={products} setProductsList={setProducts} orders={orders} setOrders={setOrders} setProducts={setProducts} />} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} products={products} setProducts={setProducts} setOrders={setOrders} />} />
        <Route path="/owner" element={<OwnerRoute><Owner products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} /></OwnerRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
