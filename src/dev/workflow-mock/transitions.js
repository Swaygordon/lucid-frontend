// @backend-handoff-delete Client-side sample workflow transition rules; replace with server-authoritative rules.
const clone = value => JSON.parse(JSON.stringify(value));

const failure = (caseRecord, code, message) => ({
  caseRecord: clone(caseRecord),
  error: { code, message },
});

const eventLabel = action => ({
  amend_request: 'Admin proposed changes to the request',
  accept_request_amendment: 'Client accepted the proposed request changes',
  reject_request_amendment: 'Client declined the proposed request changes',
  assign_inspector: 'Inspector assigned to the request',
  schedule_inspection: 'Inspector scheduled a site visit',
  record_inspection: 'Inspector submitted assessment',
  mark_not_feasible: 'LUCID closed a request as not feasible',
  schedule_provider_visit: 'Provider updated the work schedule',
  accept_offer: 'Provider accepted the assignment',
  decline_offer: 'Provider declined the assignment',
  submit_work_estimate: 'Provider submitted a work estimate',
  approve_work_estimate: 'Client approved the work and estimate',
  request_work_estimate_revision: 'Client requested an estimate revision',
  start_work: 'Provider started work',
  request_price_change: 'Provider requested approval for additional work',
  initiate_payment: 'Inspector confirmed satisfaction and initiated billing',
  submit_bill: 'Provider submitted the final work bill',
  approve_bill: 'Client approved the bill for payment',
  reject_bill: 'Client requested a bill revision',
}[action] || action.replaceAll('_', ' '));

const recordEvent = (caseRecord, role, action, at, details) => {
  caseRecord.history = [
    ...(Array.isArray(caseRecord.history) ? caseRecord.history : []),
    { id: `${caseRecord.id}-${caseRecord.history?.length || 0}`, actorRole: role, action, label: action === 'assign_inspector' && details?.previousInspectorId ? 'Admin reassigned the request to another Inspector' : eventLabel(action), at, ...(details ? { details: clone(details) } : {}) },
  ];
};

const roleCan = (role, action) => ({
  provider: ['accept_offer', 'decline_offer', 'submit_work_estimate', 'schedule_provider_visit', 'start_work', 'request_price_change', 'submit_bill'],
  client: ['approve_work_estimate', 'request_work_estimate_revision', 'approve_price_change', 'reject_price_change', 'provide_information', 'approve_bill', 'reject_bill', 'cancel_case', 'pay_cancellation_fee', 'raise_dispute', 'request_refund', 'accept_request_amendment', 'reject_request_amendment', 'leave_review'],
  inspector: ['schedule_inspection', 'record_inspection', 'initiate_payment'],
  admin: ['request_information', 'amend_request', 'assign_inspector', 'confirm_scope', 'mark_not_feasible', 'offer_provider', 'resolve_dispute', 'decide_refund', 'confirm_delayed_payment', 'set_commission_rate'],
  system: ['payment_result'],
}[role] || []).includes(action);

export const applyWorkflowAction = (caseRecord, { role, action, payload = {}, at = new Date().toISOString() }) => {
  if (!caseRecord || typeof caseRecord !== 'object' || !roleCan(role, action)) {
    return failure(caseRecord || {}, 'ROLE_NOT_ALLOWED', 'This role cannot perform that workflow action.');
  }

  const next = clone(caseRecord);
  const reject = (code, message) => failure(caseRecord, code, message);

  switch (action) {
    case 'accept_offer':
      if (role !== 'provider' || next.status !== 'offer_sent') return reject('OFFER_NOT_AVAILABLE', 'This offer is no longer available.');
      next.status = 'accepted';
      next.providerAcceptedAt = at;
      break;

    case 'decline_offer':
      if (next.status !== 'offer_sent') return reject('OFFER_NOT_AVAILABLE', 'This offer is no longer available.');
      if (!String(payload.reason || '').trim()) return reject('DECLINE_REASON_REQUIRED', 'Add a short reason so LUCID can reassign the request appropriately.');
      next.status = 'provider_declined';
      next.providerDeclineReason = String(payload.reason).trim().slice(0, 1000);
      break;

    case 'schedule_provider_visit': {
      if (!['accepted', 'work_in_progress'].includes(next.status) || !next.providerAcceptedAt) return reject('PROVIDER_VISIT_NOT_AVAILABLE', 'Accept the offer before scheduling a Provider work visit.');
      const scheduledAt = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) return reject('INVALID_PROVIDER_VISIT', 'Choose a future date and time for the Provider work visit.');
      next.providerVisit = { scheduledAt: scheduledAt.toISOString(), notes: String(payload.notes || '').trim().slice(0, 500), updatedAt: at };
      break;
    }

    case 'start_work':
      if (!next.providerAcceptedAt || next.status !== 'accepted') {
        return reject('PROVIDER_ACCEPTANCE_REQUIRED', 'The Provider must accept the offer in the app before work starts.');
      }
      if (!next.approvedWorkEstimate) return reject('WORK_ESTIMATE_APPROVAL_REQUIRED', 'The Client must approve the work estimate before work starts.');
      if (next.pendingPriceChange) return reject('PRICE_CHANGE_APPROVAL_REQUIRED', 'Work is paused until the Client approves the price change.');
      next.status = 'work_in_progress';
      next.workStartedAt = at;
      break;

    case 'submit_work_estimate': {
      if (!['accepted', 'estimate_revision_requested'].includes(next.status)) return reject('ESTIMATE_NOT_AVAILABLE', 'An accepted assignment must be awaiting an estimate or revision.');
      const amount = Number(payload.amount);
      const scope = String(payload.scope || '').trim();
      if (!Number.isFinite(amount) || amount <= 0) return reject('INVALID_WORK_ESTIMATE', 'Enter an estimate greater than zero.');
      if (!scope) return reject('ESTIMATE_SCOPE_REQUIRED', 'Describe the work covered by this estimate.');
      const history = Array.isArray(next.workEstimateHistory) ? next.workEstimateHistory : [];
      const estimate = { version: history.length + 1, amount, scope: scope.slice(0, 2000), submittedAt: at, status: 'pending' };
      next.workEstimateHistory = [...history, estimate];
      next.pendingWorkEstimate = estimate;
      next.estimateRevisionRequest = null;
      next.status = 'work_estimate_pending';
      break;
    }

    case 'approve_work_estimate':
      if (role !== 'client' || next.status !== 'work_estimate_pending' || !next.pendingWorkEstimate) return reject('ESTIMATE_NOT_READY', 'There is no Provider estimate awaiting your approval.');
      next.approvedWorkEstimate = { ...next.pendingWorkEstimate, status: 'approved', approvedAt: at };
      next.workEstimateHistory = (next.workEstimateHistory || []).map(item => item.version === next.pendingWorkEstimate.version ? next.approvedWorkEstimate : item);
      next.pendingWorkEstimate = null;
      next.status = 'accepted';
      break;

    case 'request_work_estimate_revision': {
      if (role !== 'client' || next.status !== 'work_estimate_pending' || !next.pendingWorkEstimate) return reject('ESTIMATE_NOT_READY', 'There is no Provider estimate awaiting your response.');
      const reason = String(payload.reason || '').trim();
      if (!reason) return reject('ESTIMATE_REVISION_REASON_REQUIRED', 'Tell the Provider what needs to be clarified or changed.');
      next.estimateRevisionRequest = { reason: reason.slice(0, 1000), requestedAt: at, version: next.pendingWorkEstimate.version };
      next.workEstimateHistory = (next.workEstimateHistory || []).map(item => item.version === next.pendingWorkEstimate.version ? { ...item, status: 'revision_requested', clientDecisionReason: reason.slice(0, 1000), decidedAt: at } : item);
      next.pendingWorkEstimate = null;
      next.status = 'estimate_revision_requested';
      break;
    }

    case 'request_price_change': {
      if (next.status !== 'work_in_progress') return reject('WORK_NOT_IN_PROGRESS', 'A price change can only be requested during active work.');
      if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0) return reject('INVALID_PRICE_CHANGE', 'Enter a valid revised price.');
      const reason = String(payload.reason || '').trim();
      const scope = String(payload.scope || '').trim();
      if (!scope) return reject('CHANGE_ORDER_SCOPE_REQUIRED', 'Describe the additional work before requesting approval.');
      if (!reason) return reject('PRICE_CHANGE_REASON_REQUIRED', 'Explain why the additional work is needed.');
      next.pendingPriceChange = { id: `${next.id}-change-${(next.changeOrders || []).length + 1}`, amount: Number(payload.amount), scope: scope.slice(0, 2000), reason: reason.slice(0, 1000), requestedAt: at, status: 'pending' };
      next.status = 'price_change_pending';
      break;
    }

    case 'approve_price_change':
      if (next.status !== 'price_change_pending' || !next.pendingPriceChange) return reject('NO_PENDING_PRICE_CHANGE', 'There is no price change awaiting approval.');
      {
        const approvedChange = { ...next.pendingPriceChange, approvedAt: at, approved: true, status: 'approved' };
        next.changeOrders = [...(next.changeOrders || []), approvedChange];
        next.approvedWorkAmount = Number(next.approvedWorkEstimate?.amount || 0) + next.changeOrders.reduce((sum, item) => sum + (item.status === 'approved' ? Number(item.amount) || 0 : 0), 0);
      }
      next.pendingPriceChange = null;
      next.status = 'work_in_progress';
      break;

    case 'reject_price_change':
      if (next.status !== 'price_change_pending' || !next.pendingPriceChange) return reject('NO_PENDING_PRICE_CHANGE', 'There is no price change awaiting approval.');
      next.changeOrders = [...(next.changeOrders || []), { ...next.pendingPriceChange, approved: false, status: 'declined', declinedAt: at }];
      next.pendingPriceChange = null;
      next.status = 'work_in_progress';
      next.lastPriceChangeRejectedAt = at;
      break;

    case 'submit_bill': {
      if (next.status === 'price_change_pending' || next.pendingPriceChange) return reject('PRICE_CHANGE_APPROVAL_REQUIRED', 'Work and billing are paused until the Client approves or rejects the price change.');
      if (!['awaiting_provider_bill', 'bill_rejected'].includes(next.status) || !next.clientSatisfied) return reject('PAYMENT_NOT_INITIATED', 'The Inspector must confirm the Client is satisfied and initiate billing before a Provider can submit a charge.');
      const providerAmount = Number(payload.amount);
      if (!Number.isFinite(providerAmount) || providerAmount < 0) return reject('INVALID_BILL_AMOUNT', 'Enter a valid Provider work amount.');
      const approvedAmount = Number(next.approvedWorkAmount ?? next.approvedWorkEstimate?.amount);
      if (Number.isFinite(approvedAmount) && approvedAmount > 0 && providerAmount > approvedAmount) return reject('BILL_EXCEEDS_APPROVED_AMOUNT', 'The bill is higher than the approved work amount. Request approval for the additional work before submitting it.');
      const clientPurchasedMaterialsAmount = Math.max(0, Number(payload.clientPurchasedMaterialsAmount) || 0);
      const commissionRate = Math.max(0, Number(next.commissionRate) || 0);
      const commissionAmount = Math.round(providerAmount * commissionRate) / 100;
      const inspectorRate = Math.max(0, Number(next.inspectorRate ?? 10) || 0);
      const inspectorAmount = Math.round(providerAmount * inspectorRate) / 100;
      const version = (next.providerBillHistory || []).length + 1;
      next.providerBill = {
        version,
        providerAmount,
        clientPurchasedMaterialsAmount,
        inspectorRate,
        inspectorAmount,
        commissionRate,
        commissionAmount,
        payableAmount: providerAmount + inspectorAmount + commissionAmount,
        note: String(payload.note || '').trim(),
        submittedAt: at,
        status: 'submitted',
      };
      next.providerBillHistory = [...(next.providerBillHistory || []), next.providerBill];
      next.billRejection = null;
      next.status = 'awaiting_client_approval';
      break;
    }

    case 'initiate_payment':
      if (role !== 'inspector' || next.status !== 'work_in_progress') return reject('WORK_NOT_READY', 'The Inspector can initiate billing after assigned work is in progress.');
      if (payload.clientSatisfied !== true) return reject('CLIENT_SATISFACTION_REQUIRED', 'Confirm that the Client has said the completed work is satisfactory before initiating payment.');
      next.clientSatisfied = true;
      next.paymentInitiatedAt = at;
      next.status = 'awaiting_provider_bill';
      break;

    case 'approve_bill':
      if (role !== 'client' || next.status !== 'awaiting_client_approval' || !next.providerBill || !next.clientSatisfied) return reject('BILL_NOT_READY', 'A Provider bill must be submitted after the Inspector initiates payment before it can be accepted.');
      next.providerBill = { ...next.providerBill, status: 'approved_for_payment', clientApprovedAt: at };
      next.providerBillHistory = (next.providerBillHistory || []).map(item => item.version === next.providerBill.version ? next.providerBill : item);
      next.clientPaymentAcceptedAt = at;
      next.status = 'awaiting_payment';
      break;

    case 'reject_bill': {
      if (role !== 'client' || next.status !== 'awaiting_client_approval' || !next.providerBill) return reject('BILL_NOT_READY', 'There is no itemized Provider bill awaiting a decision.');
      const rejectionReason = String(payload.reason || '').trim();
      if (!rejectionReason) return reject('BILL_REJECTION_REASON_REQUIRED', 'Tell LUCID what needs to be clarified or changed.');
      next.providerBill = { ...next.providerBill, status: 'revision_requested', clientDecisionReason: rejectionReason.slice(0, 1000), clientDecidedAt: at };
      next.providerBillHistory = (next.providerBillHistory || []).map(item => item.version === next.providerBill.version ? next.providerBill : item);
      next.billRejection = { reason: rejectionReason.slice(0, 1000), rejectedAt: at, billVersion: next.providerBill.version };
      next.status = 'bill_rejected';
      break;
    }

    case 'payment_result': {
      if (!['awaiting_payment', 'payment_delayed', 'payment_failed'].includes(next.status) || !next.clientPaymentAcceptedAt || !next.clientSatisfied || !next.providerBill) return reject('PAYMENT_NOT_READY', 'Client acceptance and a submitted bill are required before payment.');
      if (!['confirmed', 'delayed', 'failed'].includes(payload.outcome)) return reject('INVALID_PAYMENT_OUTCOME', 'Choose a supported simulated payment outcome.');
      next.paymentStatus = payload.outcome;
      if (payload.outcome === 'confirmed') {
        next.status = 'completed';
        next.completedAt = at;
        next.providerPayoutStatus = 'released';
        next.providerPayoutAmount = next.providerBill.providerAmount;
        next.commissionAmount = next.providerBill.commissionAmount;
        next.paymentReference = payload.reference || `PREVIEW-${next.id}-${Date.now()}`;
        next.providerBill = { ...next.providerBill, status: 'paid', paidAt: at, paymentReference: next.paymentReference };
        next.providerBillHistory = (next.providerBillHistory || []).map(item => item.version === next.providerBill.version ? next.providerBill : item);
      } else {
        next.status = payload.outcome === 'delayed' ? 'payment_delayed' : 'payment_failed';
        next.providerPayoutStatus = 'not_released';
      }
      break;
    }

    case 'leave_review': {
      if (next.status !== 'completed' || next.paymentStatus !== 'confirmed' || next.review) return reject('REVIEW_NOT_AVAILABLE', 'A review is available once after a paid service is completed.');
      const rating = Number(payload.rating);
      const comment = String(payload.comment || '').trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return reject('INVALID_REVIEW_RATING', 'Choose a rating from 1 to 5 stars.');
      if (comment.length > 1200) return reject('REVIEW_TOO_LONG', 'Keep the review under 1,200 characters.');
      next.review = { rating, comment, submittedAt: at };
      break;
    }

    case 'cancel_case':
      if (['completed', 'cancelled'].includes(next.status)) return reject('CASE_CLOSED', 'This case is already closed.');
      next.cancellationFeeDue = next.assignedProviderId || next.providerAcceptedAt ? Math.max(0, Number(payload.feeAmount) || 0) : 0;
      next.status = next.cancellationFeeDue > 0 ? 'cancelled_fee_due' : 'cancelled';
      next.featuresBlocked = next.cancellationFeeDue > 0;
      next.cancelledAt = at;
      break;

    case 'pay_cancellation_fee':
      if (next.status !== 'cancelled_fee_due' || !next.featuresBlocked || Number(next.cancellationFeeDue) <= 0) return reject('NO_FEE_RECOVERY_DUE', 'There is no cancellation fee awaiting recovery.');
      next.cancellationFeePaid = true;
      next.featuresBlocked = false;
      next.cancellationFeePaidAt = at;
      next.status = 'cancelled';
      break;

    case 'schedule_inspection': {
      if (next.status !== 'inspector_assigned' && next.status !== 'inspection_scheduled') return reject('INSPECTION_NOT_ASSIGNED', 'This case is not assigned for inspection.');
      const scheduledAt = new Date(payload.scheduledAt).getTime();
      if (!Number.isFinite(scheduledAt) || scheduledAt <= new Date(at).getTime()) return reject('INVALID_INSPECTION_SCHEDULE', 'Choose a future date and time for the site visit.');
      next.inspectionVisit = {
        ...(next.inspectionVisit || {}),
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: String(payload.notes || '').trim(),
        updatedAt: at,
      };
      next.status = 'inspection_scheduled';
      break;
    }

    case 'record_inspection': {
      if (!['inspector_assigned', 'inspection_scheduled'].includes(next.status)) return reject('INSPECTION_NOT_ASSIGNED', 'This case is not assigned for inspection.');
      const findings = String(payload.findings || '').trim();
      const scope = String(payload.scope || '').trim();
      const feasibility = String(payload.feasibility || 'feasible');
      const feasibilityNotes = String(payload.feasibilityNotes || '').trim();
      const safetyStatus = String(payload.safetyStatus || 'no_known_concern');
      const safetyNotes = String(payload.safetyNotes || '').trim();
      if (!findings) return reject('INSPECTION_FINDINGS_REQUIRED', 'Add assessment findings before submitting the inspection.');
      if (!['feasible', 'feasible_with_conditions', 'not_feasible'].includes(feasibility)) return reject('FEASIBILITY_REQUIRED', 'Choose whether the request is feasible.');
      if (feasibility !== 'feasible' && !feasibilityNotes) return reject('FEASIBILITY_NOTES_REQUIRED', 'Explain the conditions or reason the request is not feasible.');
      if (feasibility !== 'not_feasible' && !scope) return reject('SCOPE_REQUIRED', 'Add the proposed work scope for a feasible request.');
      if (!['no_known_concern', 'precautions_required', 'unsafe_stop'].includes(safetyStatus)) return reject('SAFETY_STATUS_REQUIRED', 'Record the site safety status.');
      if (safetyStatus !== 'no_known_concern' && !safetyNotes) return reject('SAFETY_NOTES_REQUIRED', 'Describe the required precautions or unsafe condition.');
      const evidence = Array.isArray(payload.evidence) ? payload.evidence.slice(0, 6).map(item => ({
        name: String(item.name || '').slice(0, 180),
        type: String(item.type || '').slice(0, 100),
        size: Math.max(0, Number(item.size) || 0),
      })).filter(item => item.name) : [];
      if (evidence.some(item => item.size > 10 * 1024 * 1024)) return reject('EVIDENCE_TOO_LARGE', 'Each evidence file must be 10 MB or smaller.');
      next.inspection = {
        findings,
        scope,
        feasibility,
        feasibilityNotes,
        safetyStatus,
        safetyNotes,
        checklist: Array.isArray(payload.checklist) ? payload.checklist.map(item => String(item)).slice(0, 12) : [],
        evidence,
        submittedAt: at,
      };
      next.status = 'inspection_reported';
      break;
    }

    case 'mark_not_feasible': {
      if (next.status !== 'inspection_reported' || next.inspection?.feasibility !== 'not_feasible') return reject('NOT_FEASIBLE_REPORT_REQUIRED', 'Review a submitted not-feasible assessment before closing the request.');
      const reason = String(payload.reason || '').trim();
      if (!reason) return reject('CLOSURE_REASON_REQUIRED', 'Explain why LUCID is closing this request as not feasible.');
      next.status = 'not_feasible';
      next.closedReason = reason;
      next.closedAt = at;
      break;
    }

    case 'assign_inspector': {
      if (next.status !== 'submitted' && !(next.status === 'inspector_assigned' && payload.isReassignment && payload.previousUnavailable)) return reject('INSPECTOR_ASSIGNMENT_NOT_AVAILABLE', 'An Inspector can only be assigned to a submitted request or replace an unavailable assigned Inspector.');
      if (!String(payload.inspectorId || '').trim()) return reject('INSPECTOR_REQUIRED', 'Select an Inspector before assigning the case.');
      if (next.requestAmendment?.status === 'pending') return reject('CLIENT_ACKNOWLEDGEMENT_REQUIRED', 'Wait for the Client to accept or decline the proposed request changes before assigning an Inspector.');
      if (!String(payload.inspectorId).startsWith('demo-inspector')) return reject('INSPECTOR_NOT_AVAILABLE', 'This Inspector is not available in the shared preview account set.');
      if (payload.isReassignment && !String(payload.reassignmentReason || '').trim()) return reject('REASSIGNMENT_REASON_REQUIRED', 'Explain why the assigned Inspector needs to be replaced.');
      const previousInspectorName = next.inspectorAssignment?.inspectorName || '';
      next.assignedInspectorId = String(payload.inspectorId).trim();
      next.inspectorAssignment = {
        inspectorName: String(payload.inspectorName || 'Inspector'),
        distanceKm: Number(payload.distanceKm) || 0,
        searchRadiusKm: Number(payload.searchRadiusKm) || 25,
        overrideReason: String(payload.overrideReason || '').trim(),
        assignedAt: at,
      };
      if (payload.isReassignment) next.lastInspectorReassignment = { previousInspectorId: payload.previousInspectorId, previousInspectorName, reason: String(payload.reassignmentReason).trim(), reassignedAt: at };
      next.status = 'inspector_assigned';
      break;
    }

    case 'amend_request': {
      if (!['submitted', 'needs_information'].includes(next.status)) return reject('REQUEST_NOT_EDITABLE', 'Request details can only be amended before an Inspector is assigned.');
      if (next.requestAmendment?.status === 'pending') return reject('AMENDMENT_ALREADY_PENDING', 'A proposed change is already waiting for the Client.');
      const proposed = payload.patch && typeof payload.patch === 'object' ? payload.patch : {};
      const allowed = ['description', 'scope', 'urgency', 'preferredDate', 'preferredTime', 'alternateDate', 'alternateTime', 'locationSummary'];
      const patch = Object.fromEntries(Object.entries(proposed).filter(([key, value]) => allowed.includes(key) && value !== undefined));
      if (!Object.keys(patch).length) return reject('AMENDMENT_EMPTY', 'Make at least one request change before sending it to the Client.');
      const reason = String(payload.reason || '').trim();
      if (!reason) return reject('AMENDMENT_REASON_REQUIRED', 'Explain why this request change is needed.');
      const original = Object.fromEntries(Object.keys(patch).map(key => [key, next[key] ?? '']));
      next.requestAmendment = { original, proposed: patch, reason, status: 'pending', requestedAt: at };
      break;
    }

    case 'accept_request_amendment':
      if (!next.requestAmendment || next.requestAmendment.status !== 'pending') return reject('NO_PENDING_AMENDMENT', 'There is no proposed request change waiting for your response.');
      Object.assign(next, clone(next.requestAmendment.proposed));
      next.requestAmendment = { ...next.requestAmendment, status: 'accepted', acknowledgedAt: at };
      if (next.status === 'needs_information') next.status = 'submitted';
      break;

    case 'reject_request_amendment':
      if (!next.requestAmendment || next.requestAmendment.status !== 'pending') return reject('NO_PENDING_AMENDMENT', 'There is no proposed request change waiting for your response.');
      next.requestAmendment = { ...next.requestAmendment, status: 'declined', acknowledgedAt: at, clientReason: String(payload.reason || '').trim() };
      break;

    case 'offer_provider':
      if (!['scope_confirmed', 'provider_declined'].includes(next.status)) return reject('SCOPE_NOT_CONFIRMED', 'Inspection and scope confirmation are required before a Provider offer.');
      if (!String(payload.providerId || '').trim()) return reject('PROVIDER_REQUIRED', 'Select a Provider before sending the offer.');
      next.assignedProviderId = String(payload.providerId).trim();
      next.providerAssignment = {
        providerName: String(payload.providerName || 'Preview Provider'),
        adminName: String(payload.adminName || 'LUCID Admin/HR'),
        distanceKm: Number(payload.distanceKm) || 0,
        searchRadiusKm: 25,
        overrideReason: String(payload.overrideReason || '').trim(),
        assignedAt: at,
      };
      next.status = 'offer_sent';
      break;

    case 'confirm_scope':
      if (next.status !== 'inspection_reported') return reject('INSPECTION_REQUIRED', 'An inspection report is required before scope confirmation.');
      if (next.inspection?.feasibility === 'not_feasible') return reject('REQUEST_NOT_FEASIBLE', 'A not-feasible assessment cannot proceed to Provider assignment.');
      next.confirmedScope = String(payload.scope || '').trim();
      if (!next.confirmedScope) return reject('SCOPE_REQUIRED', 'Enter the confirmed scope before continuing.');
      next.status = 'scope_confirmed';
      break;

    case 'request_information':
      if (!['submitted', 'needs_information'].includes(next.status)) return reject('INFORMATION_REQUEST_NOT_AVAILABLE', 'Additional information can only be requested on a submitted request.');
      if (!String(payload.message || '').trim()) return reject('INFORMATION_REQUEST_REQUIRED', 'Enter the information the Client needs to provide.');
      next.status = 'needs_information';
      next.informationRequest = String(payload.message || '').trim();
      break;

    case 'provide_information':
      if (next.status !== 'needs_information') return reject('INFORMATION_NOT_REQUESTED', 'This case is not waiting for additional Client information.');
      next.clientInformation = String(payload.message || '').trim();
      next.status = 'submitted';
      break;

    case 'raise_dispute':
      if (!['awaiting_client_approval', 'awaiting_payment'].includes(next.status)) return reject('BILL_NOT_READY', 'A dispute can only be opened on a submitted bill.');
      next.dispute = { reason: String(payload.reason || '').trim(), status: 'pending', openedAt: at };
      next.status = 'disputed';
      break;

    case 'request_refund':
      if (next.paymentStatus !== 'confirmed') return reject('PAYMENT_NOT_CONFIRMED', 'A refund request requires a confirmed payment.');
      next.refundRequest = { reason: String(payload.reason || '').trim(), status: 'pending', openedAt: at };
      next.status = 'refund_pending';
      break;

    case 'resolve_dispute':
      if (next.status !== 'disputed' || !next.dispute) return reject('NO_PENDING_DISPUTE', 'There is no dispute awaiting a decision.');
      next.dispute = { ...next.dispute, status: payload.decision, decision: String(payload.reason || '').trim(), decidedAt: at };
      next.status = payload.decision === 'resolved' ? 'awaiting_client_approval' : 'dispute_rejected';
      break;

    case 'decide_refund':
      if (!next.refundRequest || next.refundRequest.status !== 'pending') return reject('NO_PENDING_REFUND', 'There is no refund awaiting a decision.');
      next.refundRequest = { ...next.refundRequest, status: payload.decision, decision: String(payload.reason || '').trim(), decidedAt: at };
      next.status = payload.decision === 'approved' ? 'refund_approved' : 'paid';
      break;

    case 'set_commission_rate': {
      const rate = Number(payload.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return reject('INVALID_COMMISSION_RATE', 'Enter a placeholder rate from 0 to 100 percent.');
      next.commissionRate = rate;
      if (next.providerBill) {
        const commissionAmount = Math.round(next.providerBill.providerAmount * rate) / 100;
        next.providerBill = { ...next.providerBill, commissionRate: rate, commissionAmount, payableAmount: next.providerBill.providerAmount + (next.providerBill.inspectorAmount || 0) + commissionAmount };
      }
      break;
    }

    case 'confirm_delayed_payment':
      if (next.paymentStatus !== 'delayed') return reject('PAYMENT_NOT_DELAYED', 'Only a delayed payment can be confirmed by Admin.');
      next.paymentStatus = 'confirmed';
      next.status = 'completed';
      next.completedAt = at;
      next.providerPayoutStatus = 'released';
      next.providerPayoutAmount = next.providerBill?.providerAmount || 0;
      next.commissionAmount = next.providerBill?.commissionAmount || 0;
      next.paymentReference = next.paymentReference || `PREVIEW-${next.id}-${Date.now()}`;
      next.providerBill = { ...next.providerBill, status: 'paid', paidAt: at, paymentReference: next.paymentReference };
      next.providerBillHistory = (next.providerBillHistory || []).map(item => item.version === next.providerBill.version ? next.providerBill : item);
      break;

    default:
      return reject('ACTION_NOT_SUPPORTED', 'This workflow action is not supported.');
  }

  const eventDetails = action === 'decline_offer'
    ? { reason: next.providerDeclineReason }
    : action === 'submit_work_estimate'
      ? { amount: next.pendingWorkEstimate?.amount, version: next.pendingWorkEstimate?.version, scope: next.pendingWorkEstimate?.scope }
      : action === 'approve_work_estimate'
        ? { amount: next.approvedWorkEstimate?.amount, version: next.approvedWorkEstimate?.version }
        : action === 'request_work_estimate_revision'
          ? { reason: next.estimateRevisionRequest?.reason, version: next.estimateRevisionRequest?.version }
    : action === 'request_price_change'
      ? { amount: next.pendingPriceChange?.amount, reason: next.pendingPriceChange?.reason, scope: next.pendingPriceChange?.scope }
      : action === 'approve_price_change' || action === 'reject_price_change'
        ? { amount: next.changeOrders?.at(-1)?.amount, scope: next.changeOrders?.at(-1)?.scope, reason: next.changeOrders?.at(-1)?.reason }
      : action === 'submit_bill'
        ? { providerAmount: next.providerBill?.providerAmount, inspectorAmount: next.providerBill?.inspectorAmount, platformAmount: next.providerBill?.commissionAmount }
        : action === 'reject_bill'
          ? { reason: next.billRejection?.reason }
          : action === 'approve_bill'
            ? { acceptedAt: next.clientPaymentAcceptedAt }
            : action === 'initiate_payment'
              ? { clientSatisfied: next.clientSatisfied }
  : action === 'amend_request'
    ? { reason: String(payload.reason || '').trim(), fields: Object.keys(payload.patch || {}) }
      : action === 'assign_inspector'
      ? { inspectorName: next.inspectorAssignment.inspectorName, distanceKm: next.inspectorAssignment.distanceKm, overrideReason: next.inspectorAssignment.overrideReason, ...(payload.isReassignment ? { previousInspectorId: payload.previousInspectorId, previousInspectorName: next.lastInspectorReassignment?.previousInspectorName, reason: next.lastInspectorReassignment?.reason } : {}) }
      : action === 'schedule_inspection'
        ? { scheduledAt: next.inspectionVisit.scheduledAt }
      : action === 'schedule_provider_visit'
        ? { scheduledAt: next.providerVisit.scheduledAt }
        : action === 'record_inspection'
          ? { feasibility: next.inspection.feasibility, safetyStatus: next.inspection.safetyStatus }
          : action === 'mark_not_feasible'
            ? { reason: next.closedReason }
      : action === 'offer_provider'
        ? { providerName: next.providerAssignment.providerName, distanceKm: next.providerAssignment.distanceKm, overrideReason: next.providerAssignment.overrideReason }
      : action === 'accept_request_amendment' || action === 'reject_request_amendment'
        ? { amendmentStatus: next.requestAmendment?.status, clientReason: next.requestAmendment?.clientReason }
        : null;
  recordEvent(next, role, action, at, eventDetails);
  return { caseRecord: next, error: null };
};
