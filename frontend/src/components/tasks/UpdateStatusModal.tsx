import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X as XIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Task {
  ID: number;
  Title: string;
  Description: { String: string; Valid: boolean };
  Status: { Status: string; Valid: boolean };
  Priority: string;
  DueDate: string | null;
  AssignedTo: { Bytes: number[]; Valid: boolean } | string;
}

interface UpdateStatusModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateStatusModal({ task, onClose, onSuccess }: UpdateStatusModalProps) {
  const { addToast } = useToast();
  const [status, setStatus] = useState(task.Status.Valid ? task.Status.Status : 'pending');
  const [isLoading, setIsLoading] = useState(false);

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const taskData = {
        title: task.Title,
        description: task.Description.Valid ? task.Description.String : '',
        status: status,
        priority: task.Priority,
        due_date: task.DueDate ? task.DueDate : new Date().toISOString(),
        assigned_to: getUuidString(task.AssignedTo),
      };

      await api.put(`/tasks/${task.ID}`, taskData);
      addToast('Status updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to update status.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = task.Status.Valid ? task.Status.Status : 'pending';
  const statusVariant = currentStatus === 'completed' ? 'success' : currentStatus === 'progress' ? 'info' : 'warning';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-surface-900/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm transform rounded-xl bg-white shadow-xl transition-all p-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <h2 className="text-md font-semibold text-surface-950">Update Task Status</h2>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 transition-colors">
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex items-center justify-between py-2 px-3 bg-surface-50 rounded-lg text-sm text-surface-600">
              <span>Current Status</span>
              <Badge variant={statusVariant}>{currentStatus}</Badge>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">New Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-surface-900" 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending"> Pending</option>
                <option value="progress"> In Progress</option>
                <option value="completed"> Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-surface-100">
              <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Save Status'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
