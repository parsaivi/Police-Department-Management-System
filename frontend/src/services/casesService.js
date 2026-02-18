import api from './api';

export const casesService = {
  // List all cases
  getCases: (params = {}) => api.get('/cases/', { params }),
  
  // Get single case
  getCase: (id) => api.get(`/cases/${id}/`),
  
  // Create new case
  createCase: (caseData) => api.post('/cases/', caseData),
  
  // Create case from crime scene
  createFromCrimeScene: (caseData) => api.post('/cases/from_crime_scene/', caseData),
  
  // Update case
  updateCase: (id, caseData) => api.put(`/cases/${id}/`, caseData),
  
  // Get detective board
  getDetectiveBoard: (id) => api.get(`/cases/${id}/detective_board/`),
  
  // Update detective board
  updateDetectiveBoard: (id, boardData) => api.put(`/cases/${id}/detective_board/`, boardData),
  
  // Start investigation
  startInvestigation: (id) => api.post(`/cases/${id}/start_investigation/`),
  
  // Identify suspects
  identifySuspect: (id, suspectData) => api.post(`/cases/${id}/identify_suspect/`, suspectData),
  
  // Start interrogation
  startInterrogation: (id) => api.post(`/cases/${id}/start_interrogation/`),
  
  // Submit to captain
  submitToCaptain: (id) => api.post(`/cases/${id}/submit_to_captain/`),
  
  // Send to trial
  sendToTrial: (id, trialData) => api.post(`/cases/${id}/send_to_trial/`, trialData),
  
  // Close as solved
  closeSolved: (id) => api.post(`/cases/${id}/close_solved/`),
  
  // Close as unsolved
  closeUnsolved: (id) => api.post(`/cases/${id}/close_unsolved/`),
};

export default casesService;
