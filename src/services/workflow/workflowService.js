import { createLiveWorkflowService } from './liveWorkflowService.js';

let liveService;

export const getWorkflowServices = () => {
  liveService ||= createLiveWorkflowService();
  return liveService;
};
