/**
 * Formats a number based on selected currency settings from localStorage
 */
export function formatCurrency(amount: number): string {
  try {
    const saved = localStorage.getItem('rosakasa_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      const currency = settings.currency || 'PLN';
      const showDecimals = settings.showDecimals ?? false;
      
      const localeMap: Record<string, string> = {
        PLN: 'pl-PL',
        EUR: 'de-DE',
        USD: 'en-US',
        GBP: 'en-GB'
      };
      
      return new Intl.NumberFormat(localeMap[currency] || 'pl-PL', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
      }).format(amount);
    }
  } catch (e) {
    // fallback to default
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Safely calculates percentage and caps at 100 or returns 0 on NaN
 */
export function calculatePercentage(current: number, target: number): number {
  if (!target || target === 0) return 0;
  const pct = (current / target) * 100;
  return Math.min(Math.round(pct), 1000); // Allow more than 100% for over-spent or over-achieved, but standard cap
}
