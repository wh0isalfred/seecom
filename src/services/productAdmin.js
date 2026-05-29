import { supabase } from './supabase';

/**
 * Upload a product image to Supabase Storage
 * @param {File} file - Image file
 * @param {string} productName - Product name for folder organization
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadProductImage = async (file, productName) => {
  if (!file) return null;

  const fileName = `${Date.now()}-${file.name}`;
  const folderPath = `products/${productName.replace(/\s+/g, '-').toLowerCase()}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(folderPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Create a new product with inventory
 * @param {Object} productData - Product information
 * @param {Array} inventoryData - Inventory records (size, color, stock)
 * @returns {Promise<Object>} - Created product
 */
export const createProduct = async (productData, inventoryData = []) => {
  try {
    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) throw productError;

    // Insert inventory records
    if (inventoryData.length > 0) {
      const inventoryWithProductId = inventoryData.map(item => ({
        ...item,
        product_id: product.id,
      }));

      const { error: inventoryError } = await supabase
        .from('product_inventory')
        .insert(inventoryWithProductId);

      if (inventoryError) throw inventoryError;
    }

    return product;
  } catch (error) {
    console.error('Product creation error:', error);
    throw error;
  }
};

/**
 * Update existing product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Product update error:', error);
    throw error;
  }
};

/**
 * Get all products
 */
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fetch products error:', error);
    throw error;
  }
};

/**
 * Delete product (cascades to inventory)
 */
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Product deletion error:', error);
    throw error;
  }
};
