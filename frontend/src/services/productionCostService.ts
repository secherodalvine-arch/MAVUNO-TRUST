import apiClient from './apiClient';

export interface CostBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProductionCostMetrics {
  totalCost: number;
  costPerUnit: number;
  breakEvenPrice: number;
  estimatedRevenue: number | null;
  estimatedProfitLoss: number | null;
  costBreakdown?: CostBreakdownItem[]; // Added for breakdown
}

export interface ProductionCostRecord {
  _id?: string;
  cropName: string;
  expectedQuantity: number;
  quantityUnit: string;
  seedCost: number;
  fertilizerCost: number;
  labourCost: number;
  transportCost: number;
  storageCost: number;
  otherCost: number;
  expectedSellingPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionCostResponse {
  record: ProductionCostRecord;
  metrics: ProductionCostMetrics;
}

export const productionCostService = {
  /**
   * Get all cost records for the logged-in farmer
   */
  getMyRecords: async (): Promise<ProductionCostResponse[]> => {
    const response = await apiClient.get('/production-costs');
    return response.data.data;
  },

  /**
   * Get a specific record by ID
   */
  getRecordById: async (id: string): Promise<ProductionCostResponse> => {
    const response = await apiClient.get(`/production-costs/${id}`);
    return response.data.data;
  },

  /**
   * Create a new cost record
   */
  createRecord: async (data: ProductionCostRecord): Promise<ProductionCostResponse> => {
    const response = await apiClient.post('/production-costs', data);
    return response.data.data;
  },

  /**
   * Update an existing cost record
   */
  updateRecord: async (id: string, data: Partial<ProductionCostRecord>): Promise<ProductionCostResponse> => {
    const response = await apiClient.patch(`/production-costs/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a cost record
   */
  deleteRecord: async (id: string): Promise<void> => {
    await apiClient.delete(`/production-costs/${id}`);
  }
};
