import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function createReview(reviewPayload) {
  try {
    const response = await axios.post(`${API_BASE_URL}/rating/review/post`, reviewPayload)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to create review.')
  }
}
