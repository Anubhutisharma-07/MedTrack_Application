import React, { useState, useEffect } from 'react';
import { getApprovalInbox, decideApprovalStep } from '../../services/ProcurementService';
import { useToast } from '../../context/ToastContext';
import { SimpleModal } from '../../components/common/Modal';

const ApprovalInbox = ({ onNavigate }) => {
  const { addToast } = useToast();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);
  
  // Modal states for decision flow
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [activeStepId, setActiveStepId] = useState(null);
  const [isApprove, setIsApprove] = useState(true);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const data = await getApprovalInbox();
      setSteps(data || []);
    } catch (err) {
      console.error('Error fetching approval inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionClick = (stepId, approve) => {
    setActiveStepId(stepId);
    setIsApprove(approve);
    setComment('');
    setValidationError('');
    setShowDecisionModal(true);
  };

  const handleConfirmDecision = async () => {
    if (!isApprove && (!comment || !comment.trim())) {
      setValidationError('Rejection reason is required');
      return;
    }
    if (comment.length > 500) {
      setValidationError('Comment must be 500 characters or less');
      return;
    }

    setShowDecisionModal(false);
    setDeciding(activeStepId);
    try {
      await decideApprovalStep(activeStepId, isApprove, comment.trim());
      addToast(isApprove ? 'Step approved successfully!' : 'Step rejected', 'success');
      fetchInbox();
    } catch (err) {
      console.error('Error deciding step:', err);
      addToast('Failed to record decision. Please try again.', 'error');
    } finally {
      setDeciding(null);
      setActiveStepId(null);
      setComment('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Approval Inbox</h2>
          <p className="text-sm text-secondary mt-1">Review and decide on pending approval steps assigned to you</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
          {steps.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No pending approvals</h3>
              <p className="text-sm text-secondary">You have no approval steps awaiting your decision.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Request</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Equipment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Requester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Step</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Due</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {steps.map(step => (
                    <tr key={step.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.requestCode || `REQ-${step.id}`}</div>
                        <div className="text-xs text-secondary">{step.status}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.equipmentName}</div>
                        <div className="text-xs text-secondary">Qty: {step.quantity} × ${step.unitCost}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.requesterName}</div>
                        <div className="text-xs text-secondary">{step.requesterEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(step.urgency)}`}>
                          {step.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800">Group {step.stepGroup}</div>
                        <div className="text-xs text-secondary">{step.approverRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {step.approvalDueAt ? new Date(step.approvalDueAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {step.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDecisionClick(step.id, true)}
                              disabled={deciding === step.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecisionClick(step.id, false)}
                              disabled={deciding === step.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-secondary">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDecisionModal && (
        <SimpleModal
          title={isApprove ? 'Approve Procurement Step' : 'Reject Procurement Step'}
          subtitle={isApprove ? 'Add an optional comment to your approval decision' : 'Provide a mandatory reason for rejecting this step'}
          onClose={() => setShowDecisionModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-xs font-medium text-slate-300 mb-1.5">
                {isApprove ? 'Comment (Optional)' : 'Reason for Rejection (Required)'}
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (validationError) setValidationError('');
                }}
                maxLength={500}
                placeholder={isApprove ? 'Add any additional notes/comments here...' : 'Explain why this request is being rejected...'}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex justify-between mt-1 text-[11px] text-slate-500">
                <span>{validationError ? <span className="text-red-400">{validationError}</span> : ''}</span>
                <span>{comment.length}/500</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-4 py-2 text-white rounded-lg text-sm transition-colors ${
                  isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
    </div>
  );
};

export default ApprovalInbox;