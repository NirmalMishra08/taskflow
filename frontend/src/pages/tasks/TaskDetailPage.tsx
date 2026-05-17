import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Edit, Trash2, FileText, Download, Calendar, User, Clock } from 'lucide-react';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { UpdateStatusModal } from '../../components/tasks/UpdateStatusModal';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

interface Task {
  ID: number;
  Title: string;
  Description: { String: string; Valid: boolean };
  Status: { Status: string; Valid: boolean };
  Priority: string;
  DueDate: string | null;
  CreatedAt: string | null;
  AssignedTo: { Bytes: number[]; Valid: boolean } | string;
  CreatedBy?: { Bytes: number[]; Valid: boolean } | string;
  documents?: { ID: number; FileName: string; FilePath: string }[];
}

interface UserProfile {
  ID: { Bytes: number[]; Valid: boolean } | string;
  Name: string;
  Email: string;
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const isAdmin = user?.role === 'admin';
  const isAssignee = user && task && getUuidString(task.AssignedTo) === user.id;
  const isCreator = user && task && task.CreatedBy && getUuidString(task.CreatedBy) === user.id;
  const isOnlyAssignee = isAssignee && !isCreator && !isAdmin;

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    try {
      const [taskRes, usersRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get('/users?limit=100'),
      ]);
      setTask(taskRes.data);
      if (Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to load task details', err);
      addToast('Failed to load task details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);



  const getAssigneeName = (assignedTo: any) => {
    const assignedStr = getUuidString(assignedTo);
    if (!assignedStr) return 'Unassigned';
    const foundUser = users.find((u) => getUuidString(u.ID) === assignedStr);
    return foundUser ? foundUser.Name : 'Unassigned';
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      addToast('Task deleted successfully!', 'success');
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to delete task', err);
      addToast('Failed to delete task.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-24" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-surface-900">Task not found</p>
        <p className="text-sm text-surface-500 mt-1">The task you're looking for doesn't exist.</p>
        <Link to="/tasks">
          <Button variant="secondary" className="mt-4">Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const taskStatus = task.Status.Valid ? task.Status.Status : 'pending';
  const statusVariant = taskStatus === 'completed' ? 'success' : taskStatus === 'progress' ? 'info' : 'warning';
  const priorityVariant = task.Priority === 'high' ? 'danger' : 'default';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{task.Title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{taskStatus}</Badge>
              <Badge variant={priorityVariant}>{task.Priority} Priority</Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isOnlyAssignee ? (
              <Button variant="secondary" size="sm" onClick={() => setStatusModalOpen(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Update Status
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-surface-500 mb-2">Description</h3>
            <p className="text-sm text-surface-700 leading-relaxed">
              {task.Description.Valid ? task.Description.String : 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-surface-100">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-100 rounded-md">
                <User className="h-4 w-4 text-surface-500" />
              </div>
              <div>
                <p className="text-surface-500">Assigned To</p>
                <p className="font-medium text-surface-900">{getAssigneeName(task.AssignedTo)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-100 rounded-md">
                <Calendar className="h-4 w-4 text-surface-500" />
              </div>
              <div>
                <p className="text-surface-500">Due Date</p>
                <p className="font-medium text-surface-900">
                  {task.DueDate ? new Date(task.DueDate).toLocaleDateString() : 'No Due Date'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-surface-100 rounded-md">
                <Clock className="h-4 w-4 text-surface-500" />
              </div>
              <div>
                <p className="text-surface-500">Created</p>
                <p className="font-medium text-surface-900">
                  {task.CreatedAt ? new Date(task.CreatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attached Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {task.documents && task.documents.length > 0 ? (
            <div className="space-y-2">
              {task.documents.map((doc) => (
                <div key={doc.ID} className="flex items-center justify-between p-3 border border-surface-200 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-red-50 rounded-md flex-shrink-0">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{doc.FileName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.FilePath, '_blank')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-10 w-10 text-surface-300 mb-2" />
              <p className="text-sm text-surface-500">No documents attached.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { action: 'Task metadata was created.', time: task.CreatedAt ? new Date(task.CreatedAt).toLocaleString() : 'N/A' },
              { action: `Task was assigned to ${getAssigneeName(task.AssignedTo)}.`, time: task.CreatedAt ? new Date(task.CreatedAt).toLocaleString() : 'N/A' },
              { action: `Current status of task is "${taskStatus}".`, time: 'Current State' },
            ].map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative mt-1">
                  {i < 2 && <div className="absolute left-2 top-4 -bottom-6 w-0.5 bg-surface-200"></div>}
                  <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 ring-4 ring-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-600"></div>
                  </div>
                </div>
                <div className="flex-1 text-sm pb-2">
                  <p className="text-surface-700">{event.action}</p>
                  <p className="text-surface-400 text-xs mt-0.5">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editModalOpen && (
        <EditTaskModal 
          task={task} 
          onClose={() => setEditModalOpen(false)} 
          onSuccess={fetchTaskDetails}
        />
      )}

      {statusModalOpen && (
        <UpdateStatusModal 
          task={task} 
          onClose={() => setStatusModalOpen(false)} 
          onSuccess={fetchTaskDetails}
        />
      )}
    </div>
  );
}
