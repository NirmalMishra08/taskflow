import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Trash2, X as XIcon, UserPlus, Edit } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';

interface User {
  ID: { Bytes: number[]; Valid: boolean } | string;
  Name: string;
  Email: string;
  Role: { Role: string; Valid: boolean };
  CreatedAt: string | null;
}

export function UsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isCreating, setIsCreating] = useState(false);

  // Edit user states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.Name || '');
    setEditEmail(user.Email);
    setEditRole(user.Role.Valid ? user.Role.Role : 'user');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const userStr = getUuidString(editingUser.ID);
      await api.put(`/users/${userStr}`, {
        name: editName,
        email: editEmail,
        role: editRole
      });
      addToast('User updated successfully!', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to update user.';
      addToast(errMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/users?page=${page}`);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      addToast('Failed to load users list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const getUuidString = (uuidObj: any): string => {
    if (!uuidObj) return '';
    if (typeof uuidObj === 'string') return uuidObj;
    if (Array.isArray(uuidObj.Bytes)) {
      return uuidObj.Bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/users', { name, email, password, role });
      addToast('User created successfully!', 'success');
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      fetchUsers();
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to create user.';
      addToast(errMsg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: any) => {
    const userStr = getUuidString(id);
    if (!userStr) return;
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userStr}`);
      addToast('User deleted successfully!', 'success');
      fetchUsers();
    } catch (err: any) {
      const errMsg = err.response?.data || 'Failed to delete user.';
      addToast(errMsg, 'error');
    }
  };

  const filteredUsers = users.filter((u) => 
    u.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">Users</h1>
          <p className="text-sm text-surface-500">Manage team members and their roles.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-surface-500 uppercase bg-surface-50 border-y border-surface-200">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-surface-100">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-surface-500">
                    No users found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userRole = user.Role.Valid ? user.Role.Role : 'user';
                  return (
                    <tr key={getUuidString(user.ID)} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-surface-900">{user.Name || 'N/A'}</td>
                      <td className="px-4 py-3 text-surface-600">{user.Email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          userRole === 'admin' ? 'danger' :
                          userRole === 'instructor' ? 'info' :
                          userRole === 'moderator' ? 'warning' :
                          userRole === 'student' ? 'success' :
                          'default'
                        }>
                          {userRole}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-600">
                        {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEditModal(user)}
                        >
                          <Edit className="h-4 w-4 text-surface-500 hover:text-brand-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.ID)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-surface-500 hover:text-red-600" />
                        </Button>
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
              disabled={users.length < 10}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-surface-900/50 transition-opacity" onClick={() => setShowCreateModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform rounded-xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                <h2 className="text-lg font-semibold text-surface-900">Create User</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <form className="px-6 py-4 space-y-4" onSubmit={handleCreateUser}>
                <Input 
                  label="Name" 
                  type="text" 
                  required 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input 
                  label="Email" 
                  type="email" 
                  required 
                  placeholder="user@taskflow.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input 
                  label="Password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-surface-700">Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="instructor">Instructor</option>
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
                  <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)} disabled={isCreating}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-surface-900/50 transition-opacity" onClick={() => setEditingUser(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform rounded-xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                <h2 className="text-lg font-semibold text-surface-900">Edit User</h2>
                <button onClick={() => setEditingUser(null)} className="text-surface-400 hover:text-surface-600 transition-colors">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <form className="px-6 py-4 space-y-4" onSubmit={handleUpdateUser}>
                <Input 
                  label="Name" 
                  type="text" 
                  required 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Input 
                  label="Email" 
                  type="email" 
                  required 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-surface-700">Role</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="instructor">Instructor</option>
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
                  <Button variant="secondary" type="button" onClick={() => setEditingUser(null)} disabled={isUpdating}>Cancel</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
