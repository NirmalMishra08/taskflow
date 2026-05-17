import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UploadCloud, FileText, X as XIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

interface User {
  ID: { Bytes: number[]; Valid: boolean } | string;
  Name: string;
  Email: string;
}

interface Task {
  ID: number;
  Title: string;
  Description: { String: string; Valid: boolean };
  Status: { Status: string; Valid: boolean };
  Priority: string;
  DueDate: string | null;
  AssignedTo: { Bytes: number[]; Valid: boolean } | string;
  CreatedBy?: { Bytes: number[]; Valid: boolean } | string;
  documents?: { ID: number; FileName: string; FilePath: string }[];
}

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTaskModal({ task, onClose, onSuccess }: EditTaskModalProps) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState(task.Title);
  const [description, setDescription] = useState(task.Description.Valid ? task.Description.String : '');
  const [status, setStatus] = useState(task.Status.Valid ? task.Status.Status : 'pending');
  const [priority, setPriority] = useState(task.Priority);
  const [dueDate, setDueDate] = useState(() => {
    if (task.DueDate) {
      return new Date(task.DueDate).toISOString().split('T')[0];
    }
    return '';
  });

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const isAdmin = user?.role === 'admin';
  const isAssignee = !!(user && getUuidString(task.AssignedTo) === user.id);
  const isCreator = !!(user && task.CreatedBy && getUuidString(task.CreatedBy) === user.id);
  const isOnlyAssignee = !!(isAssignee && !isCreator && !isAdmin);

  const [assignedTo, setAssignedTo] = useState(getUuidString(task.AssignedTo));
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get('/users?limit=100');
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    }
    fetchUsers();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 3));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 3,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) {
      addToast('Please assign this task to a user.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        title,
        description,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        assigned_to: assignedTo,
      };

      // 1. Update metadata
      await api.put(`/tasks/${task.ID}`, taskData);

      // 2. Upload new attachments if any are added
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('documents', file);
        });

        await api.post(`/tasks/${task.ID}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      addToast('Task updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to update task.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-surface-900/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-xl bg-white shadow-xl transition-all">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            <h2 className="text-lg font-semibold text-surface-900">Edit Task</h2>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 transition-colors">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <Input 
              label="Task Title" 
              required 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isOnlyAssignee}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-surface-700">Description</label>
              <textarea
                className="flex w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] disabled:bg-surface-50 disabled:text-surface-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isOnlyAssignee}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Priority</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-surface-50 disabled:text-surface-500" 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={isOnlyAssignee}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Due Date" 
                type="date" 
                required 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isOnlyAssignee}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Assign To</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-surface-50 disabled:text-surface-500" 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  required
                  disabled={isOnlyAssignee}
                >
                  <option value="">Select a user</option>
                  {users.map((u) => (
                    <option key={getUuidString(u.ID)} value={getUuidString(u.ID)}>
                      {u.Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {task.documents && task.documents.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700">Current Documents</label>
                {task.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-surface-200 rounded-md bg-surface-50 text-sm">
                    <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                    <span className="text-surface-700 truncate">{doc.FileName}</span>
                  </div>
                ))}
              </div>
            )}

            {!isOnlyAssignee && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-surface-700">Upload New Documents</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:bg-surface-50'}`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto h-8 w-8 text-surface-400 mb-1" />
                  <p className="text-xs text-surface-600">Drag & drop PDFs or click to select</p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border border-surface-200 rounded-md bg-white text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                          <span className="text-surface-700 truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => removeFile(idx)} className="text-surface-400 hover:text-red-500">
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
