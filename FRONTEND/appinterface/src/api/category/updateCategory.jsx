import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function updateCategory(categoryId, categoryPayload) {
  try {
    const response = await axios.put(`${API_BASE_URL}/category/update/${categoryId}`, categoryPayload)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to update category.')
  }
}
