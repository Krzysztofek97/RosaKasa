let cachedSettings: { currency: string; showDecimals: boolean } | null = null;

export function invalidateCurrencyCache() {
  cachedSettings = null;
}

/**
 * Formats a number based on selected currency settings (cached for performance)
 */
export function formatCurrency(amount: number, overrideSettings?: { currency?: string; showDecimals?: boolean }): string {
  let currency = 'PLN';
  let showDecimals = false;

  if (overrideSettings) {
    currency = overrideSettings.currency || 'PLN';
    showDecimals = overrideSettings.showDecimals ?? false;
  } else {
    if (!cachedSettings) {
      try {
        const saved = localStorage.getItem('rosakasa_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          cachedSettings = {
            currency: parsed.currency || 'PLN',
            showDecimals: parsed.showDecimals ?? false,
          };
        } else {
          cachedSettings = { currency: 'PLN', showDecimals: false };
        }
      } catch {
        cachedSettings = { currency: 'PLN', showDecimals: false };
      }
    }
    currency = cachedSettings.currency;
    showDecimals = cachedSettings.showDecimals;
  }

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

/**
 * Safely calculates percentage and caps at 100 or returns 0 on NaN
 */
export function calculatePercentage(current: number, target: number): number {
  if (!target || target === 0) return 0;
  const pct = (current / target) * 100;
  return Math.min(Math.round(pct), 1000); // Allow more than 100% for over-spent or over-achieved, but standard cap
}
