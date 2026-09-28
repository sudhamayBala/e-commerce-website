import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function updateReview(reviewId, reviewPayload) {
  try {
    const response = await axios.put(`${API_BASE_URL}/rating/review/update/${reviewId}`, reviewPayload)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to update review.')
  }
}
