import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

interface Task {
  ID: number;
  Title: string;
  Description: { String: string; Valid: boolean };
  Status: { Status: string; Valid: boolean };
  Priority: string;
  DueDate: string | null;
  AssignedTo: { Bytes: number[]; Valid: boolean } | string;
}

interface User {
  ID: { Bytes: number[]; Valid: boolean } | string;
  Name: string;
  Email: string;
}

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [tasksRes, usersRes] = await Promise.all([
          api.get(`/tasks?page=${page}`),
          api.get('/users?limit=100'),
        ]);
        if (Array.isArray(tasksRes.data)) {
          setTasks(tasksRes.data);
        }
        if (Array.isArray(usersRes.data)) {
          setUsers(usersRes.data);
        }
      } catch (err) {
        console.error('Failed to load tasks and users', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [page]);

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      // Map bytes to standard UUID string representation
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const getAssigneeName = (assignedTo: any) => {
    const assignedStr = getUuidString(assignedTo);
    if (!assignedStr) return 'Unassigned';
    const foundUser = users.find((u) => getUuidString(u.ID) === assignedStr);
    return foundUser ? foundUser.Name : 'Unassigned';
  };

  // Local filtering for live experience
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const taskStatus = task.Status.Valid ? task.Status.Status : 'pending';
    const matchesStatus = statusFilter === '' || taskStatus === statusFilter;
    
    const matchesPriority = priorityFilter === '' || task.Priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">Tasks</h1>
          <p className="text-sm text-surface-500">Manage your team's tasks and priorities.</p>
        </div>
        <Link to="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button variant="secondary" className="px-3" onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPriorityFilter('');
            }}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 border-y border-surface-200">
              <tr>
                <th className="px-4 py-3 font-medium">Task Title</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-surface-100">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-20 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-surface-500">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const taskStatus = task.Status.Valid ? task.Status.Status : 'pending';
                  return (
                    <tr key={task.ID} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-surface-900">
                        <Link to={`/tasks/${task.ID}`} className="hover:text-brand-600 hover:underline">
                          {task.Title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-surface-600">{getAssigneeName(task.AssignedTo)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={taskStatus === 'completed' ? 'success' : taskStatus === 'progress' ? 'info' : 'warning'}>
                          {taskStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={task.Priority === 'high' ? 'danger' : 'default'}>
                          {task.Priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-600">
                        {task.DueDate ? new Date(task.DueDate).toLocaleDateString() : 'No Due Date'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/tasks/${task.ID}`}>
                          <Button variant="secondary" size="sm">
                            View / Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between border-t border-surface-200 pt-4 mt-4">
          <div className="text-sm text-surface-500">
            Current page: <span className="font-medium">{page}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={tasks.length < 10}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
