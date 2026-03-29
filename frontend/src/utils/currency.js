export const CURRENCIES = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥"
};

export const EXCHANGE_RATES = {
  USD: 1,
  INR: 83.12,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.45
};

export const getCurrencySymbol = () => {
  if (typeof window !== 'undefined') {
    const code = localStorage.getItem("finvest_currency") || "INR";
    return CURRENCIES[code] || "₹";
  }
  return "₹";
};

export const getCurrencyRate = () => {
  if (typeof window !== 'undefined') {
    const code = localStorage.getItem("finvest_currency") || "INR";
    const liveRatesStr = localStorage.getItem("finvest_live_rates");
    
    if (liveRatesStr) {
      try {
        const liveRates = JSON.parse(liveRatesStr);
        if (liveRates[code]) return liveRates[code];
      } catch (e) {
        console.error("Failed to parse live currency rates");
      }
    }
    return EXCHANGE_RATES[code] || 83.12;
  }
  return 83.12;
};

// Converts backend USD (system base) to User's Local Currency for display
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === undefined || amount === null) return `${getCurrencySymbol()}0.00`;
  const rate = getCurrencyRate();
  const symbol = getCurrencySymbol();
  const converted = parseFloat(amount) * rate;
  return `${symbol}${converted.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`;
};

// Converts User's Local Currency to USD for backend storage
export const parseCurrency = (localAmount) => {
  if (!localAmount) return 0;
  const rate = getCurrencyRate();
  return parseFloat(localAmount) / rate;
};

export const formatCurrencyNoSymbol = (amount, decimals = 2) => {
  if (amount === undefined || amount === null) return "0.00";
  const rate = getCurrencyRate();
  const converted = parseFloat(amount) * rate;
  return converted.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false});
};
