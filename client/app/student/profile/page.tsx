// Student profile page placeholder
'use client';

import { useAuth } from '@/lib/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Mail, Calendar } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
          My Profile
        </h1>
        <p className="text-text-secondary">
          View and manage your account information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{user?.name}</h2>
              <Badge variant="info" className="capitalize mt-1">{user?.role}</Badge>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text-muted">Full Name</p>
                <p className="text-text-primary">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text-muted">Email Address</p>
                <p className="text-text-primary">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text-muted">Member Since</p>
                <p className="text-text-primary">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
