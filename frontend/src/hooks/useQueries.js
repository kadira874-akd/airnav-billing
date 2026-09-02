import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/apiClient';

// ── QUERIES ───────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
    staleTime: 30_000,
  });
}

export function useUnitData(unitCode) {
  return useQuery({
    queryKey: ['unitData', unitCode],
    queryFn: () => api.unitData(unitCode),
    enabled: !!unitCode && unitCode !== 'ALL',
    staleTime: 20_000,
  });
}

export function useMasterList(sheet) {
  return useQuery({
    queryKey: ['master', sheet],
    queryFn: () => api.masterList(sheet),
    enabled: !!sheet,
    staleTime: 60_000,
  });
}

export function useBootstrap(clientVersion, unitCode) {
  return useQuery({
    queryKey: ['bootstrap', clientVersion, unitCode],
    queryFn: () => api.bootstrap(clientVersion, unitCode),
    staleTime: 60_000,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => api.config(),
    staleTime: 5 * 60_000,
  });
}

// ── MUTATIONS ─────────────────────────────────────────────────
export function useFlightMutations() {
  const qc = useQueryClient();
  const invalidate = (unitCode) => {
    qc.invalidateQueries({ queryKey: ['unitData', unitCode] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveFlight = useMutation({
    mutationFn: (data) => api.saveFlight(data),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  const updateFlight = useMutation({
    mutationFn: ({ rid, updates, unitCode }) => api.updateFlight(rid, updates),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  const deleteFlight = useMutation({
    mutationFn: ({ rid, unitCode }) => api.deleteFlight(rid),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  const updateStatus = useMutation({
    mutationFn: ({ rid, newStatus, unitCode }) => api.updateStatus(rid, newStatus),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  const validateFlight = useMutation({
    mutationFn: ({ rid, manualKurs, usePpn, usePph, unitCode }) =>
      api.validateFlight(rid, manualKurs, usePpn, usePph),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  const voidInvoice = useMutation({
    mutationFn: ({ rid, reason, unitCode }) => api.voidInvoice(rid, reason),
    onSuccess: (_d, vars) => invalidate(vars.unitCode),
  });

  return { saveFlight, updateFlight, deleteFlight, updateStatus, validateFlight, voidInvoice };
}

export function useMasterMutations() {
  const qc = useQueryClient();
  const invalidate = (sheet) => qc.invalidateQueries({ queryKey: ['master', sheet] });

  const save = useMutation({
    mutationFn: ({ sheet, data, rid }) => api.saveMasterItem(sheet, data, rid),
    onSuccess: (_d, vars) => invalidate(vars.sheet),
  });

  const remove = useMutation({
    mutationFn: ({ sheet, rid }) => api.deleteMasterItem(sheet, rid),
    onSuccess: (_d, vars) => invalidate(vars.sheet),
  });

  return { save, remove };
}