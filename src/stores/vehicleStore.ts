import { create } from 'zustand';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types';
import { mockVehicles } from '@/mock/vehicles';

interface VehicleStore {
  vehicles: Vehicle[];
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  getIdleVehicles: () => Vehicle[];
  getVehiclesByType: (type: VehicleType) => Vehicle[];
  getVehiclesByCapacity: (minCapacity: number) => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: mockVehicles,

  updateVehicleStatus: (id, status) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, status } : v)),
    }));
  },

  updateVehicle: (id, updates) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));
  },

  getIdleVehicles: () => {
    return get().vehicles.filter((v) => v.status === 'idle');
  },

  getVehiclesByType: (type) => {
    return get().vehicles.filter((v) => v.vehicleType === type);
  },

  getVehiclesByCapacity: (minCapacity) => {
    return get().vehicles.filter((v) => v.capacity >= minCapacity);
  },

  getVehicleById: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },
}));
