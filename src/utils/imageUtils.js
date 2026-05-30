/**
 * Optimise Supabase Storage image URLs.
 * Appends width, format=webp and quality params so the browser
 * receives a compressed image instead of the raw upload.
 *
 * Usage:
 *   import { optimiseImage } from '../utils/imageUtils'
 *   <img src={optimiseImage(product.image_1, 600)} />
 */
export const optimiseImage = (url, width = 600, quality = 75) => {
  if (!url) return url;

  // Only transform Supabase Storage URLs
  if (!url.includes('supabase.co/storage')) return url;

  // Already has transform params — don't double-apply
  if (url.includes('width=')) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&format=webp&quality=${quality}`;
};

// Common presets
export const thumbImage  = url => optimiseImage(url, 200, 70);  // ProductCard thumbnail
export const detailImage = url => optimiseImage(url, 800, 80);  // Product detail page
export const heroImage   = url => optimiseImage(url, 1200, 80); // Full-width banners
