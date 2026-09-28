import axios from 'axios'
import { API_BASE_URL } from '../../api'
import { throwRequestError } from '../requestError'

const toFileFromDataUrl = async (dataUrl, filename) => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null
  }

  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export async function createProduct(productPayload) {
  try {
    const payload = productPayload ?? {}

    if (payload instanceof FormData) {
      const response = await axios.post(`${API_BASE_URL}/product/create`, payload)
      return response.data
    }

    const formData = new FormData()

    const imageFile =
      payload.file ||
      (await toFileFromDataUrl(payload.image_url || payload.image, 'product-image.png'))

    if (imageFile) {
      formData.append('file', imageFile)
    }

    ;['name', 'description', 'price', 'selling_price', 'cost_price', 'stock_quantity', 'category_id'].forEach((key) => {
      const value = payload[key]
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    const response = await axios.post(`${API_BASE_URL}/product/create`, formData)
    return response.data
  } catch (error) {
    throwRequestError(error, 'Failed to create product.')
  }
}
