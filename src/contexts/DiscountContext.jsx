import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const DiscountContext = createContext({ discount: { percent: 0, active: false }, updateDiscount: async () => {} });

export function DiscountProvider({ children }) {
  const [discount, setDiscount] = useState({ percent: 0, active: false });

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'global_discount')
      .single()
      .then(({ data }) => { if (data?.value) setDiscount(data.value); })
      .catch(() => {});
  }, []);

  const updateDiscount = async (percent, active) => {
    await supabase
      .from('settings')
      .upsert({ key: 'global_discount', value: { percent, active }, updated_at: new Date().toISOString() });
    setDiscount({ percent, active });
  };

  return (
    <DiscountContext.Provider value={{ discount, updateDiscount }}>
      {children}
    </DiscountContext.Provider>
  );
}

export const useDiscount = () => useContext(DiscountContext);
