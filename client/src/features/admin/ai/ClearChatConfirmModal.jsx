import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';

export function ClearChatConfirmModal({ isOpen, mode, title = '', onConfirm, onCancel }) {

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDelete = mode === 'delete';
  const heading = isDelete ? 'Delete Conversation' : 'Clear Chat History';
  const description = isDelete
    ? `Are you sure you want to delete "${title || 'this conversation'}"? All messages and feedback will be permanently removed.`
    : 'Are you sure you want to clear all messages from this conversation? This action cannot be undone.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="confirm-modal-title" className="text-sm font-semibold text-slate-900">
              {heading}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-colors"
          >
            {isDelete ? 'Delete' : 'Clear Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}

ClearChatConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['clear', 'delete']).isRequired,
  title: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

