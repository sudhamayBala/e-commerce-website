import axios from 'axios'
import { API_BASE_URL } from '../../api.jsx'

const PRODUCT_URL = `${API_BASE_URL}/product`
const CATEGORY_URL = `${API_BASE_URL}/category`

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.detail || error?.response?.data?.message || fallback
)

const throwApiError = (error, fallback) => {
  throw new Error(getErrorMessage(error, fallback), { cause: error })
}

export const normalizeProduct = (product) => ({
  ...product,
  id: product.id ?? product.product_id,
  category: product.category || (product.category_id ? `Category ${product.category_id}` : 'Uncategorized'),
  stock: product.stock ?? product.stock_quantity ?? 0,
  image: product.image || product.image_url || '',
  oldPrice: product.oldPrice ?? product.price,
  tag: product.tag || 'New arrival',
  reviews: Array.isArray(product.reviews) ? product.reviews : [],
})

export async function createProduct(payload) {
  try {
    const response = await axios.post(`${PRODUCT_URL}/create`, payload)
    return normalizeProduct(response.data)
  } catch (error) {
    throwApiError(error, 'Failed to create product.')
  }
}

export async function fetchProducts() {
  try {
    const response = await axios.get(`${PRODUCT_URL}/Gate/Products`)
    return Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
  } catch (error) {
    throwApiError(error, 'Failed to load products.')
  }
}

export async function fetchProductById(productId) {
  try {
    const response = await axios.get(`${PRODUCT_URL}/Get/Product/${productId}`)
    return normalizeProduct(response.data)
  } catch (error) {
    throwApiError(error, 'Failed to load product.')
  }
}

export async function updateProduct(productId, payload) {
  try {
    const response = await axios.put(`${PRODUCT_URL}/update/${productId}`, payload)
    return normalizeProduct(response.data)
  } catch (error) {
    throwApiError(error, 'Failed to update product.')
  }
}

export async function fetchCategories() {
  try {
    const response = await axios.get(`${CATEGORY_URL}/Gate/Categories`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    throwApiError(error, 'Failed to load categories.')
  }
}

export async function createCategory(payload) {
  try {
    const response = await axios.post(`${CATEGORY_URL}/create`, payload)
    return response.data
  } catch (error) {
    throwApiError(error, 'Failed to create category.')
  }
}
