import { createLiveWorkflowService } from './liveWorkflowService.js';
import { createPreviewWorkflowService } from '../../dev/workflowPreviewService.js';

let liveService;
let previewService;

export const getWorkflowServices = ({ mode = 'live' } = {}) => {
  if (mode === 'preview') {
    previewService ||= createPreviewWorkflowService();
    return previewService;
  }
  liveService ||= createLiveWorkflowService();
  return liveService;
};
