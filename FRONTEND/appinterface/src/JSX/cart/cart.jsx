import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import '../../css/RegisterLogin/Home.css'
import 'leaflet/dist/leaflet.css'
import { formatCurrency, getStoreSettings } from '../data/storeSettings'

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async ({ latlng }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`)
        const data = await response.json()
        const address = data.address || {}
        const city = address.city || address.town || address.village || address.state || ''
        onLocationSelect({
          address: data.display_name || `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
          city,
          coordinates: [latlng.lat, latlng.lng],
        })
      } catch (error) {
        console.error('Address lookup failed:', error)
        onLocationSelect({
          address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
          city: '',
          coordinates: [latlng.lat, latlng.lng],
        })
      }
    },
  })

  return null
}

function MapViewport({ location }) {
  const map = useMap()

  useEffect(() => {
    if (location) {
      map.flyTo(location, 15, { duration: 1 })
    }
  }, [location, map])

  return null
}

export default function Cart({ cart, setCart, products, setProducts, setOrders }) {
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    address: '',
    city: '',
    payment: 'card',
  })
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [storeSettings, setStoreSettings] = useState(getStoreSettings)
  const { storeName, currency } = storeSettings
  const cartItems = products.filter((product) => cart[product.id])
  const subtotal = cartItems.reduce((total, product) => total + product.price * cart[product.id], 0)
  const delivery = subtotal === 0 || subtotal >= 75 ? 0 : 8
  const total = subtotal + delivery
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const mapQuery = [checkoutData.address, checkoutData.city].filter(Boolean).join(', ') || 'India'
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  useEffect(() => {
    const updateStoreSettings = () => setStoreSettings(getStoreSettings())
    window.addEventListener('store-settings-changed', updateStoreSettings)
    return () => window.removeEventListener('store-settings-changed', updateStoreSettings)
  }, [])

  useEffect(() => {
    const addressQuery = [checkoutData.address, checkoutData.city].filter(Boolean).join(', ').trim()
    if (addressQuery.length < 3) return undefined

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(addressQuery)}`, {
          signal: controller.signal,
        })
        const results = await response.json()
        const result = results[0]

        if (result) {
          setSelectedLocation([Number(result.lat), Number(result.lon)])
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Address search failed:', error)
        }
      }
    }, 700)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [checkoutData.address, checkoutData.city])

  const handleLocationSelect = ({ address, city, coordinates }) => {
    setSelectedLocation(coordinates)
    setCheckoutData((current) => ({ ...current, address, city }))
  }

  const updateQuantity = (productId, change) => {
    setCart((currentCart) => {
      const nextCart = { ...currentCart }
      const nextQuantity = (nextCart[productId] || 0) + change

      if (nextQuantity <= 0) {
        delete nextCart[productId]
      } else {
        nextCart[productId] = nextQuantity
      }

      return nextCart
    })
  }

  const handleCheckoutChange = (event) => {
    const { name, value } = event.target
    setCheckoutData((current) => ({ ...current, [name]: value }))
  }

  const placeOrder = (event) => {
    event.preventDefault()
    setOrders((currentOrders) => [...currentOrders, {
      id: `SN-${Date.now().toString().slice(-4)}`,
      customer: checkoutData.name,
      items: itemCount,
      total,
      status: 'Preparing',
      createdAt: new Date().toISOString(),
      location: {
        address: checkoutData.address,
        city: checkoutData.city,
        coordinates: selectedLocation,
      },
      products: cartItems.map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: cart[product.id],
        returnStatus: 'Not returned',
        returnReason: '',
      })),
    }])
    setProducts((currentProducts) => currentProducts
      .map((product) => ({
        ...product,
        stock: Math.max(0, (product.stock || 0) - (cart[product.id] || 0)),
      }))
    )
    setOrderPlaced(true)
    setCart({})
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <button className="back-button" onClick={() => navigate('/home')}>← Continue shopping</button>
        <a className="brand" href="/home">{storeName}<span>.</span></a>
        <span className="cart-header-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </header>

      <main className="cart-content">
        <div className="cart-heading">
          <p className="eyebrow">Your selections</p>
          <h1>Your shopping bag</h1>
        </div>

        {cartItems.length === 0 ? (
          <section className="empty-cart">
            <div className="empty-cart-icon">🛍</div>
            <h2>Your bag is waiting</h2>
            <p>Add something you love and it will appear here.</p>
            <button className="primary-btn" onClick={() => navigate('/home')}>Explore products</button>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Products in your bag">
              {cartItems.map((product) => (
                <article className="cart-item" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div className="cart-item-info">
                    <p className="cart-item-category">{product.category}</p>
                    <h2>{product.name}</h2>
                    <p className="cart-item-price">{formatCurrency(product.price, currency)}</p>
                  </div>
                  <div className="cart-item-actions">
                    <div className="qty-stepper">
                      <button aria-label={`Decrease ${product.name}`} onClick={() => updateQuantity(product.id, -1)}>-</button>
                      <span>{cart[product.id]}</span>
                      <button aria-label={`Increase ${product.name}`} onClick={() => updateQuantity(product.id, 1)}>+</button>
                    </div>
                    <strong>{formatCurrency(product.price * cart[product.id], currency)}</strong>
                  </div>
                </article>
              ))}
            </section>

            <aside className="order-summary">
              <p className="eyebrow">Order summary</p>
              <h2>Ready when you are.</h2>
              <div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal, currency)}</strong></div>
              <div className="summary-line"><span>Delivery</span><strong>{delivery === 0 ? 'Free' : formatCurrency(delivery, currency)}</strong></div>
              <div className="summary-total"><span>Total</span><strong>{formatCurrency(total, currency)}</strong></div>
              <button className="checkout-button" onClick={() => setShowCheckout(true)}>Buy now <span>→</span></button>
              <p className="shipping-note">Free delivery applied to orders over {formatCurrency(75, currency)}.</p>
            </aside>
          </div>
        )}

        {showCheckout && !orderPlaced && (
          <section className="checkout-panel" aria-label="Checkout form">
            <div className="checkout-panel-heading">
              <div>
                <p className="eyebrow">Secure checkout</p>
                <h2>Where should we send it?</h2>
              </div>
              <button className="close-checkout" type="button" onClick={() => setShowCheckout(false)} aria-label="Close checkout">×</button>
            </div>
            <form className="checkout-form" onSubmit={placeOrder}>
              <label>Full name<input name="name" value={checkoutData.name} onChange={handleCheckoutChange} required /></label>
              <label>Delivery address<input name="address" value={checkoutData.address} onChange={handleCheckoutChange} required /></label>
              <label>City<input name="city" value={checkoutData.city} onChange={handleCheckoutChange} required /></label>
              <label>Payment method<select name="payment" value={checkoutData.payment} onChange={handleCheckoutChange}><option value="card">Credit or debit card</option><option value="cash">Cash on delivery</option></select></label>
              <div className="delivery-map">
                <div className="delivery-map-heading">
                  <div><h3>Click the map to select delivery location</h3><p>{selectedLocation ? `${mapQuery} (location selected)` : 'Click any point on the map to detect the address automatically.'}</p></div>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">Open map ↗</a>
                </div>
                <MapContainer className="interactive-map" center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapViewport location={selectedLocation} />
                  <MapClickHandler onLocationSelect={handleLocationSelect} />
                  {selectedLocation && <CircleMarker center={selectedLocation} radius={9} pathOptions={{ color: '#e65100', fillColor: '#e65100', fillOpacity: 0.85 }} />}
                </MapContainer>
              </div>
              <button className="place-order-button" type="submit">Place order · {formatCurrency(total, currency)}</button>
            </form>
          </section>
        )}

        {orderPlaced && (
          <section className="order-success">
            <span className="success-mark">✓</span>
            <p className="eyebrow">Order confirmed</p>
            <h2>Thank you for your purchase.</h2>
            <p>Your order is on its way to being prepared.</p>
            <button className="primary-btn" onClick={() => navigate('/home')}>Continue shopping</button>
          </section>
        )}
      </main>
    </div>
  )
}
