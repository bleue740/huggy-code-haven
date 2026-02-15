import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Mail, CreditCard, Trash2, LogOut, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SubscriptionInfo {
  plan: string;
  status: string;
  current_period_end: string | null;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [credits, setCredits] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserEmail(user.email ?? '');

      const { data: creditsData } = await supabase
        .from('users_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      if (creditsData) setCredits(creditsData.credits);

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (subData) {
        setSubscription(subData as SubscriptionInfo);
      } else {
        setSubscription({ plan: 'free', status: 'active', current_period_end: null });
      }
    })();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('projects').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      toast.success('Account deleted successfully');
      navigate('/auth');
    } catch {
      toast.error('Error deleting account');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  const statusLabel = subscription?.status === 'active' ? 'Active' :
    subscription?.status === 'canceled' ? 'Canceled' :
    subscription?.status === 'past_due' ? 'Past due' : 'Active';

  const statusColor = subscription?.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
    subscription?.status === 'canceled' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
    'bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400';

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-[#1a1a1a] px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Settings</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 md:px-8 py-10 space-y-6">
        {/* Profile */}
        <section className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Mail size={16} className="text-blue-500 dark:text-blue-400" />
            Profile
          </h2>
          <div>
            <label className="text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Email</label>
            <p className="mt-1 text-sm text-gray-600 dark:text-neutral-300 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl px-4 py-3">
              {userEmail || '—'}
            </p>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-500 dark:text-emerald-400" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-300">Current Plan</p>
              <p className="text-lg font-bold flex items-center gap-2 mt-0.5">
                {planLabel}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              </p>
              {subscription?.current_period_end && subscription.plan !== 'free' && (
                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                  Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Crown size={14} />
              {subscription?.plan === 'free' ? 'Upgrade' : 'Manage'}
            </button>
          </div>
          {credits !== null && (
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-bold mb-1">Credits remaining</p>
              <p className="text-2xl font-black">{credits}</p>
            </div>
          )}
        </section>

        {/* Account */}
        <section className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <LogOut size={16} className="text-orange-500 dark:text-orange-400" />
            Account
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#222] text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] border border-gray-200 dark:border-[#333]"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold rounded-xl transition-all active:scale-[0.98] border border-red-200 dark:border-red-500/20"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          </div>
        </section>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-[#111] border-gray-200 dark:border-[#222] text-gray-900 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-neutral-400">
              This will delete all your projects and data. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#222]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
