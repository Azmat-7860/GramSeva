import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setCollector, setPinVerified, clearCollector } from '../store/slices/collectorSlice';
import { setSession, clearSession } from '../store/slices/authSlice';
import { supabase } from '../store/supabaseClient';
import { Collector } from '../types';

export function useCollectorAuth() {
  const dispatch = useAppDispatch();
  const { currentCollector, pinVerified, assignedVillages } = useAppSelector(
    (state) => state.collector
  );

  const verifyCollector = useCallback(
    async (phone: string) => {
      const { data, error } = await supabase
        .from('collectors')
        .select('*, villages(*)')
        .eq('phone', phone)
        .single();

      if (error || !data) return null;

      const collector = data as Collector & { villages: any };
      dispatch(setCollector(collector));
      return collector;
    },
    [dispatch]
  );

  const verifyPin = useCallback(
    async (pin: string) => {
      if (!currentCollector) return false;
      const { data, error } = await supabase.rpc('verify_collector_pin', {
        p_collector_id: currentCollector.id,
        p_pin: pin,
      });
      const isValid = !error && data === true;
      if (isValid) {
        dispatch(setPinVerified(true));
        dispatch(setSession({
          session: 'collector',
          email: currentCollector.phone,
          role: 'collector',
        }));
      }
      return isValid;
    },
    [currentCollector, dispatch]
  );

  const logout = useCallback(() => {
    dispatch(clearCollector());
    dispatch(clearSession());
  }, [dispatch]);

  return {
    currentCollector,
    pinVerified,
    assignedVillages,
    verifyCollector,
    verifyPin,
    logout,
  };
}
// import { useCallback } from 'react';
// import { useAppDispatch, useAppSelector } from '../store/store';
// import { setCollector, setPinVerified, clearCollector } from '../store/slices/collectorSlice';
// import { supabase } from '../store/supabaseClient';
// import { Collector } from '../types';

// export function useCollectorAuth() {
//   const dispatch = useAppDispatch();
//   const { currentCollector, pinVerified, assignedVillages } = useAppSelector(
//     (state) => state.collector
//   );

//   const verifyCollector = useCallback(
//     async (phone: string) => {
//       const { data, error } = await supabase
//         .from('collectors')
//         .select('*, villages(*)')
//         .eq('phone', phone)
//         .single();

//       if (error || !data) return null;

//       const collector = data as Collector & { villages: any };
//       dispatch(setCollector(collector));
//       return collector;
//     },
//     [dispatch]
//   );

//   const verifyPin = useCallback(
//     async (pin: string) => {
//       if (!currentCollector) return false;
//       const { data, error } = await supabase.rpc('verify_collector_pin', {
//         p_collector_id: currentCollector.id,
//         p_pin: pin,
//       });
//       const isValid = !error && data === true;
//       if (isValid) {
//         dispatch(setPinVerified(true));
//       }
//       return isValid;
//     },
//     [currentCollector, dispatch]
//   );

//   const logout = useCallback(() => {
//     dispatch(clearCollector());
//   }, [dispatch]);

//   return {
//     currentCollector,
//     pinVerified,
//     assignedVillages,
//     verifyCollector,
//     verifyPin,
//     logout,
//   };
// }
