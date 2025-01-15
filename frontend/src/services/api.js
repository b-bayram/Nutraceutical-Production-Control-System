import axios from 'axios';
import { API_URL } from '../config';
import { PRODUCTION_STAGES } from '../constants';

export const productionAPI = {
  updateStage: async (productionId, newStage) => {
    try {
      const response = await axios.put(`${API_URL}/api/productions/${productionId}/stage`, {
        stage: newStage
      });
      return response.data;
    } catch (error) {
      console.error('Production stage update error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  startProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.PRODUCING);
  },
  
  completeProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.PRODUCED);
  },

  sendProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.SENT);
  },
  
  cancelProduction: async (productionId) => {
    return productionAPI.updateStage(productionId, PRODUCTION_STAGES.CANCELLED);
  }
}; 