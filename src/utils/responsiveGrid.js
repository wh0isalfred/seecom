import { useState, useEffect } from 'react';

/**
 * Get responsive grid columns based on viewport width
 * Desktop (1024px+): 5 columns
 * Tablet/iPad (768px-1023px): 3 columns
 * Mobile (<768px): 2 columns
 */
export const getResponsiveGridStyle = () => {
  if (typeof window === 'undefined') {
    return 'repeat(5, 1fr)'; // Default for SSR
  }

  const width = window.innerWidth;

  if (width < 768) {
    return 'repeat(2, 1fr)'; // Mobile: 2 columns
  } else if (width < 1024) {
    return 'repeat(3, 1fr)'; // Tablet: 3 columns
  } else {
    return 'repeat(5, 1fr)'; // Desktop: 5 columns
  }
};

/**
 * Hook to get responsive grid and update on window resize
 */
export const useResponsiveGrid = () => {
  const [gridColumns, setGridColumns] = useState(() => getResponsiveGridStyle());

  useEffect(() => {
    const handleResize = () => {
      setGridColumns(getResponsiveGridStyle());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return gridColumns;
};
