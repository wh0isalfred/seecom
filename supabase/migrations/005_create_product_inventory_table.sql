-- Create product_inventory table
CREATE TABLE IF NOT EXISTS product_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR NOT NULL,
  color VARCHAR NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  
  -- Prevent duplicate size/color combinations for same product
  UNIQUE(product_id, size, color),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_size ON product_inventory(size);
CREATE INDEX IF NOT EXISTS idx_product_inventory_color ON product_inventory(color);

-- Enable RLS
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON product_inventory FOR SELECT USING (true);
