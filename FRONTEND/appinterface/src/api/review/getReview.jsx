import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function getReview(reviewId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/rating/review/get/${reviewId}`)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to load review.')
  }
}
