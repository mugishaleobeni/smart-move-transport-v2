import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.currentPassword) {
      toast.error('Current password is required to save changes');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined
      });
      
      toast.success('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                    placeholder="admin@smartmove.rw"
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
              disabled={loading}
            >
              {loading ? (
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
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 border-rose-500/10"
          >
            <h3 className="text-lg font-bold text-rose-500 mb-2">Need Immediate Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you suspect your account has been compromised, contact the system administrator immediately.
            </p>
            <Button variant="outline" className="w-full border-rose-500/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20">
              Report Security Issue
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
