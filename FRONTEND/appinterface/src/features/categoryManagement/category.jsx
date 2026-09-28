import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../../api'

const CATEGORY_URL = `${API_BASE_URL}/category`

const emptyCategory = {
  name: '',
  description: '',
}

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  fallback
)

export async function createCategory(categoryPayload) {
  try {
    const response = await axios.post(`${CATEGORY_URL}/create`, categoryPayload, {
      headers: { 'Content-Type': 'application/json' },
    })
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create category.'), { cause: error })
  }
}

export async function fetchCategories() {
  try {
    const response = await axios.get(`${CATEGORY_URL}/Gate/Categories`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load categories.'), { cause: error })
  }
}

export async function fetchCategoryById(categoryId) {
  try {
    const response = await axios.get(`${CATEGORY_URL}/Get/Category/${categoryId}`)
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load category.'), { cause: error })
  }
}

export async function updateCategory(categoryId, categoryPayload) {
  try {
    const response = await axios.put(`${CATEGORY_URL}/update/${categoryId}`, categoryPayload, {
      headers: { 'Content-Type': 'application/json' },
    })
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update category.'), { cause: error })
  }
}

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyCategory)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCategories = async () => {
    try {
      setLoading(true)
      setCategories(await fetchCategories())
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    try {
      setLoading(true)
      await createCategory({
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      setForm(emptyCategory)
      setMessage('Category created successfully.')
      setError('')
      await loadCategories()
    } catch (requestError) {
      setError(requestError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleGet = async () => {
    if (!selectedCategoryId) {
      setError('Enter a category ID first.')
      return
    }

    try {
      setLoading(true)
      const category = await fetchCategoryById(selectedCategoryId)
      setForm({
        name: category.name || '',
        description: category.description || '',
      })
      setError('')
      setMessage(`Category #${selectedCategoryId} loaded for editing.`)
    } catch (requestError) {
      setError(requestError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!selectedCategoryId) {
      setError('Enter a category ID before updating.')
      return
    }

    try {
      setLoading(true)
      await updateCategory(selectedCategoryId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      setMessage('Category updated successfully.')
      setError('')
      await loadCategories()
    } catch (requestError) {
      setError(requestError.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="category-manager">
      <h1>Category Manager</h1>
      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}

      <form onSubmit={handleCreate}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Category name"
          maxLength="100"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Category description"
          maxLength="1000"
        />
        <button type="submit" disabled={loading}>Create category</button>
        <button type="button" onClick={handleUpdate} disabled={loading}>Update category</button>
      </form>

      <section>
        <label>
          Category ID
          <input
            type="number"
            min="1"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
          />
        </label>
        <button type="button" onClick={handleGet} disabled={loading}>Get category</button>
      </section>

      <h2>Categories</h2>
      {loading && <p>Loading...</p>}
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <button type="button" onClick={() => setSelectedCategoryId(category.id)}>
              #{category.id} {category.name}
            </button>
            {category.description && <span> - {category.description}</span>}
          </li>
        ))}
      </ul>
    </main>
  )
}
