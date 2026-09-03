import { useState, useEffect } from 'react';
import { uploadProductImage, createProduct, notifyIfNewArrival } from '../services/productAdmin';

// Every measurement column that can ever appear in a size guide. Per-product,
// the admin ticks which of these actually apply — some pieces skip Shoulder,
// some split Sleeve into Short/Long, etc. Add more here if a future piece
// needs a column that doesn't exist yet.
const SIZE_CHART_COLUMN_POOL = ['Chest', 'Length', 'Shoulder', 'Sleeve', 'Short Sleeve', 'Long Sleeve'];

// Default size guide per category — matches what used to be hardcoded on
// the product page. New products auto-fill from this with zero admin
// effort; the admin only ever edits it when a specific piece runs
// differently from the norm (missing a column, split sleeve lengths, etc).
const SIZE_CHART_DEFAULTS = {
  tshirts: {
    type: 'table',
    columns: ['Chest', 'Length', 'Shoulder', 'Sleeve'],
    rows: {
      XS: { Chest: '86–91',  Length: '66', Shoulder: '41', Sleeve: '60' },
      S:  { Chest: '91–96',  Length: '69', Shoulder: '43', Sleeve: '62' },
      M:  { Chest: '96–101', Length: '71', Shoulder: '45', Sleeve: '64' },
      L:  { Chest: '101–106', Length: '74', Shoulder: '47', Sleeve: '66' },
      XL: { Chest: '106–111', Length: '76', Shoulder: '49', Sleeve: '68' },
    },
  },
  chains: {
    type: 'note',
    text: "All SEE.COM chains are one size fits all. Standard length: 50cm with an adjustable clasp. Contact us if you need a custom length.",
  },
};

const defaultChartFor = (category) =>
  JSON.parse(JSON.stringify(SIZE_CHART_DEFAULTS[category] || SIZE_CHART_DEFAULTS.tshirts));

export default function AdminProductForm({ onProductCreated }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category: 'tshirts',
    gender: 'unisex',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [],
    is_new_arrival: true,
    is_made_to_order: false,
  });
  const [sizeChart, setSizeChart] = useState(defaultChartFor('tshirts'));
  const [customizeSizing, setCustomizeSizing] = useState(false);

  const [images, setImages] = useState({
    image_1: null,
    image_2: null,
    image_male: null,
    image_female: null,
  });

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-set sizes based on category
      if (name === 'category') {
        if (value === 'chains') {
          updated.sizes = ['One Size'];
        } else if (prev.category === 'chains') {
          // switching away from chains — restore clothing sizes
          updated.sizes = ['XS', 'S', 'M', 'L', 'XL'];
        }
      }
      return updated;
    });
    if (name === 'category') {
      setSizeChart(defaultChartFor(value));
      setCustomizeSizing(false);
    }
  };

  const handleImageChange = (e, imageType) => {
    setImages(prev => ({
      ...prev,
      [imageType]: e.target.files[0],
    }));
  };

  const handleColorAdd = (color) => {
    if (color && !formData.colors.includes(color)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, color],
      }));
    }
  };

  const handleColorRemove = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color),
    }));
  };

  const handleInventoryAdd = () => {
    const newInventory = [];
    formData.sizes.forEach(size => {
      formData.colors.forEach(color => {
        newInventory.push({
          size,
          color,
          stock_quantity: 0,
        });
      });
    });
    setInventory(newInventory);
  };

  const handleStockChange = (index, quantity) => {
    const updated = [...inventory];
    updated[index].stock_quantity = parseInt(quantity) || 0;
    setInventory(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate inventory — skipped for made-to-order items, which don't track stock
    if (!formData.is_made_to_order) {
      if (inventory.length === 0) {
        setError('Please generate inventory and set stock quantities before creating product');
        return;
      }

      // Check if at least one size/color combo has stock
      if (!inventory.some(item => item.stock_quantity > 0)) {
        setError('At least one size/color combination must have stock > 0');
        return;
      }
    }

    setLoading(true);

    try {
      // Upload images
      const uploadedImages = {};
      for (const [key, file] of Object.entries(images)) {
        if (file) {
          uploadedImages[key] = await uploadProductImage(file, formData.name);
        }
      }

      // Create product
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        sizes: formData.sizes,
        colors: formData.colors,
        size_chart: sizeChart,
        ...uploadedImages,
      };

      const product = await createProduct(productData, inventory);
      notifyIfNewArrival(product);

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        price: '',
        discount_price: '',
        category: 'tshirts',
        gender: 'unisex',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: [],
        is_new_arrival: true,
        is_made_to_order: false,
      });
      setSizeChart(defaultChartFor('tshirts'));
      setCustomizeSizing(false);
      setImages({
        image_1: null,
        image_2: null,
        image_male: null,
        image_female: null,
      });
      setInventory([]);

      onProductCreated?.(product);
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: isMobile ? '24px 16px' : '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontFamily: "'Space Grotesk', sans-serif" }}>ADD PRODUCT</h1>

      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#efe',
          color: '#3c3',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          Product created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="number"
            name="price"
            placeholder="Price (₦)"
            value={formData.price}
            onChange={handleInputChange}
            required
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          rows="4"
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="tshirts">T-Shirts</option>
            <option value="chains">Chains</option>
            <option value="outerwear">Outerwear</option>
          </select>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="unisex">Unisex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* New Arrival Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            id="is_new_arrival"
            name="is_new_arrival"
            checked={formData.is_new_arrival}
            onChange={(e) => setFormData(prev => ({ ...prev, is_new_arrival: e.target.checked }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="is_new_arrival" style={{ fontWeight: '600', cursor: 'pointer' }}>
            Mark as New Arrival (max 6 products)
          </label>
        </div>

        {/* Made to Order Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            id="is_made_to_order"
            name="is_made_to_order"
            checked={formData.is_made_to_order}
            onChange={(e) => setFormData(prev => ({ ...prev, is_made_to_order: e.target.checked }))}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="is_made_to_order" style={{ fontWeight: '600', cursor: 'pointer' }}>
            Made to Order (no stock tracking — ~3 week lead time, e.g. chains)
          </label>
        </div>

        {/* Images */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
          {['image_1', 'image_2', 'image_male', 'image_female'].map(type => (
            <div key={type}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                {type.replace('_', ' ').toUpperCase()}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, type)}
                style={{ display: 'block', width: '100%' }}
              />
              {images[type] && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ✓ {images[type].name}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Sizes — shown as tags, auto-set by category */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            SIZES{' '}
            <span style={{ fontWeight: 400, fontSize: '11px', color: '#999' }}>
              (auto-set by category)
            </span>
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {formData.sizes.map(size => (
              <span key={size} style={{ padding: '6px 12px', background: '#f0f0f0', border: '1px solid #e0e0e0', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.06em' }}>
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Size guide — auto-fills from the category default; only touched
            when this specific piece runs differently from the norm */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600' }}>
            <input
              type="checkbox"
              checked={customizeSizing}
              onChange={(e) => setCustomizeSizing(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            This item's sizing runs differently than usual
          </label>
          <p style={{ margin: '4px 0 0 26px', fontSize: '11px', color: '#999' }}>
            Unchecked, this product uses the standard {formData.category} size guide — no need to touch anything below.
          </p>

          {customizeSizing && sizeChart.type === 'table' && (
            <div style={{ marginTop: '12px' }}>
              {/* Which columns apply to this piece */}
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Columns to show</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {SIZE_CHART_COLUMN_POOL.map(col => {
                  const checked = sizeChart.columns.includes(col);
                  return (
                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: checked ? '#f0f0f0' : '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSizeChart(prev => ({
                            ...prev,
                            columns: e.target.checked
                              ? [...prev.columns, col]
                              : prev.columns.filter(c => c !== col),
                          }));
                        }}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      {col}
                    </label>
                  );
                })}
              </div>

              {/* Values for whichever columns are currently checked — values
                  for unchecked columns are preserved in the background, so
                  re-checking a column brings back whatever was typed before */}
              {sizeChart.columns.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', color: '#999' }}>Size</th>
                        {sizeChart.columns.map(col => (
                          <th key={col} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', color: '#999' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.sizes.map(size => (
                        <tr key={size}>
                          <td style={{ padding: '4px 8px', fontWeight: 600, fontSize: '12px' }}>{size}</td>
                          {sizeChart.columns.map(col => (
                            <td key={col} style={{ padding: '4px 4px' }}>
                              <input
                                type="text"
                                value={sizeChart.rows[size]?.[col] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSizeChart(prev => ({
                                    ...prev,
                                    rows: {
                                      ...prev.rows,
                                      [size]: { ...prev.rows[size], [col]: val },
                                    },
                                  }));
                                }}
                                style={{ width: '70px', padding: '5px 6px', border: '1px solid #e0e0e0', borderRadius: '3px', fontSize: '12px' }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {customizeSizing && sizeChart.type === 'note' && (
            <textarea
              value={sizeChart.text}
              onChange={(e) => setSizeChart(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
              style={{ width: '100%', marginTop: '12px', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontFamily: "'Archivo', sans-serif", fontSize: '13px', resize: 'vertical' }}
            />
          )}
        </div>

        {/* Colors */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            COLORS <span style={{ color: '#be1826' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['Black', 'White', 'Red', 'Navy', 'Green', 'Gold', 'Silver', 'Grey'].map(color => (
              <button
                key={color}
                type="button"
                onClick={() => formData.colors.includes(color) ? handleColorRemove(color) : handleColorAdd(color)}
                style={{
                  padding: isMobile ? '10px 14px' : '8px 12px',
                  background: formData.colors.includes(color) ? '#000' : '#eee',
                  color: formData.colors.includes(color) ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  minHeight: '40px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {color}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add custom color"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleColorAdd(e.target.value);
                e.target.value = '';
              }
            }}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
          />
        </div>

        {/* Inventory */}
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            INVENTORY {!formData.is_made_to_order && <span style={{ color: '#be1826' }}>*</span>}
          </label>

          {formData.is_made_to_order ? (
            <div style={{
              padding: '12px',
              background: '#f0f0f0',
              color: '#555',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              Made to order — stock tracking skipped. Customers can still pick from the sizes/colors above; availability is never gated by stock.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleInventoryAdd}
                disabled={formData.colors.length === 0}
                style={{
                  padding: '10px 16px',
                  background: formData.colors.length === 0 ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: formData.colors.length === 0 ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                }}
              >
                {formData.colors.length === 0 ? 'Add Colors First' : 'Generate Inventory (All Size/Color Combos)'}
              </button>

              {inventory.length === 0 && (
                <div style={{
                  padding: '12px',
                  background: '#fee',
                  color: '#c33',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}>
                  ⚠️ You must generate inventory and set stock before creating product
                </div>
              )}

              {inventory.length > 0 && (
            <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '280px' : 'auto' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Size</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Color</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.size}</td>
                      <td style={{ padding: '8px' }}>{item.color}</td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          value={item.stock_quantity}
                          onChange={(e) => handleStockChange(idx, e.target.value)}
                          style={{ width: '60px', padding: '6px', border: '1px solid #ccc', borderRadius: '2px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 24px',
            background: loading ? '#ccc' : '#be1826',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            width: isMobile ? '100%' : 'auto',
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {loading ? 'CREATING...' : 'CREATE PRODUCT'}
        </button>
      </form>
    </div>
  );
}
