import { supabase } from './supabase';

// Load cart from Supabase for a logged-in user
export const loadRemoteCart = async (userId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(({ id, product_id, name, price, image, size, color, quantity }) => ({
    id, productId: product_id, name, price, image, size: size || null, color: color || null, quantity,
  }));
};

// Save entire cart to Supabase (upsert all items)
export const saveRemoteCart = async (userId, cart) => {
  if (!userId) return;

  // Delete all existing items for this user, then insert fresh
  await supabase.from('cart_items').delete().eq('user_id', userId);

  if (cart.length === 0) return;

  const rows = cart.map(item => ({
    id:         item.id,
    user_id:    userId,
    product_id: item.productId,
    name:       item.name,
    price:      item.price,
    image:      item.image || null,
    size:       item.size  || null,
    color:      item.color || null,
    quantity:   item.quantity,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('cart_items').insert(rows);
  if (error) throw error;
};

// Merge local cart + remote cart — remote wins on quantity conflicts
export const mergeCarts = (local, remote) => {
  const map = new Map();

  // Local first
  local.forEach(item => map.set(item.id, { ...item }));

  // Remote overwrites / adds
  remote.forEach(item => {
    if (map.has(item.id)) {
      // Take the higher quantity
      const existing = map.get(item.id);
      map.set(item.id, { ...item, quantity: Math.max(existing.quantity, item.quantity) });
    } else {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
};
