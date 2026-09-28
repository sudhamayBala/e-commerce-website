import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "../../css/RegisterLogin/Home.css";
import { categories } from '../../sharedData/products'
import photo from './image/ChatGPT Image Sep 13, 2026, 11_20_06 AM.png'
import { API_BASE_URL } from '../../api'
import { formatCurrency, getStoreSettings } from '../../sharedData/storeSettings'
import { createReview } from '../../api/review/createReview'
import { getReviews } from '../../api/review/getReviews'

const normalizeOrderStatus = (status) => {
  const value = String(status || '').toLowerCase()
  if (['pending', 'processing'].includes(value)) return 'Preparing'
  if (value === 'delivered') return 'Delivered'
  if (value === 'cancelled') return 'Cancelled'
  if (value === 'preparing') return 'Preparing'
  return 'Preparing'
}

const fetchOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`)
  if (!response.ok) {
    throw new Error('Failed to load orders')
  }
  return response.json()
}

export default function Home({ cart, setCart, productsList, setProductsList, orders, setOrders, setProducts }) {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All products')
  const [search, setSearch] = useState('')
  const [reviewInputs, setReviewInputs] = useState({}) 
  const [activeReviewTab, setActiveReviewTab] = useState(null)
  const [activeOrderReview, setActiveOrderReview] = useState(null)
  const [cancelReasons, setCancelReasons] = useState({})
  const [storeSettings, setStoreSettings] = useState(getStoreSettings)
  const { storeName, supportEmail, currency } = storeSettings

  
  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const customerCount = new Set(orders.map((order) => order.customer).filter(Boolean)).size
  const reviews = productsList.flatMap((product) => product.reviews || [])
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : '—'
  const browseCategories = [...new Set([...categories, ...productsList.map((product) => product.category).filter(Boolean)])]

  useEffect(() => {
    const updateStoreSettings = () => setStoreSettings(getStoreSettings())
    window.addEventListener('store-settings-changed', updateStoreSettings)
    return () => window.removeEventListener('store-settings-changed', updateStoreSettings)
  }, [])

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const savedReviews = await getReviews()
        setProductsList((currentProducts) => currentProducts.map((product) => ({
          ...product,
          reviews: savedReviews
            .filter((review) => Number(review.product_id) === Number(product.id))
            .map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              date: review.date,
            })),
        })))
      } catch (error) {
        console.error('Failed to load reviews:', error)
      }
    }

    const loadOrders = async () => {
      try {
        const savedOrders = await fetchOrders()
        setOrders(Array.isArray(savedOrders) ? savedOrders : [])
      } catch (error) {
        console.error('Failed to load orders:', error)
      }
    }

    loadReviews()
    loadOrders()
  }, [setOrders, setProductsList])

  const visibleProducts = productsList.filter((product) => {
    const matchesCategory = activeCategory === 'All products' || product.category === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  
  const addToCart = (productId) => {
    setCart((prev) => {
      const product = productsList.find((item) => Number(item.id) === Number(productId))
      const safeCart = prev ?? {}
      const currentQuantity = safeCart[productId] || 0
      const stockLimit = Number.isFinite(product?.stock) ? Number(product.stock) : null

      if (!product) return safeCart
      if (stockLimit !== null && stockLimit > 0 && currentQuantity >= stockLimit) return safeCart

      return { ...safeCart, [productId]: currentQuantity + 1 }
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const updated = { ...prev }
      if (updated[productId] > 1) {
        updated[productId] -= 1
      } else {
        delete updated[productId]
      }
      return updated
    })
  }

  
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
    }
  }

  
  const handleReviewSubmit = async (productId, e) => {
    e.preventDefault()
    const input = reviewInputs[productId] || { rating: 5, comment: '' }
    if (!input.comment.trim()) return

    const newReview = {
      product_id: productId,
      user_id: Number(JSON.parse(localStorage.getItem('user') || '{}').id),
      rating: Number(input.rating),
      comment: input.comment,
    }

    if (!newReview.user_id) return

    try {
      const savedReview = await createReview(newReview)

      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, reviews: [...(p.reviews || []), savedReview] } : p))
      )
      
      
      setReviewInputs((prev) => ({
        ...prev,
        [productId]: { rating: 5, comment: '' }
      }))
    } catch (err) {
      console.error('Failed to post review to backend:', err)
    }
  }

  const updateReviewInput = (productId, field, value) => {
    setReviewInputs((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { rating: 5, comment: '' }),
        [field]: value
      }
    }))
  }

  const restoreOrderStock = (order) => {
    if (order.inventoryRestored) return
    setProducts((currentProducts) => currentProducts.map((product) => {
      const item = order.products?.find((orderItem) => orderItem.productId === product.id)
      return item ? { ...product, stock: (product.stock || 0) + item.quantity } : product
    }))
  }

  const updateCancelReason = (orderId, reason) => {
    setCancelReasons((currentReasons) => ({ ...currentReasons, [orderId]: reason }))
  }

  const cancelOrder = async (order) => {
    const reason = cancelReasons[order.id]?.trim() || 'Customer cancelled order'
    const rawId = Number(String(order.id).replace(/[^\d]/g, '')) || Number(order.id)
    if (!rawId || !reason) return

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${rawId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }

      restoreOrderStock(order)
      setOrders((currentOrders) => currentOrders.map((currentOrder) => currentOrder.id === order.id
        ? { ...currentOrder, status: 'Cancelled', cancelReason: reason, inventoryRestored: true, rawStatus: 'cancelled' }
        : currentOrder))
      setCancelReasons((currentReasons) => ({ ...currentReasons, [order.id]: '' }))
    } catch (error) {
      console.error('Cancel order failed:', error)
    }
  }

  const returnProduct = (order, productId) => {
    const reason = window.prompt('Why are you returning this product?')?.trim()
    if (!reason) return
    const item = order.products?.find((orderItem) => orderItem.productId === productId)
    if (!item || item.returnStatus === 'Returned') return
    setProducts((currentProducts) => currentProducts.map((product) => product.id === productId
      ? { ...product, stock: (product.stock || 0) + item.quantity }
      : product))
    setOrders((currentOrders) => currentOrders.map((currentOrder) => currentOrder.id === order.id
      ? { ...currentOrder, products: (currentOrder.products || []).map((orderItem) => orderItem.productId === productId ? { ...orderItem, returnStatus: 'Returned', returnQuantity: orderItem.quantity, returnReason: reason } : orderItem) }
      : currentOrder))
  }

  return (
    <div className="home-shell">
      <div className="announcement">Free delivery on orders over {formatCurrency(75, currency)} <span>•</span> Easy 30-day returns</div>
      
      <header className="topbar">
        <a className="brand" href="#top">{storeName}<span>.</span></a>

        <nav className="nav-links">
          <a href="#top">Home</a>
          <a href="#deals">Deals</a>
          <a href="#products">Shop</a>
          <a href="#benefits">Why us</a>
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" aria-label="Open search" onClick={() => document.getElementById('product-search')?.focus()}>⌕</button>
          <button className="cart-btn" onClick={() => navigate('/cart')}>
            Bag <span className="cart-badge">{totalCartCount}</span>
          </button>
          <a className="my-orders-btn" href="#my-orders">My orders</a>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main id="top" className="content-area">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="hero-badge">The new everyday edit</span>
            <h1>Good things, made for <em>living.</em></h1>
            <p>Thoughtful finds for your home, your wardrobe, and everywhere in between. Curated quality without the noise.</p>

            <div className="cta-row">
              <a className="primary-btn" href="#products">Shop the collection <span>↗</span></a>
              <a className="secondary-btn" href="#deals">See today's deals</a>
            </div>

            <div className="stats-row">
              <div>
                <strong>{customerCount}</strong>
                <span>happy customers</span>
              </div>
              <div>
                <strong>{averageRating}/5</strong>
                <span>average rating</span>
              </div>
              <div>
                <strong>30 day</strong>
                <span>easy returns</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrap">
            <img src={photo} alt={`${storeName} accessories arranged on a table`} />
              <div className="hero-note"><span></span><strong>You are Welcome from<br />Sudhamay Bala</strong></div>
            </div>
          </div>
        </section>

        <section className="category-section" aria-label="Product categories">
          <p className="eyebrow">Browse by mood</p>
          <div className="category-list">
            {browseCategories.map((category) => (
              <button 
                key={category} 
                className={activeCategory === category ? 'category-pill active' : 'category-pill'} 
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section id="deals" className="deal-banner">
          <div><span className="deal-kicker">Limited time</span><h2>Little upgrades.<br /><em>Big difference.</em></h2></div>
          <p>Save up to 30% on pieces that make every day feel a little more considered.</p>
          <a href="#products">Shop the edit <span>→</span></a>
        </section>

        <section id="products" className="products-section">
          <div className="section-heading">
            <div><p className="eyebrow">Picked for you</p><h2>Shop the edit</h2></div>
            <label className="search-box" htmlFor="product-search">
              <span>⌕</span>
              <input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
            </label>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => {
              const qtyInCart = cart[product.id] || 0
              const isReviewOpen = activeReviewTab === product.id

              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrap">
                    <img
                      src={product.image || '/product-placeholder.svg'}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/product-placeholder.svg'
                      }}
                    />
                    <span className="badge">{product.tag}</span>
                    <button className="heart-btn" aria-label={`Save ${product.name}`}>♡</button>
                  </div>
                  <h3>{product.name}</h3>
                  <div className="product-meta">
                    <span><strong>{formatCurrency(product.price, currency)}</strong><del>{formatCurrency(product.oldPrice, currency)}</del></span>
                    
                    <div className="cart-control">
                      {qtyInCart > 0 ? (
                        <div className="qty-stepper">
                          <button onClick={() => removeFromCart(product.id)}>-</button>
                          <span>{qtyInCart}</span>
                          <button onClick={() => addToCart(product.id)}>+</button>
                        </div>
                      ) : (
                        <button className="add-btn" onClick={() => addToCart(product.id)}>Add <span>+</span></button>
                      )}
                    </div>
                  </div>

                  <div className="review-toggle-row">
                    <button 
                      className="review-toggle-btn"
                      onClick={() => setActiveReviewTab(isReviewOpen ? null : product.id)}
                    >
                      Reviews ({product.reviews.length}) {isReviewOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  {isReviewOpen && (
                    <div className="review-drawer">
                      <h4>Customer Reviews</h4>
                      {product.reviews.length === 0 ? (
                        <p className="no-reviews">No reviews yet. Be the first!</p>
                      ) : (
                        <div className="reviews-list">
                          {product.reviews.map((rev, idx) => (
                            <div key={idx} className="review-item">
                              <span className="stars">{'★'.repeat(rev.rating)}</span>
                              <p>{rev.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {visibleProducts.length === 0 && <p className="empty-state">No products match your search yet.</p>}
        </section>

        <section id="my-orders" className="my-orders-section">
          <div className="section-heading"><div><p className="eyebrow">Your purchases</p><h2>My orders</h2></div><span className="orders-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
          {orders.length === 0 ? <p className="empty-state">Your orders will appear here after checkout.</p> : <div className="order-sections">
            {[['Preparing', 'New order'], ['Delivered', 'Delivered'], ['Cancelled', 'Canceled']].map(([status, title]) => {
              const sectionOrders = [...orders].reverse().filter((order) => normalizeOrderStatus(order.status || order.rawStatus) === status)

              return (
                <section className="order-status-section" key={status}>
                  <div className="order-section-heading"><h3>{title}</h3><span>{sectionOrders.length}</span></div>
                  {sectionOrders.length === 0 ? <p className="order-section-empty">No {title.toLowerCase()}s.</p> : <div className="my-orders-list">{sectionOrders.map((order) => {
                    const currentStatus = normalizeOrderStatus(order.status || order.rawStatus)
                    return <article className="my-order-card" key={order.id}>
                    <div className="my-order-header"><div><strong>#{order.id}</strong><small>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent order'}</small></div><b className={`order-status status-${currentStatus.toLowerCase()}`}>{currentStatus}</b></div>
                    <div className="my-order-items">{(order.products || []).map((item) => {
                      const reviewKey = `${order.id}-${item.productId}`
                      const isReviewOpen = activeOrderReview === reviewKey

                      return <div key={item.productId} className="my-order-item"><div><span>{item.name} × {item.quantity}</span>{item.returnStatus === 'Returned' && <small className="return-recorded">Returned: {item.returnReason}</small>}</div><div className="order-item-actions">{currentStatus === 'Delivered' && item.returnStatus !== 'Returned' && <button className="return-button" onClick={() => returnProduct(order, item.productId)}>Return product</button>}{(currentStatus === 'Delivered' || currentStatus === 'Cancelled') && <button className="review-order-button" onClick={() => setActiveOrderReview(isReviewOpen ? null : reviewKey)}>{isReviewOpen ? 'Close review' : 'Give review'}</button>}</div>{isReviewOpen && <form className="review-form order-review-form" onSubmit={(event) => { handleReviewSubmit(item.productId, event); setActiveOrderReview(null) }}><select value={reviewInputs[item.productId]?.rating || 5} onChange={(event) => updateReviewInput(item.productId, 'rating', event.target.value)}><option value="5">5 ★★★★★</option><option value="4">4 ★★★★☆</option><option value="3">3 ★★★☆☆</option><option value="2">2 ★★☆☆☆</option><option value="1">1 ★☆☆☆☆</option></select><input type="text" placeholder="Write a review..." value={reviewInputs[item.productId]?.comment || ''} onChange={(event) => updateReviewInput(item.productId, 'comment', event.target.value)} /><button type="submit">Submit</button></form>}</div>
                    })}</div>
                    <div className="my-order-footer"><strong>{formatCurrency(order.total ?? order.amount ?? 0, currency)}</strong>{currentStatus === 'Preparing' && <div className="cancel-order-actions"><input value={cancelReasons[order.id] || ''} onChange={(event) => updateCancelReason(order.id, event.target.value)} placeholder="Cancellation reason" aria-label={`Cancellation reason for order ${order.id}`} /><button className="cancel-order-button" onClick={() => cancelOrder(order)}>Cancel order</button></div>}{currentStatus === 'Cancelled' && <span className="order-note">Cancelled: {order.cancelReason || 'Reason not provided'}</span>}</div>
                  </article>
                  })}</div>}
                </section>
              )
            })}
          </div>}
        </section>

        <section id="benefits" className="benefits-section">
          <div className="benefit"><span className="benefit-icon">✦</span><div><h3>Quality, always</h3><p>Small-batch pieces from makers we trust.</p></div></div>
          <div className="benefit"><span className="benefit-icon">↝</span><div><h3>Simple shipping</h3><p>Free delivery from {formatCurrency(75, currency)}, right to your door.</p></div></div>
          <div className="benefit"><span className="benefit-icon">↺</span><div><h3>Try it at home</h3><p>30 days to decide if it belongs with you.</p></div></div>
        </section>
      </main>

      <footer className="site-footer">
        <div><a className="brand" href="#top">{storeName}<span>.</span></a><p>Thoughtful goods for everyday living.</p></div>
        <div className="footer-links"><a href="#products">Shop</a><a href="#deals">Deals</a><a href="#benefits">Shipping</a><a href={`mailto:${supportEmail}`}>Contact</a></div>
        <div className="footer-contact"><span>Need help?</span><a href="tel:6290759219">6290759219</a></div>
        <p className="copyright">© 2026 {storeName}</p>
      </footer>
    </div>
  )
}