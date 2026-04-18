import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Loader2, Send, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { notificationsApi, settingsApi, authApi } from '@/lib/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ─── QUERIES ───
  const { data: notificationEmailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['settings', 'notification-emails'],
    queryFn: () => settingsApi.getNotificationEmails(),
  });

  const notificationEmails = notificationEmailsData?.data?.emails || '';

  // ─── MUTATIONS ───
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => updateProfile(data),
    onSuccess: () => {
      toast({ title: 'Profile updated successfully' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  });

  const updateEmailsMutation = useMutation({
    mutationFn: (emails: string) => settingsApi.updateNotificationEmails(emails),
    onSuccess: () => {
      toast({ title: 'Notification emails updated' });
      queryClient.invalidateQueries({ queryKey: ['settings', 'notification-emails'] });
    },
    onError: () => toast({ title: 'Failed to update notification emails', variant: 'destructive' })
  });

  const testEmailMutation = useMutation({
    mutationFn: () => notificationsApi.testEmail(),
    onSuccess: (res) => {
      if (res.data.status === 'success') {
        toast({ title: res.data.message });
      } else {
        toast({ title: 'Email test failed', variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Email configuration may be incomplete.';
      toast({ title: 'Email test failed', description: message, variant: 'destructive' });
    }
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!formData.currentPassword) {
      toast({ title: 'Current password is required to save changes', variant: 'destructive' });
      return;
    }

    updateProfileMutation.mutate({
      email: formData.email,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword || undefined
    });
  };

  const [localEmails, setLocalEmails] = useState<string | null>(null);
  const displayEmails = localEmails !== null ? localEmails : notificationEmails;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account credentials and security preferences.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-bold">Account Security</h2>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-10"
                    placeholder="admin@smartmovetransportltd.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 block">
                  Change Password
                </Label>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="pl-10 h-10"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-10 h-10"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <div className="bg-accent/5 rounded-xl p-4 mb-6 border border-accent/10">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      For your security, please enter your <strong>current password</strong> to confirm these changes.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="h-10 border-accent/20 focus:border-accent"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-accent text-white h-12 text-lg font-bold"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Update Account'
              )}
            </Button>
          </form>
        </motion.div>

        {/* Security Tips / Info */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-8"
          >
            <h3 className="text-lg font-bold mb-4">Security Best Practices</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Use a password at least 12 characters long with mixed cases and symbols.
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Don't use the same password you use for other online accounts.
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Ensure your email address is secure and unique to this system.
              </li>
            </ul>
          </motion.div>

          {/* Notification Emails Configuration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-8 space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Notification Emails</h3>
                <p className="text-xs text-muted-foreground">Admin recipients for system alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-emails">Alert Recipients</Label>
                <div className="relative">
                  {emailsLoading ? (
                    <Skeleton className="h-11 w-full" />
                  ) : (
                    <>
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="notification-emails"
                        value={displayEmails}
                        onChange={(e) => setLocalEmails(e.target.value)}
                        className="pl-10 h-11"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground italic pl-1">
                  Separate multiple emails with commas. This is useful for team bcc.
                </p>
              </div>

              <Button
                onClick={() => updateEmailsMutation.mutate(displayEmails)}
                disabled={updateEmailsMutation.isPending || emailsLoading}
                className="w-full h-11 font-bold gap-2"
              >
                {updateEmailsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Notification Emails
              </Button>
            </div>
          </motion.div>

          {/* Email Notification Test */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-8 space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <BellRing className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Email Connectivity</h3>
                <p className="text-xs text-muted-foreground">Verify booking alert emails are working</p>
              </div>
            </div>

            <Button
              id="btn-test-email"
              onClick={() => testEmailMutation.mutate()}
              disabled={testEmailMutation.isPending}
              className="w-full btn-accent text-white h-11 font-bold gap-2"
            >
              {testEmailMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending Test Email...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Test Email</>  
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
