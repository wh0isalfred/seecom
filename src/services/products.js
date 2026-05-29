import { supabase } from './supabase';

/**
 * Fetch all products or filter by category/gender/is_new_arrival
 */
export const fetchProducts = async (category = null, gender = null, limit = null, isNewArrival = null) => {
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
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
};

/**
 * Fetch single product by ID
 */
export const fetchProductById = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  return data;
};

/**
 * Fetch inventory for a specific product
 */
export const fetchProductInventory = async (productId) => {
  const { data, error } = await supabase
    .from('product_inventory')
    .select('*')
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
  return data || [];
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
