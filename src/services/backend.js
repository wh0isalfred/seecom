// ==========================================
// BACKEND SERVICES - PRODUCTS, ORDERS, PAYMENTS
// ==========================================

import { supabase } from './supabase'

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

/**
 * Create a new product with all details
 */
export const createProduct = async (productData) => {
  const {
    name,
    slug,
    description,
    price,
    cost,
    category_id,
    sku,
    sizes = [],
    colors = [],
    inventory = [],
  } = productData

  try {
    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{
        name,
        slug,
        description,
        price,
        cost,
        category_id,
        sku,
        is_active: true,
      }])
      .select()
      .single()

    if (productError) throw productError

    // Add sizes
    if (sizes.length > 0) {
      const sizesData = sizes.map(size => ({
        product_id: product.id,
        size,
      }))
      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(sizesData)
      if (sizesError) throw sizesError
    }

    // Add colors
    if (colors.length > 0) {
      const colorsData = colors.map(color => ({
        product_id: product.id,
        color: color.name,
        color_code: color.code || null,
      }))
      const { error: colorsError } = await supabase
        .from('product_colors')
        .insert(colorsData)
      if (colorsError) throw colorsError
    }

    // Add inventory
    if (inventory.length > 0) {
      const inventoryData = inventory.map(inv => ({
        product_id: product.id,
        size: inv.size,
        color: inv.color,
        quantity: inv.quantity,
        sku: inv.sku || `${sku}-${inv.size}-${inv.color}`,
      }))
      const { error: inventoryError } = await supabase
        .from('product_inventory')
        .insert(inventoryData)
      if (inventoryError) throw inventoryError
    }

    return { success: true, product }
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Upload product image to Supabase Storage
 */
export const uploadProductImage = async (file, productId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl, path: filePath }
  } catch (error) {
    console.error('Error uploading product image:', error)
    throw error
  }
}

/**
 * Update product image
 */
export const updateProductImage = async (productId, imageUrl) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating product image:', error)
    throw error
  }
}

/**
 * Get product with all variants and inventory
 */
export const getProductWithDetails = async (productId) => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError) throw productError

    const { data: sizes } = await supabase
      .from('product_sizes')
      .select('*')
      .eq('product_id', productId)

    const { data: colors } = await supabase
      .from('product_colors')
      .select('*')
      .eq('product_id', productId)

    const { data: inventory } = await supabase
      .from('product_inventory')
      .select('*')
      .eq('product_id', productId)

    return {
      ...product,
      sizes: sizes || [],
      colors: colors || [],
      inventory: inventory || [],
    }
  } catch (error) {
    console.error('Error fetching product details:', error)
    throw error
  }
}

/**
 * Update inventory after purchase
 */
export const updateInventory = async (productId, size, color, quantityDecrease) => {
  try {
    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from('product_inventory')
      .select('id, quantity')
      .eq('product_id', productId)
      .eq('size', size)
      .eq('color', color)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

    if (!inventory) throw new Error('Inventory not found')

    const newQuantity = Math.max(0, inventory.quantity - quantityDecrease)

    const { error: updateError } = await supabase
      .from('product_inventory')
      .update({ quantity: newQuantity })
      .eq('id', inventory.id)

    if (updateError) throw updateError

    // Update product total stock
    const { data: totalStock, error: sumError } = await supabase
      .rpc('sum_product_inventory', { p_product_id: productId })

    if (!sumError && totalStock) {
      await supabase
        .from('products')
        .update({ stock: totalStock })
        .eq('id', productId)
    }

    return { success: true, newQuantity }
  } catch (error) {
    console.error('Error updating inventory:', error)
    throw error
  }
}

// ==========================================
// ORDER MANAGEMENT
// ==========================================

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const prefix = 'ORD'
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Create order from cart
 */
export const createOrder = async (sessionId, orderData) => {
  const {
    customer_email,
    customer_phone,
    customer_name,
    shipping_address,
    billing_address,
    cartItems,
  } = orderData

  try {
    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.products.price * item.quantity),
      0
    )
    const tax = subtotal * 0.1
    const shipping_cost = subtotal > 0 ? 10 : 0
    const total = subtotal + tax + shipping_cost

    const orderNumber = generateOrderNumber()

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        session_id: sessionId,
        customer_email,
        customer_phone,
        customer_name,
        shipping_first_name: shipping_address.first_name,
        shipping_last_name: shipping_address.last_name,
        shipping_address: shipping_address.address,
        shipping_city: shipping_address.city,
        shipping_state: shipping_address.state,
        shipping_postal_code: shipping_address.postal_code,
        shipping_country: shipping_address.country,
        billing_first_name: billing_address.first_name,
        billing_last_name: billing_address.last_name,
        billing_address: billing_address.address,
        billing_city: billing_address.city,
        billing_state: billing_address.state,
        billing_postal_code: billing_address.postal_code,
        billing_country: billing_address.country,
        subtotal,
        tax,
        shipping_cost,
        total,
        order_status: 'pending',
        payment_status: 'pending',
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.products.name,
      product_image_url: item.products.image_url,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price_per_item: item.products.price,
      total_price: item.products.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Create initial status entry
    const { error: statusError } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: order.id,
        status: 'pending',
        notes: 'Order created, awaiting payment',
      }])

    if (statusError) throw statusError

    // Update inventory for each item
    for (const item of cartItems) {
      await updateInventory(item.product_id, item.size, item.color, item.quantity)
    }

    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

/**
 * Get order with items
 */
export const getOrder = async (orderId) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    const { data: statusHistory } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    return {
      ...order,
      items: items || [],
      status_history: statusHistory || [],
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, newStatus, notes = '') => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId)

    if (error) throw error

    // Note: Trigger will auto-create status history entry
    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

/**
 * Update order payment status
 */
export const updatePaymentStatus = async (orderId, paymentStatus, stripePaymentId = null) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        stripe_payment_id: stripePaymentId,
        order_status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
      })
      .eq('id', orderId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw error
  }
}

/**
 * Add tracking information to order
 */
export const updateOrderTracking = async (orderId, trackingData) => {
  const { tracking_number, carrier, estimated_delivery } = trackingData

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        tracking_number,
        carrier,
        estimated_delivery,
        order_status: 'shipped',
      })
      .eq('id', orderId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating tracking:', error)
    throw error
  }
}

/**
 * Get customer orders
 */
export const getCustomerOrders = async (email) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return orders || []
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    throw error
  }
}

// ==========================================
// EMAIL NOTIFICATIONS
// ==========================================

/**
 * Send order confirmation email (Call from backend/API)
 */
export const sendOrderConfirmationEmail = async (orderId, email) => {
  try {
    const order = await getOrder(orderId)

    // Log email (you'll need to implement actual sending)
    const { error } = await supabase
      .from('email_logs')
      .insert([{
        order_id: orderId,
        recipient_email: email,
        email_type: 'order_confirmation',
        subject: `Order Confirmation - ${order.order_number}`,
        status: 'sent',
      }])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error logging email:', error)
    throw error
  }
}

/**
 * Send shipping notification email
 */
export const sendShippingNotificationEmail = async (orderId, email) => {
  try {
    const order = await getOrder(orderId)

    const { error } = await supabase
      .from('email_logs')
      .insert([{
        order_id: orderId,
        recipient_email: email,
        email_type: 'shipping_notification',
        subject: `Your order has shipped - ${order.order_number}`,
        status: 'sent',
      }])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error logging shipping email:', error)
    throw error
  }
}

// ==========================================
// STRIPE INTEGRATION
// ==========================================

/**
 * Create Stripe checkout session
 * Call this from your frontend, it should hit a backend endpoint
 */
export const createCheckoutSession = async (orderData) => {
  try {
    // This should call your backend API endpoint that handles Stripe
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    return { success: true, sessionId: data.sessionId, url: data.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

/**
 * Get or create customer
 */
export const upsertCustomer = async (email, customerData = {}) => {
  try {
    // Try to get existing customer
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    if (existing) {
      return existing
    }

    // Create new customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([{
        email,
        phone: customerData.phone,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
      }])
      .select()
      .single()

    if (error) throw error
    return customer
  } catch (error) {
    console.error('Error upserting customer:', error)
    throw error
  }
}

/**
 * Update customer order stats
 */
export const updateCustomerStats = async (email) => {
  try {
    // Get all customer orders
    const orders = await getCustomerOrders(email)
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)

    const { error } = await supabase
      .from('customers')
      .update({
        total_orders: totalOrders,
        total_spent: totalSpent,
      })
      .eq('email', email)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating customer stats:', error)
    throw error
  }
}
