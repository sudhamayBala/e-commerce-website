import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'
import { normalizeProduct } from './getProducts'

export async function updateProduct(productId, productPayload) {
  try {
    const response = await axios.put(`${API_BASE_URL}/product/update/${productId}`, productPayload)
    return normalizeProduct(response.data)
  } catch (error) {
    throwRequestError(error, 'Failed to update product.')
  }
}
