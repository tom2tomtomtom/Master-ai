'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PasswordStrength } from '@/components/auth/password-strength';
import { cn } from '@/lib/utils';

import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Save,
  Github,
  Crown
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
  accounts: Array<{
    provider: string;
    type: string;
  }>;
}

const subscriptionTiers = {
  free: { name: 'Free Explorer', color: 'bg-gray-100 text-gray-800' },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-800' },
  team: { name: 'Team', color: 'bg-purple-100 text-purple-800' },
  enterprise: { name: 'Enterprise', color: 'bg-yellow-100 text-yellow-800' }
};

export default function ProfilePage(): JSX.Element {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteForm, setDeleteForm] = useState({
    confirmEmail: '',
    confirmText: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setProfileForm({
          name: data.user.name || '',
          email: data.user.email || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, ...data.user } : null);
        setSuccess('Profile updated successfully');
        // Update session data
        await update({ name: data.user.name });
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        if (data.details) {
          setError(data.details[0].message);
        } else {
          setError(data.error || 'Failed to change password');
        }
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    setIsDeletingAccount(true);
    setError('');

    try {
      const response = await fetch('/api/profile/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteForm),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign out and redirect to home
        router.push('/');
      } else {
        if (data.details) {
          setError(data.details[0].message);
        } else {
          setError(data.error || 'Failed to delete account');
        }
      }
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600">Failed to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  const hasPassword = profile.accounts.some(account => account.type === 'credentials');
  const connectedAccounts = profile.accounts.filter(account => account.type === 'oauth');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={subscriptionTiers[profile.subscriptionTier as keyof typeof subscriptionTiers]?.color}>
                    {subscriptionTiers[profile.subscriptionTier as keyof typeof subscriptionTiers]?.name}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Status: {profile.subscriptionStatus}
                  </span>
                </div>
              </div>
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
            <Separator />
            <div className="text-sm text-gray-600">
              <p>Member since: {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and connected accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connected Accounts */}
            <div>
              <h4 className="font-medium mb-3">Connected Accounts</h4>
              <div className="space-y-2">
                {connectedAccounts.length > 0 ? (
                  connectedAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {account.provider === 'github' && <Github className="h-5 w-5" />}
                        {account.provider === 'google' && (
                          <div className="w-5 h-5">
                            <svg viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                          </div>
                        )}
                        <span className="capitalize">{account.provider}</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Connected
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No connected accounts</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Password Change */}
            <div>
              <h4 className="font-medium mb-3">Change Password</h4>
              {hasPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.newPassword && (
                      <PasswordStrength password={passwordForm.newPassword} className="mt-2" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Changing Password...
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    Your account uses OAuth authentication only. To set a password, please contact support.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account, 
                all your progress, notes, and any associated data.
              </p>
            </div>
            
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Please confirm that you want to permanently delete your account.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="confirmEmail">Confirm your email address</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      value={deleteForm.confirmEmail}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                      placeholder={profile.email}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmText">
                      Type <strong>DELETE MY ACCOUNT</strong> to confirm
                    </Label>
                    <Input
                      id="confirmText"
                      value={deleteForm.confirmText}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                      placeholder="DELETE MY ACCOUNT"
                      className="mt-1"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || !deleteForm.confirmEmail || deleteForm.confirmText !== 'DELETE MY ACCOUNT'}
                  >
                    {isDeletingAccount ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Deleting...
                      </div>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}