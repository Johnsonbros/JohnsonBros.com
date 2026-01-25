export interface ServiceMapping {
  id: string;
  name: string;
  hcpServiceId: string;
  description: string;
  basePriceMin: number;
  basePriceMax: number;
  estimatedDuration: string;
  category: 'emergency' | 'drain' | 'water_heater' | 'general' | 'construction';
}

export const SERVICE_MAPPINGS: ServiceMapping[] = [
  {
    id: 'emergency_plumbing',
    name: 'Emergency Plumbing',
    hcpServiceId: 'svc_emergency',
    description: '24/7 emergency plumbing response',
    basePriceMin: 149,
    basePriceMax: 299,
    estimatedDuration: '1-2 hours',
    category: 'emergency',
  },
  {
    id: 'drain_cleaning',
    name: 'Drain Cleaning',
    hcpServiceId: 'svc_drain_cleaning',
    description: 'Professional drain clearing service',
    basePriceMin: 149,
    basePriceMax: 349,
    estimatedDuration: '1-2 hours',
    category: 'drain',
  },
  {
    id: 'main_line_clearing',
    name: 'Main Line Drain Clearing',
    hcpServiceId: 'svc_main_line',
    description: 'Main sewer line clearing with camera inspection',
    basePriceMin: 249,
    basePriceMax: 649,
    estimatedDuration: '2-3 hours',
    category: 'drain',
  },
  {
    id: 'water_heater_repair',
    name: 'Water Heater Repair',
    hcpServiceId: 'svc_water_heater_repair',
    description: 'Diagnose and repair water heater issues',
    basePriceMin: 149,
    basePriceMax: 399,
    estimatedDuration: '1-2 hours',
    category: 'water_heater',
  },
  {
    id: 'water_heater_replacement',
    name: 'Water Heater Replacement',
    hcpServiceId: 'svc_water_heater_install',
    description: 'Full water heater installation',
    basePriceMin: 2100,
    basePriceMax: 4500,
    estimatedDuration: '3-5 hours',
    category: 'water_heater',
  },
  {
    id: 'general_plumbing',
    name: 'General Plumbing Service',
    hcpServiceId: 'svc_general',
    description: 'General plumbing repairs and maintenance',
    basePriceMin: 99,
    basePriceMax: 299,
    estimatedDuration: '1-2 hours',
    category: 'general',
  },
  {
    id: 'pipe_repair',
    name: 'Pipe Repair',
    hcpServiceId: 'svc_pipe_repair',
    description: 'Leak repair and pipe replacement',
    basePriceMin: 199,
    basePriceMax: 799,
    estimatedDuration: '1-4 hours',
    category: 'general',
  },
  {
    id: 'fixture_installation',
    name: 'Fixture Installation',
    hcpServiceId: 'svc_fixture',
    description: 'Faucet, toilet, and fixture installation',
    basePriceMin: 149,
    basePriceMax: 399,
    estimatedDuration: '1-2 hours',
    category: 'general',
  },
  {
    id: 'sewer_line_service',
    name: 'Sewer Line Service',
    hcpServiceId: 'svc_sewer',
    description: 'Sewer line inspection and repair',
    basePriceMin: 299,
    basePriceMax: 899,
    estimatedDuration: '2-4 hours',
    category: 'drain',
  },
  {
    id: 'new_construction',
    name: 'New Construction Plumbing',
    hcpServiceId: 'svc_new_construction',
    description: 'Plumbing for new construction projects',
    basePriceMin: 2500,
    basePriceMax: 15000,
    estimatedDuration: 'Project-based',
    category: 'construction',
  },
];

export function getServiceById(serviceId: string): ServiceMapping | undefined {
  return SERVICE_MAPPINGS.find(s => s.id === serviceId);
}

export function getServiceByHcpId(hcpId: string): ServiceMapping | undefined {
  return SERVICE_MAPPINGS.find(s => s.hcpServiceId === hcpId);
}

export function getServicesByCategory(category: ServiceMapping['category']): ServiceMapping[] {
  return SERVICE_MAPPINGS.filter(s => s.category === category);
}

export function mapToHcpServiceId(serviceId: string): string | null {
  const service = getServiceById(serviceId);
  return service?.hcpServiceId || null;
}
