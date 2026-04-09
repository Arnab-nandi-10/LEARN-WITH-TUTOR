'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { loadAdminOverview, type AdminCourseInsight } from '@/lib/admin/overview';
import * as businessApi from '@/lib/api/business';
import type { User, UserRole } from '@/lib/types';

type RoleFilter = 'all' | UserRole;

const formatJoinedDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<AdminCourseInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, admins, faculty, students] = await Promise.all([
          loadAdminOverview(),
          businessApi.getAdminUsersByRole('admin').catch(() => []),
          businessApi.getAdminUsersByRole('faculty').catch(() => []),
          businessApi.getAdminUsersByRole('student').catch(() => []),
        ]);
        const roleScopedUsers = [...admins, ...faculty, ...students].sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
        setUsers(roleScopedUsers.length > 0 ? roleScopedUsers : data.users);
        setCourses(data.courses);
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const courseCountByFaculty = useMemo(() => {
    return courses.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.course.faculty_id] =
        (accumulator[item.course.faculty_id] || 0) + 1;
      return accumulator;
    }, {});
  }, [courses]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
      const matchesSearch =
        query.length === 0 ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchTerm, users]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      verified: users.filter((user) => user.is_verified).length,
      faculty: users.filter((user) => user.role === 'faculty').length,
      students: users.filter((user) => user.role === 'student').length,
    };
  }, [users]);

  const handleToggleVerification = async (userId: string) => {
    try {
      setTogglingId(userId);
      const result = await businessApi.toggleUserVerification(userId);
      setUsers((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, is_verified: result.is_verified } : user
        )
      );
      toast.success('User verification updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update verification');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-text-primary">
            Manage Users
          </h1>
          <p className="text-text-secondary">
            Search accounts, track verification, and inspect faculty ownership.
          </p>
        </div>
        <div className="w-full max-w-lg">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/30">
          <CardContent className="py-4 text-sm text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {loading ? '-' : stats.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">Verified</p>
            <p className="mt-2 text-2xl font-bold text-green-500">
              {loading ? '-' : stats.verified}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">Faculty</p>
            <p className="mt-2 text-2xl font-bold text-accent">
              {loading ? '-' : stats.faculty}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">Students</p>
            <p className="mt-2 text-2xl font-bold text-blue-500">
              {loading ? '-' : stats.students}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'student', 'faculty', 'admin'] as const).map((value) => (
          <Button
            key={value}
            variant={roleFilter === value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRoleFilter(value)}
            className="capitalize"
          >
            {value}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full">
            <thead className="border-b border-border bg-bg-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-border last:border-b-0 hover:bg-bg-elevated/40"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-text-primary">{user.name}</p>
                        <p className="text-sm text-text-secondary">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'warning'
                            : user.role === 'faculty'
                              ? 'info'
                              : 'default'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                        {user.is_verified ? (
                          <BadgeCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-yellow-500" />
                        )}
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {user.role === 'faculty'
                        ? courseCountByFaculty[user._id] || 0
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {formatJoinedDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={user.is_verified ? 'secondary' : 'primary'}
                          size="sm"
                          disabled={togglingId === user._id}
                          onClick={() => handleToggleVerification(user._id)}
                        >
                          {togglingId === user._id
                            ? 'Saving...'
                            : user.is_verified
                              ? 'Revoke'
                              : 'Verify'}
                        </Button>
                        <Link href={`/admin/users/${user._id}?role=${user.role}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!loading && filteredUsers.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-bg-elevated p-4 text-sm text-text-secondary">
          <div className="mb-2 flex items-center gap-2 text-text-primary">
            <Users className="h-4 w-4 text-accent" />
            <span className="font-medium">Frontend note</span>
          </div>
          Faculty course counts include published backend courses plus draft courses cached in this project.
        </div>
      )}
    </div>
  );
}
