const clone = value => JSON.parse(JSON.stringify(value));

const failure = (caseRecord, code, message) => ({
  caseRecord: clone(caseRecord),
  error: { code, message },
});

const eventLabel = action => action.replaceAll('_', ' ');

const recordEvent = (caseRecord, role, action, at) => {
  caseRecord.history = [
    ...(Array.isArray(caseRecord.history) ? caseRecord.history : []),
    { id: `${caseRecord.id}-${caseRecord.history?.length || 0}`, actorRole: role, action, label: eventLabel(action), at },
  ];
};

const roleCan = (role, action) => ({
  provider: ['accept_offer', 'decline_offer', 'start_work', 'request_price_change', 'submit_bill'],
  client: ['approve_price_change', 'reject_price_change', 'provide_information', 'confirm_satisfaction', 'cancel_case', 'pay_cancellation_fee', 'raise_dispute', 'request_refund'],
  inspector: ['record_inspection', 'complete_case'],
  admin: ['request_information', 'assign_inspector', 'confirm_scope', 'offer_provider', 'resolve_dispute', 'decide_refund', 'confirm_delayed_payment', 'set_commission_rate'],
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
      next.status = 'provider_declined';
      break;

    case 'start_work':
      if (!next.providerAcceptedAt || next.status !== 'accepted') {
        return reject('PROVIDER_ACCEPTANCE_REQUIRED', 'The Provider must accept the offer in the app before work starts.');
      }
      if (next.pendingPriceChange) return reject('PRICE_CHANGE_APPROVAL_REQUIRED', 'Work is paused until the Client approves the price change.');
      next.status = 'work_in_progress';
      next.workStartedAt = at;
      break;

    case 'request_price_change':
      if (next.status !== 'work_in_progress') return reject('WORK_NOT_IN_PROGRESS', 'A price change can only be requested during active work.');
      if (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0) return reject('INVALID_PRICE_CHANGE', 'Enter a valid revised price.');
      next.pendingPriceChange = { amount: Number(payload.amount), reason: String(payload.reason || '').trim(), requestedAt: at };
      next.status = 'price_change_pending';
      break;

    case 'approve_price_change':
      if (next.status !== 'price_change_pending' || !next.pendingPriceChange) return reject('NO_PENDING_PRICE_CHANGE', 'There is no price change awaiting approval.');
      next.pendingPriceChange = { ...next.pendingPriceChange, approvedAt: at, approved: true };
      next.approvedWorkAmount = next.pendingPriceChange.amount;
      next.pendingPriceChange = null;
      next.status = 'work_in_progress';
      break;

    case 'reject_price_change':
      if (next.status !== 'price_change_pending' || !next.pendingPriceChange) return reject('NO_PENDING_PRICE_CHANGE', 'There is no price change awaiting approval.');
      next.pendingPriceChange = null;
      next.status = 'work_in_progress';
      next.lastPriceChangeRejectedAt = at;
      break;

    case 'submit_bill': {
      if (next.status === 'price_change_pending' || next.pendingPriceChange) return reject('PRICE_CHANGE_APPROVAL_REQUIRED', 'Work and billing are paused until the Client approves or rejects the price change.');
      if (next.status !== 'work_in_progress') return reject('WORK_NOT_IN_PROGRESS', 'The final bill can only be submitted after work starts.');
      const providerAmount = Number(payload.amount);
      if (!Number.isFinite(providerAmount) || providerAmount < 0) return reject('INVALID_BILL_AMOUNT', 'Enter a valid Provider work amount.');
      const clientPurchasedMaterialsAmount = Math.max(0, Number(payload.clientPurchasedMaterialsAmount) || 0);
      const commissionRate = Math.max(0, Number(next.commissionRate) || 0);
      const commissionAmount = Math.round(providerAmount * commissionRate) / 100;
      next.providerBill = {
        providerAmount,
        clientPurchasedMaterialsAmount,
        commissionRate,
        commissionAmount,
        payableAmount: providerAmount + commissionAmount,
        note: String(payload.note || '').trim(),
        submittedAt: at,
      };
      next.status = 'awaiting_client_approval';
      break;
    }

    case 'confirm_satisfaction':
      if (!['awaiting_client_approval', 'awaiting_payment'].includes(next.status)) return reject('BILL_NOT_READY', 'Work must be ready for Client review before satisfaction can be confirmed.');
      next.clientSatisfied = true;
      next.status = 'awaiting_payment';
      break;

    case 'payment_result': {
      if (!['awaiting_payment', 'payment_delayed', 'payment_failed'].includes(next.status) || !next.clientSatisfied || !next.providerBill) return reject('PAYMENT_NOT_READY', 'Client approval and a submitted bill are required before payment.');
      if (!['confirmed', 'delayed', 'failed'].includes(payload.outcome)) return reject('INVALID_PAYMENT_OUTCOME', 'Choose a supported simulated payment outcome.');
      next.paymentStatus = payload.outcome;
      if (payload.outcome === 'confirmed') {
        next.status = 'paid';
        next.providerPayoutStatus = 'released';
        next.providerPayoutAmount = next.providerBill.providerAmount;
        next.commissionAmount = next.providerBill.commissionAmount;
        next.paymentReference = payload.reference || `PREVIEW-${next.id}-${Date.now()}`;
      } else {
        next.status = payload.outcome === 'delayed' ? 'payment_delayed' : 'payment_failed';
        next.providerPayoutStatus = 'not_released';
      }
      break;
    }

    case 'complete_case':
      if (next.status !== 'paid' || next.dispute?.status === 'pending' || next.refundRequest?.status === 'pending') {
        return reject('CASE_NOT_READY_FOR_COMPLETION', 'The case must be paid with no pending dispute or refund decision before completion.');
      }
      if (!next.clientSatisfied) return reject('CLIENT_SATISFACTION_REQUIRED', 'The Client must confirm satisfaction before completion.');
      if (next.paymentStatus !== 'confirmed') return reject('PAYMENT_CONFIRMATION_REQUIRED', 'Payment must be confirmed before completion.');
      next.status = 'completed';
      next.completedAt = at;
      break;

    case 'cancel_case':
      if (['completed', 'cancelled'].includes(next.status)) return reject('CASE_CLOSED', 'This case is already closed.');
      next.cancellationFeeDue = next.providerAcceptedAt ? Math.max(0, Number(payload.feeAmount) || 0) : 0;
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

    case 'record_inspection':
      if (next.status !== 'inspector_assigned') return reject('INSPECTION_NOT_ASSIGNED', 'This case is not assigned for inspection.');
      next.inspection = { ...payload, submittedAt: at };
      next.status = 'inspection_reported';
      break;

    case 'assign_inspector':
      if (next.status !== 'submitted') return reject('INSPECTOR_ASSIGNMENT_NOT_AVAILABLE', 'An Inspector can only be assigned after the Client has submitted the request details.');
      if (!String(payload.inspectorId || '').trim()) return reject('INSPECTOR_REQUIRED', 'Select an Inspector before assigning the case.');
      if (String(payload.inspectorId).trim() !== 'demo-inspector') return reject('INSPECTOR_NOT_AVAILABLE', 'This Inspector is not available in the shared preview account set.');
      next.assignedInspectorId = String(payload.inspectorId).trim();
      next.status = 'inspector_assigned';
      break;

    case 'offer_provider':
      if (next.status !== 'scope_confirmed') return reject('SCOPE_NOT_CONFIRMED', 'Inspection and scope confirmation are required before a Provider offer.');
      if (!String(payload.providerId || '').trim()) return reject('PROVIDER_REQUIRED', 'Select a Provider before sending the offer.');
      if (String(payload.providerId).trim() !== 'demo-provider') return reject('PROVIDER_NOT_AVAILABLE', 'This Provider is not available in the shared preview account set.');
      next.assignedProviderId = String(payload.providerId).trim();
      next.status = 'offer_sent';
      break;

    case 'confirm_scope':
      if (next.status !== 'inspection_reported') return reject('INSPECTION_REQUIRED', 'An inspection report is required before scope confirmation.');
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
        next.providerBill = { ...next.providerBill, commissionRate: rate, commissionAmount, payableAmount: next.providerBill.providerAmount + commissionAmount };
      }
      break;
    }

    case 'confirm_delayed_payment':
      if (next.paymentStatus !== 'delayed') return reject('PAYMENT_NOT_DELAYED', 'Only a delayed payment can be confirmed by Admin.');
      next.paymentStatus = 'confirmed';
      next.status = 'paid';
      next.providerPayoutStatus = 'released';
      next.providerPayoutAmount = next.providerBill?.providerAmount || 0;
      next.commissionAmount = next.providerBill?.commissionAmount || 0;
      break;

    default:
      return reject('ACTION_NOT_SUPPORTED', 'This workflow action is not supported.');
  }

  recordEvent(next, role, action, at);
  return { caseRecord: next, error: null };
};
