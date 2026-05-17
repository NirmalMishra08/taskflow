import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CheckCircle2, Clock, ListTodo, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

interface Task {
  ID: number;
  Title: string;
  Description: { String: string; Valid: boolean };
  Status: { Status: string; Valid: boolean };
  Priority: string;
  DueDate: string | null;
  CreatedAt: string | null;
}

export function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await api.get('/tasks');
        if (Array.isArray(response.data)) {
          setTasks(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.Status.Valid && t.Status.Status === 'completed').length;
  const pendingTasks = tasks.filter((t) => !t.Status.Valid || t.Status.Status !== 'completed').length;
  const highPriorityTasks = tasks.filter((t) => t.Priority === 'high').length;

  const statCards = [
    { title: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'text-brand-600', bg: 'bg-brand-100' },
    { title: 'Completed Tasks', value: completedTasks, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Pending Tasks', value: pendingTasks, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'High Priority Tasks', value: highPriorityTasks, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const recentTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">Dashboard</h1>
          <p className="text-sm text-surface-500">Here's an overview of your tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-500">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-sm">
                No tasks available. Create one to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.ID} className="flex items-center justify-between p-4 border border-surface-100 rounded-lg bg-surface-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{task.Title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize
                          ${task.Status.Valid && task.Status.Status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.Status.Valid && task.Status.Status === 'progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                          {task.Status.Valid ? task.Status.Status : 'pending'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize
                          ${task.Priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-surface-200 text-surface-700'}`}>
                          {task.Priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-surface-500 ml-4">
                      {task.CreatedAt ? new Date(task.CreatedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTasks.slice(0, 3).map((task, i) => (
                <div key={task.ID} className="flex gap-4">
                  <div className="relative mt-1">
                    {i < recentTasks.slice(0, 3).length - 1 && (
                      <div className="absolute left-2 top-2 -bottom-6 w-0.5 bg-surface-200"></div>
                    )}
                    <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 ring-4 ring-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-600"></div>
                    </div>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-surface-900">
                      Task <span className="font-medium">"{task.Title}"</span> was fetched in live mode.
                    </p>
                    <p className="text-surface-500 mt-0.5">Active</p>
                  </div>
                </div>
              ))}
              {!isLoading && recentTasks.length === 0 && (
                <p className="text-sm text-surface-500 text-center py-4">No recent activities found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
