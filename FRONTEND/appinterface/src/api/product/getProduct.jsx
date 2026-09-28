import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'
import { normalizeProduct } from './getProducts'

export async function getProduct(productId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/product/Get/Product/${productId}`)
    return normalizeProduct(response.data)
  } catch (error) {
    throwRequestError(error, 'Failed to load product.')
  }
}
