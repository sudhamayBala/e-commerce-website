import { useEffect, useState } from 'react'
import { createProduct } from '../../api/product/createProduct'
import { getProduct } from '../../api/product/getProduct'
import { getProducts } from '../../api/product/getProducts'
import { updateProduct } from '../../api/product/updateProduct'

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  stock_quantity: '',
  image_url: '',
  category_id: '',
}

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  price: Number(form.price),
  stock_quantity: Number(form.stock_quantity),
  image_url: form.image_url.trim() || null,
  category_id: Number(form.category_id),
})

export default function ProductManager() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadProducts = async () => {
    try {
      setLoading(true)
      setProducts(await getProducts())
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => loadProducts())
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > 7 * 1024 * 1024) {
      setError('Image must be smaller than 7 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, image_url: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      await createProduct(toPayload(form))
      setForm(emptyProduct)
      setMessage('Product created successfully.')
      setError('')
      await loadProducts()
    } catch (createError) {
      setError(createError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadForEdit = async () => {
    if (!selectedProductId) {
      setError('Enter a product ID first.')
      return
    }

    try {
      setLoading(true)
      const product = await getProduct(selectedProductId)
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        stock_quantity: product.stock_quantity ?? '',
        image_url: product.image_url || '',
        category_id: product.category_id ?? '',
      })
      setError('')
      setMessage(`Product #${selectedProductId} loaded for editing.`)
    } catch (loadError) {
      setError(loadError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!selectedProductId) {
      setError('Select a product ID before updating.')
      return
    }

    try {
      setLoading(true)
      await updateProduct(selectedProductId, toPayload(form))
      setMessage('Product updated successfully.')
      setError('')
      await loadProducts()
    } catch (updateError) {
      setError(updateError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Product Manager</h1>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
        <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} placeholder="Price" required />
        <input name="stock_quantity" type="number" min="1" value={form.stock_quantity} onChange={handleChange} placeholder="Stock quantity" required />
        <input name="image_url" type="url" value={form.image_url.startsWith('data:') ? '' : form.image_url} onChange={handleChange} placeholder="Image URL (optional)" />
        <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
        {form.image_url && <img src={form.image_url} alt="Product preview" style={{ maxWidth: 260, maxHeight: 180, objectFit: 'contain' }} />}
        <input name="category_id" type="number" min="1" value={form.category_id} onChange={handleChange} placeholder="Category ID" required />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading}>Create product</button>
          <button type="button" onClick={handleUpdate} disabled={loading}>Update product</button>
        </div>
      </form>

      <section style={{ marginTop: 24 }}>
        <label>
          Product ID for lookup/update:{' '}
          <input type="number" min="1" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} />
        </label>
        <button type="button" onClick={handleLoadForEdit} disabled={loading} style={{ marginLeft: 8 }}>
          Get product
        </button>
      </section>

      <h2>Products</h2>
      {loading && <p>Loading...</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <button type="button" onClick={() => setSelectedProductId(product.id)}>
              #{product.id} {product.name} - {product.price} - stock: {product.stock_quantity}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
