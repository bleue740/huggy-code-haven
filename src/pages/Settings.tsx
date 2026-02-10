import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Mail, CreditCard, Trash2, LogOut, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [credits, setCredits] = useState<number | null>(null);
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

      const { data } = await supabase
        .from('users_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      if (data) setCredits(data.credits);
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
      toast.success('Compte supprimé avec succès');
      navigate('/auth');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-neutral-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Settings</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 md:px-8 py-10 space-y-6">
        {/* Profile */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Mail size={16} className="text-blue-400" />
            Profile
          </h2>
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Email</label>
            <p className="mt-1 text-sm text-neutral-300 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3">
              {userEmail || '—'}
            </p>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-400" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-300">Current Plan</p>
              <p className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                Free
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <Crown size={14} />
              Upgrade
            </button>
          </div>
          {credits !== null && (
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">Credits remaining</p>
              <p className="text-2xl font-black text-white">{credits}</p>
            </div>
          )}
        </section>

        {/* Account */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <LogOut size={16} className="text-orange-400" />
            Account
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] text-neutral-300 hover:text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] border border-[#333]"
            >
              <LogOut size={14} />
              Sign Out
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-bold rounded-xl transition-all active:scale-[0.98] border border-red-500/20"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          </div>
        </section>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#111] border-[#222] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Cette action supprimera tous vos projets et données. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
