import { PRODUCTION_STAGES } from './constants';

export const getStatusClass = (stage) => {
  const classes = {
    [PRODUCTION_STAGES.PREPARATION]: 'bg-yellow-100 text-yellow-800',
    [PRODUCTION_STAGES.PRODUCING]: 'bg-blue-100 text-blue-800',
    [PRODUCTION_STAGES.PRODUCED]: 'bg-green-100 text-green-800',
    [PRODUCTION_STAGES.SENT]: 'bg-purple-100 text-purple-800',
    [PRODUCTION_STAGES.CANCELLED]: 'bg-red-100 text-red-800'
  };
  return classes[stage] || '';
}; 