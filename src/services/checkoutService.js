import { supabase } from './supabase';

const generateOrderNumber = () => {
  const ts  = Date.now().toString().slice(-6);
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SEE-${ts}-${rnd}`;
};

/**
 * Called after Paystack confirms payment.
 * Creates the order, inserts items, reduces inventory — all in one shot.
 */
export const createOrderAfterPayment = async ({ formData, cart, paystackReference, total, shipping }) => {
  // Race against a 10s timeout — prevents silent infinite hang
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Order creation timed out — check Supabase RLS SELECT policy on orders')), 10000)
  );

  return Promise.race([_createOrder({ formData, cart, paystackReference, total, shipping }), timeoutPromise]);
};


const _createOrder = async ({ formData, cart, paystackReference, total, shipping }) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isGuestOrder = !session;

  const subtotal = total - shipping;
  const orderNumber = generateOrderNumber();
  
  // 1 — Create order row
  // Use .select() without .single() — .single() throws silently if RLS blocks RETURNING
  const { data: orderRows, error: orderError } = await supabase
    .from('orders')
    .insert([{
      order_number: orderNumber,
      customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
      customer_email: formData.email,
      customer_phone: formData.phone,
      shipping_address: formData.address,
      shipping_city: formData.city,
      shipping_state: formData.state,

      is_guest_order: isGuestOrder,

      subtotal,
      shipping_cost: shipping,
      total,
      order_status: 'confirmed',
      payment_status: 'paid',
      paystack_reference: paystackReference,
    }])
    .select();

  if (orderError) { console.error('Order insert error:', orderError); throw orderError; }
  if (!orderRows || orderRows.length === 0) { console.error('Order insert returned no rows'); throw new Error('Order insert returned no data — check RLS SELECT policy on orders table'); }

  const order = orderRows[0];

  // 2 — Insert order items
  const orderItems = cart.map(item => ({
    order_id:          order.id,
    product_id:        item.productId,
    product_name:      item.name,
    product_image_url: item.image,
    size:              item.size,
    color:             item.color,
    quantity:          item.quantity,
    price_per_item:    item.price,
    total_price:       item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) { console.error('Order items insert error:', itemsError); throw itemsError; }

  // 3 — Reduce inventory for each item
  for (const item of cart) {
    const { data: inv } = await supabase
      .from('product_inventory')
      .select('id, stock_quantity')
      .eq('product_id', item.productId)
      .eq('size',  item.size  || '')
      .eq('color', item.color || '')
      .maybeSingle();

    if (inv) {
      await supabase
        .from('product_inventory')
        .update({ stock_quantity: Math.max(0, inv.stock_quantity - item.quantity) })
        .eq('id', inv.id);
    }
  }

  return order;
};
