import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function getReviews() {
  try {
    const response = await axios.get(`${API_BASE_URL}/rating/reviews/get`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    throwRequestError(error, 'Failed to load reviews.')
  }
}
