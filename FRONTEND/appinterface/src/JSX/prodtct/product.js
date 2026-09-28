import axios from 'axios'
import { API_BASE_URL } from '../../api'

const PRODUCT_URL = `${API_BASE_URL}/product`
const CATEGORY_URL = `${API_BASE_URL}/category`

const apiError = (error, fallback) => {
  throw new Error(
    error?.response?.data?.detail || error?.response?.data?.message || fallback,
    { cause: error },
  )
}

export const normalizeProduct = (product) => {
  
  let imagePath = product.image || product.image_url || ''
  if (!imagePath && product.image_filename) {
    imagePath = `${API_BASE_URL.replace('/api', '')}/static/uploads/${product.image_filename}`
  }

  return {
    ...product,
    id: product.id ?? product.product_id,
    stock: product.stock ?? product.stock_quantity ?? 0,
    image: imagePath,
    image_filename: product.image_filename || '',
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
  }
}

export async function createProduct(payload) {
  try {
    
    
    const response = await axios.post(`${PRODUCT_URL}/create`, payload, {
      headers: {
        
        
      },
    })
    return normalizeProduct(response.data)
  } catch (error) {
    apiError(error, 'Failed to create product.')
  }
}

export async function fetchProducts() {
  try {
    const response = await axios.get(`${PRODUCT_URL}/Gate/Products`)
    return Array.isArray(response.data) ? response.data.map(normalizeProduct) : []
  } catch (error) {
    apiError(error, 'Failed to load products.')
  }
}

export async function fetchProductById(productId) {
  try {
    const response = await axios.get(`${PRODUCT_URL}/Get/Product/${productId}`)
    return normalizeProduct(response.data)
  } catch (error) {
    apiError(error, 'Failed to load product.')
  }
}

export async function updateProduct(productId, payload) {
  try {
    
    const response = await axios.put(`${PRODUCT_URL}/update/${productId}`, payload)
    return normalizeProduct(response.data)
  } catch (error) {
    apiError(error, 'Failed to update product.')
  }
}

export async function fetchCategories() {
  try {
    const response = await axios.get(`${CATEGORY_URL}/Gate/Categories`)
    return response.data
  } catch (error) {
    apiError(error, 'Failed to load categories.')
  }
}

export async function createCategory(payload) {
  try {
    const response = await axios.post(`${CATEGORY_URL}/create`, payload)
    return response.data
  } catch (error) {
    apiError(error, 'Failed to create category.')
  }
}