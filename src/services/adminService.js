import { supabase } from './supabase';

/**
 * RUN THIS SQL IN SUPABASE BEFORE USING ADMIN PANEL:
 *
 * -- Orders: admin read/update
 * CREATE POLICY "Admin read orders" ON orders FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 * CREATE POLICY "Admin update orders" ON orders FOR UPDATE
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 *
 * -- Order items: admin read
 * CREATE POLICY "Admin read order items" ON order_items FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 *
 * -- Inventory: admin read/update
 * CREATE POLICY "Admin read inventory" ON product_inventory FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 * CREATE POLICY "Admin update inventory" ON product_inventory FOR UPDATE
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 *
 * -- Products: admin update/delete
 * CREATE POLICY "Admin update products" ON products FOR UPDATE
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 * CREATE POLICY "Admin delete products" ON products FOR DELETE
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 * CREATE POLICY "Admin insert products" ON products FOR INSERT
 *   WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 */

export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAllOrders:', error); return []; }
  return data || [];
};

export const updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders').update({ order_status: status }).eq('id', orderId);
  if (error) throw error;
};

export const updatePaymentStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders').update({ payment_status: status }).eq('id', orderId);
  if (error) throw error;
};

export const saveTrackingInfo = async (orderId, trackingNumber, carrier) => {
  const { error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber, carrier, order_status: 'shipped' })
    .eq('id', orderId);
  if (error) throw error;
};

export const fetchAllInventory = async () => {
  const { data, error } = await supabase
    .from('product_inventory')
    .select('*, products(id, name, category, image_1)')
    .order('stock_quantity', { ascending: true });
  if (error) { console.error('fetchAllInventory:', error); return []; }
  return data || [];
};

export const updateStockQuantity = async (inventoryId, quantity) => {
  const { error } = await supabase
    .from('product_inventory')
    .update({ stock_quantity: parseInt(quantity) || 0 })
    .eq('id', inventoryId);
  if (error) throw error;
};

export const fetchAllProducts = async () => {
  const { data, error } = await supabase
    .from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchAllProducts:', error); return []; }
  return data || [];
};

export const toggleNewArrival = async (productId, value) => {
  const { error } = await supabase
    .from('products').update({ is_new_arrival: value }).eq('id', productId);
  if (error) throw error;
};

export const deleteProductById = async (productId) => {
  const { error } = await supabase
    .from('products').delete().eq('id', productId);
  if (error) throw error;
};

// ── DISCOUNT & PRODUCT EDIT ──────────────────────────────────────────────────
/**
 * RUN THIS SQL FIRST:
 *
 * CREATE TABLE IF NOT EXISTS settings (
 *   key TEXT PRIMARY KEY,
 *   value JSONB DEFAULT '{}'::JSONB,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * INSERT INTO settings (key, value)
 *   VALUES ('global_discount', '{"percent": 0, "active": false}')
 *   ON CONFLICT DO NOTHING;
 * ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
 * CREATE POLICY "Admin manage settings" ON settings FOR ALL
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
 *   WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
 */

export const updateProductDetails = async (productId, updates) => {
  // Strip undefined / empty discount_price
  if (updates.discount_price === '' || updates.discount_price === null) {
    updates.discount_price = null;
  } else if (updates.discount_price !== undefined) {
    updates.discount_price = parseFloat(updates.discount_price) || null;
  }
  if (updates.price !== undefined) updates.price = parseFloat(updates.price);

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
