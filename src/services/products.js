import { supabase } from './supabase';
import { withRetry } from '../utils/fetchWithRetry';

/**
 * Fetch all products or filter by category/gender/is_new_arrival.
 * Retries automatically on failure (flaky connection, cold Supabase
 * connection, etc.) before giving up — see withRetry. Throws if every
 * attempt fails, so the caller can show a real error/retry state instead
 * of silently rendering "no products."
 */
export const fetchProducts = async (category = null, gender = null, limit = null, isNewArrival = null) => {
  return withRetry(async () => {
    let query = supabase.from('products').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    if (isNewArrival !== null) {
      query = query.eq('is_new_arrival', isNewArrival);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

/**
 * Fetch single product by ID. Retries on failure; throws if all attempts fail.
 */
export const fetchProductById = async (productId) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  });
};

/**
 * Fetch inventory for a specific product. Retries on failure; throws if all attempts fail.
 */
export const fetchProductInventory = async (productId) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('product_inventory')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return data || [];
  });
};

/**
 * Check stock for specific product/size/color combo
 */
export const checkStock = async (productId, size, color) => {
  const { data, error } = await supabase
    .from('product_inventory')
    .select('stock_quantity')
    .eq('product_id', productId)
    .eq('size', size)
    .eq('color', color)
    .single();

  if (error) {
    console.error('Error checking stock:', error);
    return 0;
  }
  return data?.stock_quantity || 0;
};

/**
 * Get total stock for product (all sizes/colors)
 */
export const getTotalStock = async (productId) => {
  const { data, error } = await supabase
    .from('product_inventory')
    .select('stock_quantity')
    .eq('product_id', productId);

  if (error) {
    console.error('Error getting total stock:', error);
    return 0;
  }

  return data?.reduce((total, item) => total + item.stock_quantity, 0) || 0;
};

/**
 * Fetch products by category (for category pages)
 */
export const fetchProductsByCategory = async (category, gender = null) => {
  let query = supabase.from('products').select('*').eq('category', category);

  if (gender) {
    query = query.eq('gender', gender);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
  return data || [];
};
