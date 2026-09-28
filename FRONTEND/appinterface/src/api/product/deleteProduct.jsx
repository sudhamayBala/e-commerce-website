import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function deleteProduct(productId) {
  try {
    await axios.delete(`${API_BASE_URL}/product/delete/${productId}`)
  } catch (error) {
    throwRequestError(error, 'Failed to delete product permanently.')
  }
}
