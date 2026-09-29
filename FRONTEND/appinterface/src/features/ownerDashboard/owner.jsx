import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import '../../css/RegisterLogin/Home.css'
import 'leaflet/dist/leaflet.css'
import { getStoreSettings, saveStoreSettings, formatCurrency } from '../../sharedData/storeSettings'
import { getErrorMessage } from '../../api/requestError'
import { createProduct } from '../../api/product/createProduct'
import { deleteProduct as deleteProductFromDatabase } from '../../api/product/deleteProduct'
import { getProducts } from '../../api/product/getProducts'
import { updateProduct } from '../../api/product/updateProduct'
import { createCategory } from '../../api/category/createCategory'
import { getCategories } from '../../api/category/getCategories'
import { API_BASE_URL } from '../../api.jsx'

export default function Owner({ products, setProducts, orders, setOrders }) {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('dashboard')
  const [productForm, setProductForm] = useState({ name: '', type: '', description: '', price: '', cost_price: '', selling_price: '', stock: '', image: '' })
  const [storeSettings, setStoreSettings] = useState(getStoreSettings)
  const [savedSettings, setSavedSettings] = useState(false)
  const [areaSearch, setAreaSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('all')
  const [selectedReturnKey, setSelectedReturnKey] = useState(null)
  const [analyticsType, setAnalyticsType] = useState('all')
  const [analyticsArea, setAnalyticsArea] = useState('all')
  const { storeName, supportEmail, currency } = storeSettings
  const openOrders = orders.filter((order) => order.status !== 'Delivered').length
  const customerCount = new Set(orders.map((order) => order.customer).filter(Boolean)).size
  const currentMonth = new Date()
  const monthlyOrders = orders.filter((order) => {
    if (order.status === 'Cancelled') return false
    if (!order.createdAt) return false
    const orderDate = new Date(order.createdAt)
    return orderDate.getFullYear() === currentMonth.getFullYear() && orderDate.getMonth() === currentMonth.getMonth()
  })
  const salesByProduct = products.map((product) => {
    const monthlySales = monthlyOrders.reduce((total, order) => total + (order.products || [])
      .filter((item) => item.productId === product.id)
      .reduce((quantity, item) => quantity + item.quantity, 0), 0)
    const reviews = product.reviews || []
    const rating = reviews.length
      ? reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length
      : null
    return { ...product, monthlySales, rating }
  }).sort((first, second) => second.monthlySales - first.monthlySales)
  const typeSales = Object.values(salesByProduct.reduce((types, product) => {
    const type = types[product.category] || { name: product.category, sales: 0 }
    type.sales += product.monthlySales
    return { ...types, [product.category]: type }
  }, {})).sort((first, second) => second.sales - first.sales)
  const selectedProduct = products.find((product) => String(product.id) === selectedProductId)
  const salesByArea = monthlyOrders.reduce((areas, order) => {
    const coordinates = order.location?.coordinates
    if (!coordinates || coordinates.length !== 2) return areas
    const name = order.location.city || order.location.address || `${coordinates[0].toFixed(2)}, ${coordinates[1].toFixed(2)}`
      const area = areas[name] || { name, coordinates, sales: 0, products: {}, area: order.location?.city || order.location?.address || 'Unknown area' }
    ;(order.products || []).forEach((item) => {
      area.sales += item.quantity
      const product = area.products[item.productId] || { name: item.name, sales: 0, returned: 0, causes: {} }
      product.sales += item.quantity
      if (item.returnStatus && item.returnStatus !== 'Not returned') {
        product.returned += item.returnQuantity || item.quantity
        if (item.returnReason) product.causes[item.returnReason] = (product.causes[item.returnReason] || 0) + (item.returnQuantity || item.quantity)
      }
      area.products[item.productId] = product
    })
    return { ...areas, [name]: area }
  }, {})
  const areaMarkers = Object.values(salesByArea)
  const selectedAreaSales = Object.values(salesByArea).map((area) => {
    const product = selectedProductId === 'all' ? null : area.products[selectedProductId]
    return { ...area, productSales: product?.sales || 0, productReturns: product?.returned || 0, returnCauses: product?.causes || {} }
  }).filter((area) => area.name.toLowerCase().includes(areaSearch.toLowerCase()))
  const selectedProductTotal = selectedAreaSales.reduce((total, area) => total + area.productSales, 0)
  const maxTypeSales = Math.max(...typeSales.map((type) => type.sales), 1)
  const maxAreaSales = Math.max(...selectedAreaSales.map((area) => area.productSales), 1)
  const previousMonthOrders = orders.filter((order) => {
    if (order.status === 'Cancelled') return false
    if (!order.createdAt) return false
    const orderDate = new Date(order.createdAt)
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    return orderDate.getFullYear() === previousMonth.getFullYear() && orderDate.getMonth() === previousMonth.getMonth()
  })
  const getProductSales = (orderList, productId) => orderList.reduce((total, order) => total + (order.products || [])
    .filter((item) => item.productId === productId)
    .reduce((quantity, item) => quantity + item.quantity, 0), 0)
  const stockPlot = [...products].sort((first, second) => (second.stock || 0) - (first.stock || 0))
  const returnPlot = Object.values(orders.reduce((returns, order) => {
    const area = order.location?.city || order.location?.address || 'Unknown area'
    ;(order.products || []).forEach((item) => {
      if (!item.returnStatus || item.returnStatus === 'Not returned') return
      const key = `${item.productId}-${area}`
      const entry = returns[key] || { key, productId: item.productId, name: item.name, area, quantity: 0, causes: {} }
      const quantity = Number(item.returnQuantity ?? item.quantity ?? 0)
      entry.quantity += quantity
      if (item.returnReason) entry.causes[item.returnReason] = (entry.causes[item.returnReason] || 0) + quantity
      returns[key] = entry
    })
    return returns
  }, {})).sort((first, second) => second.quantity - first.quantity)
  const selectedReturn = returnPlot.find((entry) => entry.key === selectedReturnKey)
  const getAreaTypeSales = (orderList) => orderList.reduce((areas, order) => {
    const area = order.location?.city || order.location?.address || 'Unknown area'
    if (!area) return areas
    ;(order.products || []).forEach((item) => {
      const product = products.find((catalogProduct) => catalogProduct.id === item.productId)
      const type = product?.category || 'Other'
      const key = `${area}-${type}`
      areas[key] = { area, type, sales: (areas[key]?.sales || 0) + item.quantity }
    })
    return areas
  }, {})
  const currentAreaTypes = getAreaTypeSales(monthlyOrders)
  const previousAreaTypes = getAreaTypeSales(previousMonthOrders)
  const areaTypeChanges = Object.values(currentAreaTypes).map((entry) => {
    const previousSales = previousAreaTypes[`${entry.area}-${entry.type}`]?.sales || 0
    const change = previousSales ? ((entry.sales - previousSales) / previousSales) * 100 : entry.sales ? 100 : 0
    return { ...entry, previousSales, change }
  }).sort((first, second) => second.change - first.change)
  const maxStock = Math.max(...stockPlot.map((product) => product.stock || 0), 1)
  const maxReturn = Math.max(...returnPlot.map((entry) => entry.quantity), 1)
  const maxAreaTypeChange = Math.max(...areaTypeChanges.map((entry) => Math.abs(entry.change)), 1)
  const analyticsTypes = [...new Set(products.map((product) => product.category).filter(Boolean))]
  const analyticsAreas = [...new Set(orders.map((order) => order.location?.city || order.location?.address || 'Unknown area').filter(Boolean))].sort()
  const matchesAnalyticsFilter = (order, item) => {
    const product = products.find((catalogProduct) => catalogProduct.id === item.productId)
    const area = order.location?.city || order.location?.address
    return (analyticsType === 'all' || product?.category === analyticsType) && (analyticsArea === 'all' || area === analyticsArea)
  }
  const filteredOrderValue = (order) => (order.products || []).filter((item) => matchesAnalyticsFilter(order, item)).reduce((total, item) => {
    const product = products.find((catalogProduct) => catalogProduct.id === item.productId)
    return total + (product?.price || 0) * Number(item.quantity || 0)
  }, 0)
  const pieSales = Object.values(monthlyOrders.reduce((segments, order) => {
    const area = order.location?.city || order.location?.address || 'Unknown area'
    ;(order.products || []).forEach((item) => {
      const product = products.find((catalogProduct) => catalogProduct.id === item.productId)
      const productType = product?.category || 'Other'
      if (analyticsType !== 'all' && productType !== analyticsType) return
      if (analyticsArea !== 'all' && area !== analyticsArea) return

      const segmentName = analyticsType !== 'all'
        ? area
        : analyticsArea !== 'all'
          ? product?.name || item.name || 'Unknown product'
          : productType
      const segment = segments[segmentName] || { name: segmentName, sales: 0 }
      segment.sales += (product?.selling_price ?? product?.price ?? 0) * Number(item.quantity || 0)
      segments[segmentName] = segment
    })
    return segments
  }, {})).sort((first, second) => second.sales - first.sales)
  const filteredMonthlyOrders = monthlyOrders.filter((order) => (order.products || []).some((item) => matchesAnalyticsFilter(order, item)))
  const productProfitData = products.map((product) => {
    const soldUnits = filteredMonthlyOrders.reduce((total, order) => total + ((order.products || [])
      .filter((item) => item.productId === product.id && matchesAnalyticsFilter(order, item))
      .reduce((sum, item) => {
        return sum + Number(item.quantity || 0)
      }, 0)), 0)
    const totalProfit = filteredMonthlyOrders.reduce((total, order) => total + ((order.products || [])
      .filter((item) => item.productId === product.id && matchesAnalyticsFilter(order, item))
      .reduce((sum, item) => {
        const unitSellingPrice = Number(item.unitSellingPrice ?? item.unit_selling_price ?? item.selling_price ?? product.selling_price ?? product.price ?? 0)
        const unitCostPrice = Number(item.unitCostPrice ?? item.unit_cost_price ?? item.cost_price ?? product.cost_price ?? 0)
        return sum + ((unitSellingPrice - unitCostPrice) * Number(item.quantity || 0))
      }, 0)), 0)
    const productSellingPrice = Number(product.selling_price ?? product.price ?? 0)
    const productCost = Number(product.cost_price ?? 0)
    return {
      name: product.name,
      profit: totalProfit,
      units: soldUnits,
      selling: productSellingPrice,
      cost: productCost,
    }
  }).filter((product) => product.profit > 0 || product.units > 0).sort((first, second) => second.profit - first.profit)
  const profitMin = productProfitData.length ? Math.min(...productProfitData.map((product) => product.profit), 0) : 0
  const profitMax = productProfitData.length ? Math.max(...productProfitData.map((product) => product.profit), 0) : 1
  const profitRange = Math.max(profitMax - profitMin, 1)
  const profitAreaPoints = productProfitData.length
    ? productProfitData.map((product, index) => {
        const x = productProfitData.length === 1 ? 50 : (index / (productProfitData.length - 1)) * 100
        const y = productProfitData.length === 1 ? 50 : 100 - ((product.profit - profitMin) / profitRange) * 80
        return `${x},${y}`
      }).join(' ')
    : ''
  const profitAreaPath = productProfitData.length
    ? `M 0 100 ${productProfitData.map((product, index) => {
        const x = productProfitData.length === 1 ? 50 : (index / (productProfitData.length - 1)) * 100
        const y = productProfitData.length === 1 ? 50 : 100 - ((product.profit - profitMin) / profitRange) * 80
        return `L ${x} ${y}`
      }).join(' ')} L 100 100 Z`
    : ''
  const typeQuantitySales = Object.values(monthlyOrders.reduce((segments, order) => {
    ;(order.products || []).forEach((item) => {
      const product = products.find((catalogProduct) => catalogProduct.id === item.productId)
      const productType = product?.category || 'Other'
      if (analyticsType !== 'all' && productType !== analyticsType) return
      const area = order.location?.city || order.location?.address || 'Unknown area'
      if (analyticsArea !== 'all' && area !== analyticsArea) return

      const segment = segments[productType] || { name: productType, quantity: 0 }
      segment.quantity += Number(item.quantity || 0)
      segments[productType] = segment
    })
    return segments
  }, {})).sort((first, second) => second.quantity - first.quantity)
  const maxTypeQuantity = Math.max(...typeQuantitySales.map((type) => type.quantity), 1)
  const quantityLinePoints = typeQuantitySales.length
    ? typeQuantitySales.map((type, index) => {
        const x = typeQuantitySales.length === 1 ? 50 : (index / (typeQuantitySales.length - 1)) * 100
        const y = 100 - (type.quantity / maxTypeQuantity) * 88
        return `${x},${y}`
      }).join(' ')
    : ''
  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const salesInRange = (startDate, endDate) => orders.reduce((total, order) => {
    if (order.status === 'Cancelled' || !order.createdAt) return total
    const orderDate = new Date(order.createdAt)
    return orderDate >= startDate && orderDate < endDate ? total + filteredOrderValue(order) : total
  }, 0)
  const todayStart = startOfDay(currentMonth)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)
  const previousWeekStart = new Date(todayStart)
  previousWeekStart.setDate(previousWeekStart.getDate() - 13)
  const previousMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1)
  const currentDaySales = salesInRange(todayStart, tomorrowStart)
  const previousDaySales = salesInRange(yesterdayStart, todayStart)
  const currentWeekSales = salesInRange(weekStart, tomorrowStart)
  const previousWeekSales = salesInRange(previousWeekStart, weekStart)
  const currentMonthSales = salesInRange(new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), tomorrowStart)
  const previousMonthSales = salesInRange(previousMonthStart, new Date(todayStart.getFullYear(), todayStart.getMonth(), 1))
  const percentageChange = (current, previous) => previous ? ((current - previous) / previous) * 100 : current ? 100 : 0
  const salesPeriods = [
    { name: 'Today', current: currentDaySales, previous: previousDaySales, comparison: 'vs previous day' },
    { name: 'Last 7 days', current: currentWeekSales, previous: previousWeekSales, comparison: 'vs previous week' },
    { name: 'This month', current: currentMonthSales, previous: previousMonthSales, comparison: 'vs previous month' },
  ]
  const dailySales = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(todayStart)
    date.setDate(date.getDate() - (13 - index))
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    return { label: date.toLocaleDateString('default', { weekday: 'short', day: 'numeric' }), value: salesInRange(date, nextDate) }
  })
  const maxDailySales = Math.max(...dailySales.map((day) => day.value), 1)
  const linePoints = dailySales.map((day, index) => `${(index / (dailySales.length - 1)) * 100},${100 - (day.value / maxDailySales) * 88}`).join(' ')
  const pieSalesTotal = pieSales.reduce((total, segment) => total + segment.sales, 0)
  const pieStops = pieSales.reduce((stops, segment, index) => {
    const start = stops.length ? stops[stops.length - 1].end : 0
    const end = start + (pieSalesTotal ? (segment.sales / pieSalesTotal) * 100 : 0)
    return [...stops, { ...segment, start, end, color: ['#e26d4e', '#586b31', '#d9a441', '#28634a', '#7d6b91'][index % 5] }]
  }, [])
  const pieTitle = analyticsType !== 'all'
    ? `Sales by area for ${analyticsType}`
    : analyticsArea !== 'all'
      ? `Products sold in ${analyticsArea}`
      : 'Sales by product type'
  const resetAnalyticsFilters = () => {
    setAnalyticsType('all')
    setAnalyticsArea('all')
  }
  const ratingByType = Object.values(products.reduce((types, product) => {
    const reviews = product.reviews || []
    const type = types[product.category] || { name: product.category, total: 0, count: 0 }
    type.total += reviews.reduce((total, review) => total + Number(review.rating || 0), 0)
    type.count += reviews.length
    return { ...types, [product.category]: type }
  }, {})).map((type) => ({ ...type, rating: type.count ? type.total / type.count : 0 }))

  const refreshProductsFromServer = useCallback(async () => {
    try {
      const backendProducts = await getProducts()
      setProducts(Array.isArray(backendProducts) ? backendProducts : [])
    } catch (error) {
      console.error('Failed to sync product catalog from backend:', error)
    }
  }, [setProducts])

  const refreshOrdersFromServer = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`)
      if (!response.ok) {
        throw new Error(`Orders request failed: ${response.status}`)
      }

      const backendOrders = await response.json()
      setOrders(Array.isArray(backendOrders) ? backendOrders : [])
    } catch (error) {
      console.error('Failed to sync orders from backend:', error)
    }
  }, [setOrders])

  useEffect(() => {
    refreshProductsFromServer()
    refreshOrdersFromServer()
  }, [refreshProductsFromServer, refreshOrdersFromServer])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  const addProduct = async (event) => {
    event.preventDefault()

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || 'New product added from owner dashboard.',
      price: Number(productForm.selling_price || productForm.price || 0),
      selling_price: Number(productForm.selling_price || productForm.price || 0),
      cost_price: Number(productForm.cost_price || 0),
      stock_quantity: Number(productForm.stock),
      image_url: productForm.image || '',
    }

    try {
      if (!productForm.image) {
        throw new Error('Please choose a product image before saving.')
      }

      const duplicate = products.some((product) => product.name?.trim().toLowerCase() === payload.name.toLowerCase())
      if (duplicate) {
        throw new Error(`A product named '${payload.name}' already exists. Choose a different name.`)
      }

      const categoryName = productForm.type.trim()
      const categories = await getCategories()
      const existingCategory = categories.find((category) => category.name.trim().toLowerCase() === categoryName.toLowerCase())
      const category = existingCategory || await createCategory({ name: categoryName, description: `${categoryName} products` })
      payload.category_id = category.id
      const createdProduct = await createProduct(payload)
      if (!createdProduct.image_url) {
        throw new Error('The backend did not save the uploaded product image. Restart the backend and try again.')
      }

      const savedProduct = {
        ...createdProduct,
        image: createdProduct.image_url.startsWith('http') || createdProduct.image_url.startsWith('data:')
          ? createdProduct.image_url
          : `${API_BASE_URL}/static/uploads/${createdProduct.image_url}`,
      }
      setProducts((current) => {
        const productId = savedProduct.id || savedProduct.product_id
        const alreadyLoaded = current.some((item) => (item.id || item.product_id) === productId)
        return alreadyLoaded
          ? current.map((item) => ((item.id || item.product_id) === productId ? savedProduct : item))
          : [...current, savedProduct]
      })
      setProductForm({ name: '', type: '', description: '', price: '', cost_price: '', selling_price: '', stock: '', image: '' })
      setActiveView('manage-inventory')
    } catch (error) {
      console.error('Failed to create product:', error)
      alert(getErrorMessage(error, 'Unable to create product'))
    }
  }

  const deleteProduct = async (productId, productName) => {
    if (!window.confirm(`Permanently delete ${productName}? This cannot be undone.`)) return

    try {
      await deleteProductFromDatabase(productId)
      setProducts((current) => current.filter((product) => (product.id || product.product_id) !== productId))
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert(getErrorMessage(error, 'Unable to delete product'))
    }
  }

  const updateOrderStatus = (orderId, status) => {
    setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? { ...order, status } : order))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      alert('Please choose a PNG, JPEG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 7 * 1024 * 1024) {
      alert('Image must be smaller than 7 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProductForm((current) => ({ ...current, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="owner-page">
      <header className="owner-header">
        <a className="brand" href="/owner">{storeName}<span>.</span></a>
        <div className="owner-header-actions">
          <span className="owner-label">Owner dashboard</span>
          <button className="owner-logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="owner-content">
        <section className="owner-welcome">
          <p className="eyebrow">Store overview</p>
          <h1>Welcome back, owner.</h1>
          <p>Manage your shop, keep an eye on orders, and make your next best move.</p>
        </section>

        {activeView === 'dashboard' && <section className="owner-stats" aria-label="Store statistics">
              <article><span>Today's sales</span><strong>{formatCurrency(currentDaySales, currency)}</strong><small>{orders.filter((order) => order.status !== 'Cancelled').length} recorded orders</small></article>
          <article><span>Open orders</span><strong>{openOrders}</strong><small>{orders.filter((order) => order.status === 'Preparing').length} preparing</small></article>
          <article><span>Products</span><strong>{products.length}</strong><small>{products.filter((product) => product.stock <= 5).length} low in stock</small></article>
          <article><span>Customers</span><strong>{customerCount}</strong><small>From recorded orders</small></article>
        </section>}

        {activeView === 'dashboard' && <section className="owner-panels">
          <article className="owner-panel">
            <p className="eyebrow">Quick actions</p>
            <h2>Run your store</h2>
            <div className="owner-actions">
              <button onClick={() => setActiveView('add-product')}>Add product <span>+</span></button>
              <button onClick={() => setActiveView('orders')}>View orders <span>→</span></button>
              <button onClick={() => setActiveView('manage-inventory')}>Manage inventory <span>→</span></button>
              <button onClick={() => setActiveView('settings')}>Store settings <span>↗</span></button>
            </div>
          </article>
          <article className="owner-panel owner-highlight">
            <span className="owner-highlight-icon">✦</span>
            <p className="eyebrow">{storeName} tip</p>
            <h2>Your best sellers are moving fast.</h2>
            <p>Restock your top three products before the weekend rush.</p>
            <button onClick={() => setActiveView('review-inventory')}>Review inventory <span>→</span></button>
          </article>
        </section>}

        {activeView !== 'dashboard' && <section className="owner-workspace">
          <button className="workspace-back" onClick={() => setActiveView('dashboard')}>← Dashboard</button>

          {activeView === 'add-product' && <div className="workspace-content">
            <p className="eyebrow">Catalog</p>
            <h2>Add a new product</h2>
            <form className="owner-form" onSubmit={addProduct}>
              <label>Product name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
              <label>Product type<input value={productForm.type} onChange={(event) => setProductForm({ ...productForm, type: event.target.value })} placeholder="e.g. Tech, Fashion, Beauty" required /></label>
              <label>Description<textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} rows="3" placeholder="Short product description" /></label>
              <label>Cost price<input type="number" min="0" value={productForm.cost_price} onChange={(event) => setProductForm({ ...productForm, cost_price: event.target.value })} required /></label>
              <label>Selling price<input type="number" min="0" value={productForm.selling_price} onChange={(event) => setProductForm({ ...productForm, selling_price: event.target.value })} required /></label>
              <label>Price<input type="number" min="0" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value, selling_price: event.target.value })} required /></label>
              <label>Stock quantity<input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required /></label>
              <label>Product image<input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} required />{productForm.image && <img className="product-upload-preview" src={productForm.image} alt="New product preview" />}</label>
              <button className="workspace-primary" type="submit">Add product</button>
            </form>
          </div>}

          {activeView === 'orders' && <div className="workspace-content">
            <p className="eyebrow">Fulfillment</p><h2>Recent orders</h2>
            <div className="order-list">{orders.length === 0 ? <p>No orders yet.</p> : orders.map((order) => <div key={order.id}><strong>#{order.id}</strong><span>{order.customer} · {order.items} items · {formatCurrency(order.total, currency)}</span><select className="order-status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}><option>Preparing</option><option>Delivered</option><option>Cancelled</option></select></div>)}</div>
          </div>}

          {activeView === 'manage-inventory' && <div className="workspace-content">
            <p className="eyebrow">Catalog</p><h2>Manage inventory</h2>
            <p className="inventory-intro">Update stock quantities or remove products from your catalog.</p>
            <div className="inventory-list">{products.map((product, index) => <div key={`${product.name}-${index}`}><span><strong>{product.name}</strong><small>{formatCurrency(product.price, currency)}</small></span><label>Stock<input type="number" min="0" value={product.stock_quantity ?? product.stock ?? 0} onChange={async (event) => {
              const nextQuantity = Number(event.target.value)
              const productId = product.id || product.product_id
              const payload = {
                name: product.name,
                description: product.description || 'Updated from owner dashboard.',
                price: Number(product.price),
                stock_quantity: nextQuantity,
                image_url: product.image_url || product.image || '',
                category_id: Number(product.category_id || 1),
              }
              try {
                await updateProduct(productId, payload)
                setProducts((current) => current.map((item) => ((item.id || item.product_id) === productId ? { ...item, stock_quantity: nextQuantity, stock: nextQuantity } : item)))
              } catch (error) {
                console.error('Failed to update stock:', error)
                alert(getErrorMessage(error, 'Unable to update stock'))
              }
            }} /></label><button className="delete-product-button" onClick={() => deleteProduct(product.id || product.product_id, product.name)}>Delete</button></div>)}</div>
          </div>}

          {activeView === 'review-inventory' && <div className="workspace-content">
            <p className="eyebrow">{currentMonth.toLocaleString('default', { month: 'long' })} performance</p><h2>Review inventory</h2>
            <p className="inventory-intro">Products ranked by units sold this month. Ratings are based on customer reviews.</p>
            <div className="inventory-list inventory-sales-list">{salesByProduct.map((product, index) => <div key={`${product.id}-${index}`}>
              <span className="inventory-product-name"><b>{index + 1}</b><strong>{product.name}</strong><small>{formatCurrency(product.price, currency)} · {product.stock} in stock</small></span>
              <span className="inventory-sales-count"><strong>{product.monthlySales}</strong><small>units sold</small><small className={product.monthlySales >= getProductSales(previousMonthOrders, product.id) ? 'sales-up' : 'sales-down'}>{product.monthlySales >= getProductSales(previousMonthOrders, product.id) ? '↑' : '↓'} {Math.abs(product.monthlySales - getProductSales(previousMonthOrders, product.id))} vs last month</small></span>
              <span className="inventory-rating"><strong>{product.rating === null ? '—' : `${product.rating.toFixed(1)} / 5`}</strong><small>{product.reviews?.length || 0} reviews</small></span>
            </div>)}</div>
            <div className="analytics-graphs analytics-graphs-three">
              <section className="analytics-graph"><p className="eyebrow">Available stock</p><h3>Products currently in stock</h3><div className="bar-chart">{stockPlot.map((product) => <div className="bar-row" key={product.id}><span>{product.name}</span><div className="bar-track"><i style={{ width: `${((product.stock || 0) / maxStock) * 100}%` }} /></div><strong>{product.stock || 0}</strong></div>)}</div></section>
              <section className="analytics-graph"><p className="eyebrow">Returned products</p><h3>Returns by product and area</h3>{returnPlot.length === 0 ? <p className="analytics-note">No product returns recorded.</p> : <div className="return-plot">{returnPlot.map((entry) => <button className={`return-plot-row ${selectedReturnKey === entry.key ? 'selected' : ''}`} key={entry.key} onClick={() => setSelectedReturnKey(entry.key)}><span><strong>{entry.name}</strong><small>{entry.area}</small><small>Cause: {Object.entries(entry.causes).map(([cause, count]) => `${cause} (${count})`).join(', ') || 'Not provided'}</small><i className="return-bar-track"><em style={{ width: `${(entry.quantity / maxReturn) * 100}%` }} /></i></span><b>{entry.quantity}<small>returned</small></b></button>)}</div>}{selectedReturn && <div className="return-cause-detail"><strong>{selectedReturn.name} returned from {selectedReturn.area}</strong><p>{Object.entries(selectedReturn.causes).map(([cause, count]) => `${cause}: ${count}`).join(' · ') || 'Cause not provided'}</p></div>}</section>
              <section className="analytics-graph"><p className="eyebrow">Area and type trend</p><h3>Sales increase or decrease</h3>{areaTypeChanges.length === 0 ? <p className="analytics-note">Complete orders with an area to see this trend.</p> : <div className="bar-chart">{areaTypeChanges.map((entry) => <div className="bar-row trend-row" key={`${entry.area}-${entry.type}`}><span>{entry.area} · {entry.type}</span><div className="bar-track"><i className={entry.change < 0 ? 'trend-negative' : ''} style={{ width: `${(Math.abs(entry.change) / maxAreaTypeChange) * 100}%` }} /></div><strong className={entry.change < 0 ? 'sales-down' : 'sales-up'}>{entry.change > 0 ? '+' : ''}{entry.change.toFixed(1)}%</strong></div>)}</div>}</section>
            </div>
            <div className="analytics-graphs">
              <section className="analytics-graph"><p className="eyebrow">Sales frequency by type</p><h3>Which product type sells most</h3><div className="bar-chart">{typeSales.map((type) => <div className="bar-row" key={type.name}><span>{type.name}</span><div className="bar-track"><i style={{ width: `${(type.sales / maxTypeSales) * 100}%` }} /></div><strong>{type.sales}</strong></div>)}</div></section>
              <section className="analytics-graph"><p className="eyebrow">Area share by product</p><h3>Where a product sells</h3><div className="analytics-filters"><select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}><option value="all">All products</option>{salesByProduct.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select><input value={areaSearch} onChange={(event) => setAreaSearch(event.target.value)} placeholder="Search area" aria-label="Search area" /></div>{selectedProductId === 'all' ? <p className="analytics-note">Select a product to compare its area sales percentage.</p> : <div className="bar-chart">{selectedAreaSales.map((area) => <div className="bar-row" key={area.name}><span>{area.name}</span><div className="bar-track"><i style={{ width: `${(area.productSales / maxAreaSales) * 100}%` }} /></div><strong>{selectedProductTotal ? `${((area.productSales / selectedProductTotal) * 100).toFixed(1)}%` : '0%'}</strong></div>)}</div>}</section>
            </div>
            {selectedProductId !== 'all' && <section className="return-report"><p className="eyebrow">Returns by area</p><h3>{selectedProduct?.name}</h3><div className="return-list">{selectedAreaSales.map((area) => <div key={area.name}><strong>{area.name}</strong><span>{area.productReturns ? `${area.productReturns} returned` : 'Not returned'}</span><small>{area.productReturns ? `Cause: ${Object.entries(area.returnCauses).map(([cause, count]) => `${cause} (${count})`).join(', ')}` : 'Cause: —'}</small></div>)}</div></section>}
            <div className="sales-area-section">
              <div><p className="eyebrow">Sales map</p><h3>Where this month&apos;s orders are coming from</h3><p>Point at a marker to see the exact units sold in that area.</p></div>
              <MapContainer className="sales-map" center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {areaMarkers.map((area) => <CircleMarker key={`${area.name}-${area.coordinates.join('-')}`} center={area.coordinates} radius={Math.max(8, Math.min(22, area.sales + 7))} pathOptions={{ color: '#e26d4e', fillColor: '#e26d4e', fillOpacity: 0.8 }}>
                  <Popup><strong>{area.name}</strong><br />{area.sales} units sold this month<ul>{Object.values(area.products).map((product) => <li key={product.name}>{product.name}: {product.sales}</li>)}</ul></Popup>
                </CircleMarker>)}
              </MapContainer>
              {areaMarkers.length === 0 && <p className="map-empty-state">Complete an order with a map location to see sales areas here.</p>}
            </div>
            <button className="full-analytics-button" onClick={() => setActiveView('sales-analytics')}>View full sales analytics <span>→</span></button>
          </div>}

          {activeView === 'sales-analytics' && <div className="sales-analytics-page">
            <button className="analytics-back-button" onClick={() => setActiveView('review-inventory')}>← Review inventory</button>
            <p className="eyebrow">Daily performance</p><h2>Sales analytics</h2>
            <p className="inventory-intro">Live sales compared with the previous day, week, and month.</p>
            <div className="sales-analysis-filters"><label>Product type<select value={analyticsType} onChange={(event) => setAnalyticsType(event.target.value)}><option value="all">All product types</option>{analyticsTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Area<select value={analyticsArea} onChange={(event) => setAnalyticsArea(event.target.value)}><option value="all">All areas</option>{analyticsAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label><button className="analytics-reset-button" type="button" onClick={resetAnalyticsFilters}>Show all percentages</button></div>
              <div className="sales-period-grid">{salesPeriods.map((period) => { const change = percentageChange(period.current, period.previous); return <article key={period.name}><span>{period.name}</span><strong>{formatCurrency(period.current, currency)}</strong><small className={change >= 0 ? 'sales-up' : 'sales-down'}>{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% {period.comparison}</small></article> })}</div>
            <div className="sales-chart-grid">
              <section className="sales-chart-panel sales-line-panel"><p className="eyebrow">Daily sales</p><h3>Last 14 days</h3><div className="line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Line chart of sales for the last 14 days"><polyline points={linePoints} fill="none" stroke="#e26d4e" strokeWidth="2" vectorEffect="non-scaling-stroke" />{dailySales.map((day, index) => <circle key={day.label} cx={(index / (dailySales.length - 1)) * 100} cy={100 - (day.value / maxDailySales) * 88} r="1.8" fill="#17201c"><title>{day.label}: {formatCurrency(day.value, currency)}</title></circle>)}</svg></div><div className="chart-axis-labels"><span>{dailySales[0].label}</span><span>{dailySales[dailySales.length - 1].label}</span></div></section>
              <section className="sales-chart-panel"><p className="eyebrow">Period comparison</p><h3>Sales change</h3><div className="comparison-bars">{salesPeriods.map((period) => { const change = percentageChange(period.current, period.previous); return <div className="comparison-bar" key={period.name}><span>{period.name}</span><div><i className={change < 0 ? 'trend-negative' : ''} style={{ width: `${Math.min(100, Math.abs(change))}%` }} /></div><strong className={change >= 0 ? 'sales-up' : 'sales-down'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</strong></div> })}</div></section>
              <section className="sales-chart-panel sales-pie-panel"><p className="eyebrow">Sales mix</p><h3>{pieTitle}</h3>{pieStops.length === 0 ? <p className="analytics-note">No sales match the selected filters.</p> : <div className="pie-layout"><div className="sales-pie" style={{ background: `conic-gradient(${pieStops.map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`).join(', ')})` }} /><div className="pie-legend">{pieStops.map((stop) => <div key={stop.name}><i style={{ background: stop.color }} /><span>{stop.name}</span><strong>{pieSalesTotal ? `${((stop.sales / pieSalesTotal) * 100).toFixed(1)}%` : '0%'}</strong></div>)}</div></div>}</section>
              <section className="sales-chart-panel"><p className="eyebrow">Quantity sold</p><h3>Units sold by product type</h3>{typeQuantitySales.length === 0 ? <p className="analytics-note">No product quantities match the selected filters.</p> : <div className="line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Line chart showing product quantity sold by type"><polyline points={quantityLinePoints} fill="none" stroke="#586b31" strokeWidth="2" vectorEffect="non-scaling-stroke" />{typeQuantitySales.map((type, index) => { const x = typeQuantitySales.length === 1 ? 50 : (index / (typeQuantitySales.length - 1)) * 100; const y = 100 - (type.quantity / maxTypeQuantity) * 88; return <circle key={type.name} cx={x} cy={y} r="1.8" fill="#17201c"><title>{type.name}: {type.quantity} units sold</title></circle> })}</svg></div>}<div className="chart-axis-labels">{typeQuantitySales.map((type, index) => <span key={`${type.name}-${index}`}>{type.name}</span>)}</div></section>
              <section className="sales-chart-panel"><p className="eyebrow">Profit overview</p><h3>Profit by product</h3>{productProfitData.length === 0 ? <p className="analytics-note">Add product cost and selling prices to see profit analytics.</p> : <div className="line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Area chart of product profit"><defs><linearGradient id="profitAreaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2c7a66" stopOpacity="0.55" /><stop offset="100%" stopColor="#2c7a66" stopOpacity="0.08" /></linearGradient></defs><path d={profitAreaPath} fill="url(#profitAreaFill)" /><polyline points={profitAreaPoints} fill="none" stroke="#2c7a66" strokeWidth="2" vectorEffect="non-scaling-stroke" />{productProfitData.map((product, index) => { const x = productProfitData.length === 1 ? 50 : (index / (productProfitData.length - 1)) * 100; const y = productProfitData.length === 1 ? 50 : 100 - ((product.profit - profitMin) / profitRange) * 80; return <circle key={product.name} cx={x} cy={y} r="1.8" fill="#2c7a66"><title>{product.name}: profit {formatCurrency(product.profit, currency)}</title></circle> })}</svg></div>}<div className="chart-axis-labels">{productProfitData.map((product, index) => <span key={`${product.name}-${index}`}>{product.name}</span>)}</div></section>
              <section className="sales-chart-panel sales-rating-panel"><p className="eyebrow">Customer ratings</p><h3>Rating by product type</h3><div className="rating-chart">{ratingByType.map((type) => <div className="rating-row" key={type.name}><span>{type.name}</span><div className="rating-track"><i style={{ width: `${(type.rating / 5) * 100}%` }} /></div><strong>{type.count ? `${type.rating.toFixed(1)} / 5` : '—'}</strong><small>{type.count} reviews</small></div>)}</div></section>
            </div>
          </div>}

          {activeView === 'settings' && <div className="workspace-content">
            <p className="eyebrow">Preferences</p><h2>Store settings</h2>
            <form className="owner-form" onSubmit={(event) => { event.preventDefault(); setStoreSettings(saveStoreSettings(storeSettings)); setSavedSettings(true) }}><label>Store name<input value={storeName} onChange={(event) => setStoreSettings((current) => ({ ...current, storeName: event.target.value }))} required /></label><label>Support email<input type="email" value={supportEmail} onChange={(event) => setStoreSettings((current) => ({ ...current, supportEmail: event.target.value }))} required /></label><label>Currency<select value={currency} onChange={(event) => setStoreSettings((current) => ({ ...current, currency: event.target.value }))}><option value="USD">USD — US Dollar</option><option value="INR">INR — Indian Rupee</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option></select></label><button className="workspace-primary" type="submit">Save settings</button>{savedSettings && <p className="settings-saved">Settings saved.</p>}</form>
          </div>}
        </section>}
      </main>
    </div>
  )
}
