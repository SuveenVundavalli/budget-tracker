import axios from 'axios';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ExchangeRate } from '../types';

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

export const getExchangeRate = async (
  baseCurrency: string,
  date: string
): Promise<Record<string, number>> => {
  // 1. Check Firestore cache first
  const cacheKey = `${baseCurrency}_${date}`;
  const cacheDoc = await getDoc(doc(db, 'exchangeRates', cacheKey));

  if (cacheDoc.exists()) {
    return (cacheDoc.data() as ExchangeRate).rates;
  }

  // 2. If not in cache, fetch from API
  // Note: Free tier might only support 'latest' or limited historical.
  // We'll try to fetch latest if the date is today, otherwise historical if available.
  const today = new Date().toISOString().split('T')[0];
  let url = `${BASE_URL}/latest/${baseCurrency}`;

  if (date !== today) {
    // Historical API: https://v6.exchangerate-api.com/v6/YOUR-API-KEY/history/CURRENCY/YEAR/MONTH/DAY
    const [year, month, day] = date.split('-');
    url = `${BASE_URL}/history/${baseCurrency}/${year}/${month}/${day}`;
  }

  try {
    const response = await axios.get(url);
    const rates = response.data.conversion_rates || response.data.rates;

    if (!rates) {
      throw new Error('Could not fetch rates');
    }

    // 3. Save to Firestore
    await setDoc(doc(db, 'exchangeRates', cacheKey), {
      date,
      base: baseCurrency,
      rates,
    });

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to latest if historical fails
    if (date !== today) {
      const fallbackResponse = await axios.get(`${BASE_URL}/latest/${baseCurrency}`);
      return fallbackResponse.data.conversion_rates;
    }
    throw error;
  }
};
