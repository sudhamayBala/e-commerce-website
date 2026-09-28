export const defaultStoreSettings = {
  storeName: 'ShopNest',
  supportEmail: 'hello@shopnest.example',
  currency: 'USD',
}

export function getStoreSettings() {
  try {
    return { ...defaultStoreSettings, ...JSON.parse(localStorage.getItem('storeSettings') || '{}') }
  } catch {
    return defaultStoreSettings
  }
}

export function saveStoreSettings(settings) {
  const nextSettings = { ...defaultStoreSettings, ...settings }
  localStorage.setItem('storeSettings', JSON.stringify(nextSettings))
  window.dispatchEvent(new Event('store-settings-changed'))
  return nextSettings
}

export function formatCurrency(value, currency = getStoreSettings().currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value) || 0)
}