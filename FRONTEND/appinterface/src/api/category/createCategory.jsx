import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function createCategory(categoryPayload) {
  try {
    const response = await axios.post(`${API_BASE_URL}/category/create`, categoryPayload)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to create category.')
  }
}
