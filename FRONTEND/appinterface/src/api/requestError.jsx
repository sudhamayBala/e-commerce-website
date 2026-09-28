export function getErrorMessage(error, fallbackMessage = 'Something went wrong. Please try again.') {
  if (!error) return fallbackMessage

  const payload = error?.response?.data ?? error?.data ?? error

  if (typeof payload === 'string' && payload.trim()) return payload
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message
  if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail

  if (Array.isArray(payload?.detail)) {
    const joined = payload.detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item?.msg === 'string') return item.msg
        if (typeof item?.message === 'string') return item.message
        if (typeof item?.detail === 'string') return item.detail
        return ''
      })
      .filter(Boolean)
      .join('. ')

    if (joined) return joined
  }

  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error
  if (typeof error?.message === 'string' && error.message.trim()) return error.message

  try {
    return JSON.stringify(payload)
  } catch {
    return fallbackMessage
  }
}

export function throwRequestError(error, fallbackMessage) {
  throw new Error(getErrorMessage(error, fallbackMessage), { cause: error })
}
