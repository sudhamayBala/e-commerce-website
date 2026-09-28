import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

export async function getCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/category/Gate/Categories`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    throwRequestError(error, 'Failed to load categories.')
  }
}
