import Login from './user/login'
import Home from './homePage/home'
import Cart from './cart/cart'
import Owner from './owner/owner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import '../css/App.css'
import { useState } from 'react'
import { products as initialProducts } from './data/products'

function OwnerRoute({ children }) {
  const token = localStorage.getItem('token')
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
  }
  const role = String(user?.role || user?.user?.role || user?.user_role || '').trim().toLowerCase()

  if (!token || (role !== 'admin' && role !== 'owner')) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const [cart, setCart] = useState({})
  const [products, setProducts] = useState(initialProducts)
  const [orders, setOrders] = useState([])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home cart={cart} setCart={setCart} productsList={products} setProductsList={setProducts} orders={orders} setOrders={setOrders} setProducts={setProducts} />} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} products={products} setProducts={setProducts} setOrders={setOrders} />} />
        <Route path="/owner" element={<OwnerRoute><Owner products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} /></OwnerRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
