import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function getCategory(categoryId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/category/Get/Category/${categoryId}`)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to load category.')
  }
}
