import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// The auth.lock option bypasses navigator.locks which hangs in some
// browser/dev-server environments, causing all queries to never resolve.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    lock: async (_name, _timeout, fn) => fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Products
export const getProducts = async (categoryFilter = null) => {
  let query = supabase.from('products').select('*').eq('active', true)
  if (categoryFilter) query = query.eq('category_id', categoryFilter)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getProductBySlug = async (slug) => {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single()
  if (error) throw error
  return data
}

export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*')
  if (error) throw error
  return data
}

export const getCart = async (sessionId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products:product_id (id, name, price, image_url, sizes, colors)')
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

export const addToCart = async (sessionId, productId, quantity, size = null, color = null) => {
  const { data: existing } = await supabase
    .from('cart_items').select('*')
    .eq('session_id', sessionId).eq('product_id', productId)
    .eq('size', size).eq('color', color).single()

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('cart_items').insert([{ session_id: sessionId, product_id: productId, quantity, size, color }])
  if (error) throw error
  return data
}

export const updateCartItem = async (cartItemId, quantity) => {
  const { data, error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
  if (error) throw error
  return data
}

export const removeFromCart = async (cartItemId) => {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
  if (error) throw error
}

export const clearCart = async (sessionId) => {
  const { error } = await supabase.from('cart_items').delete().eq('session_id', sessionId)
  if (error) throw error
}

export const createOrder = async (customerEmail, customerPhone, cartItems, total) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ customer_email: customerEmail, customer_phone: customerPhone,
      subtotal: total, tax: 0, shipping: 0, total, status: 'pending' }])
    .select().single()
  if (orderError) throw orderError

  const orderItems = cartItems.map(item => ({
    order_id: order.id, product_id: item.product_id, quantity: item.quantity,
    price_at_purchase: item.products.price, size: item.size, color: item.color,
  }))
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError
  return order
}

export const updateOrderStatus = async (orderId, status, stripePaymentId = null) => {
  const updates = { status, updated_at: new Date().toISOString() }
  if (stripePaymentId) updates.stripe_payment_id = stripePaymentId
  const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single()
  if (error) throw error
  return data
}

export const getOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items (*, products:product_id (name, price, image_url))')
    .eq('id', orderId).single()
  if (error) throw error
  return data
}

export const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
