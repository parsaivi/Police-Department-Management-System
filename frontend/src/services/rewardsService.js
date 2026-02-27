import api from './api';

export const rewardsService = {
  getTips: (params = {}) => api.get('/rewards/tips/', { params }),
  getTip: (id) => api.get(`/rewards/tips/${id}/`),
  createTip: (data) => api.post('/rewards/tips/', data),
  officerReview: (tipId, { approved, notes }) =>
    api.post(`/rewards/tips/${tipId}/officer_review/`, { approved, notes: notes || '' }),
  detectiveReview: (tipId, { approved, notes }) =>
    api.post(`/rewards/tips/${tipId}/detective_review/`, { approved, notes: notes || '' }),
  getMyRewardCodes: () => api.get('/rewards/codes/'),
  lookupReward: (nationalId, rewardCode) =>
    api.post('/rewards/codes/lookup/', { national_id: nationalId, reward_code: rewardCode }),
  claimReward: (nationalId, rewardCode) =>
    api.post('/rewards/codes/claim/', { national_id: nationalId, reward_code: rewardCode }),
};

export default rewardsService;
