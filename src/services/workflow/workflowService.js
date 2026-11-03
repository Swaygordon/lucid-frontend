// @backend-handoff-delete Preview adapter selection: replace with backend service wiring.
import { createLiveWorkflowService } from './liveWorkflowService.js';
import { createMockWorkflowService } from '../../dev/workflow-mock/service.js';

let liveService;
let previewService;

export const getWorkflowServices = ({ mode = 'live' } = {}) => {
  if (mode === 'preview' && import.meta.env.DEV) {
    previewService ||= createMockWorkflowService();
    return previewService;
  }
  liveService ||= createLiveWorkflowService();
  return liveService;
};
