'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Entity, Alert, Platform, SystemStats } from './types';

// System stats - polls every 10 seconds
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.stats,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

// Alerts - refetches every 30s, WebSocket fills gaps
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: api.alerts,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// Hotspots for map heatmap
export function useHotspots() {
  return useQuery({
    queryKey: ['hotspots'],
    queryFn: api.hotspots,
    staleTime: 30_000,
  });
}

// Entity list
export function useEntities(type?: string, limit = 100) {
  return useQuery({
    queryKey: ['entities', type, limit],
    queryFn: () => api.getVertices(type || 'Entity', limit),
    staleTime: 30_000,
  });
}

// Single entity dossier
export function useDossier(name: string) {
  return useQuery({
    queryKey: ['dossier', name],
    queryFn: () => api.dossier(name),
    enabled: !!name,
    staleTime: 60_000,
  });
}

// Country briefing
export function useBriefing(country: string) {
  return useQuery({
    queryKey: ['briefing', country],
    queryFn: () => api.briefing(country),
    enabled: !!country,
    staleTime: 300_000,
  });
}

// Platforms
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: api.platformStatus,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

// ISR Requirements
export function useISRRequirements() {
  return useQuery({
    queryKey: ['isr-requirements'],
    queryFn: api.isrRequirements,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

// Prediction mutation
export function usePredict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.predict(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Task a platform (ISR)
export function useTaskPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Record<string, unknown>) => api.taskPlatform(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['isr-requirements'] });
    },
  });
}
