import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

const fallbackImageForProduct = (product) => {
  const searchableName = `${product.name || ''} ${product.category || ''}`.toLowerCase()
  if (searchableName.includes('clock') || searchableName.includes('watch')) {
    const watchImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=85',
    ]
    return watchImages[Number(product.id || 0) % watchImages.length]
  }
  if (searchableName.includes('chair') || searchableName.includes('furniture')) {
    const furnitureImages = [
      'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=85',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=700&q=85',
    ]
    return furnitureImages[Number(product.id || 0) % furnitureImages.length]
  }
  const catalogImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=85',
    'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=700&q=85',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=85',
  ]
  return catalogImages[Number(product.id || 0) % catalogImages.length]
}

const resolveProductImageUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value
  }
  return `${API_BASE_URL}/static/uploads/${value}`
}

export const normalizeProduct = (product) => ({
  ...product,
  id: product.id ?? product.product_id,
  category: product.category || (product.category_id ? `Category ${product.category_id}` : 'Uncategorized'),
  stock: product.stock ?? product.stock_quantity ?? 0,
  price: Number(product.selling_price ?? product.price ?? 0),
  selling_price: Number(product.selling_price ?? product.price ?? 0),
  cost_price: Number(product.cost_price ?? 0),
  image: resolveProductImageUrl(product.image || product.image_url) || fallbackImageForProduct(product),
  oldPrice: product.oldPrice ?? product.price,
  tag: product.tag || 'New arrival',
  reviews: Array.isArray(product.reviews) ? product.reviews : [],
})

export async function getProducts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/product/Gate/Products`)
    return Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
  } catch (error) {
    throwRequestError(error, 'Failed to load products.')
  }
}
