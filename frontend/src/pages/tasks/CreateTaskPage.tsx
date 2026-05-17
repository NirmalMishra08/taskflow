import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { UploadCloud, FileText, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface User {
  ID: { Bytes: number[]; Valid: boolean } | string;
  Name: string;
  Email: string;
}

export function CreateTaskPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const status = 'pending';
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
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

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => {
      const newFiles = [...prev, ...acceptedFiles];
      return newFiles.slice(0, 3); // Max 3 files
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
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
      // 1. Create the task metadata
      const taskData = {
        title,
        description,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        assigned_to: assignedTo,
      };

      const response = await api.post('/tasks', taskData);
      const createdTask = response.data;
      const taskId = createdTask.ID;

      // 2. Upload attachments if any are added
      if (files.length > 0 && taskId) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('documents', file);
        });

        await api.post(`/tasks/${taskId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      addToast('Task created successfully with attachments!', 'success');
      navigate('/tasks');
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to create task.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900">Create Task</h1>
        <p className="text-sm text-surface-500">Fill in the details below to create a new task.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="Task Title" 
              required 
              placeholder="E.g., Update landing page design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-surface-700">Description</label>
              <textarea 
                className="flex w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                placeholder="Describe the task in detail..."
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Due Date" 
                type="date" 
                required 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-surface-700">Assign To</label>
                <select 
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={getUuidString(user.ID)} value={getUuidString(user.ID)}>
                      {user.Name} ({user.Email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-surface-700">Attachments (PDF only, max 3)</label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:bg-surface-50'}`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-10 w-10 text-surface-400 mb-2" />
                <p className="text-sm text-surface-600">
                  {isDragActive ? 'Drop the files here...' : 'Drag & drop PDF files here, or click to select'}
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border border-surface-200 rounded-md bg-white">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                        <span className="text-sm text-surface-700 truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        className="text-surface-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-surface-100 pt-6">
            <Button variant="secondary" type="button" onClick={() => navigate('/tasks')} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating task...' : 'Create Task'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
