import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { settingsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Save, FileText, History, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';

export default function AgreementManagement() {
  const { t } = useLanguage();
  const [agreement, setAgreement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgreement();
  }, []);

  const fetchAgreement = async () => {
    try {
      const response = await settingsApi.getAgreement();
      setAgreement(response.data.text || '');
    } catch (error) {
      console.error('Failed to fetch agreement', error);
      toast.error('Could not load agreement text');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateAgreement(agreement);
      toast.success('Agreement updated successfully');
    } catch (error) {
      console.error('Failed to save agreement', error);
      toast.error('Failed to save agreement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Agreement</h1>
          <p className="text-muted-foreground font-medium">Manage the legal terms and conditions for vehicle rentals.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Agreement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none card-premium overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Legal Text Editor</CardTitle>
              </div>
              <CardDescription>
                This text will appear on the booking page and be included in the exported PDF contracts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea 
                value={agreement}
                onChange={(e) => setAgreement(e.target.value)}
                placeholder="Enter the full contract terms here..."
                className="min-h-[600px] border-none focus-visible:ring-0 text-sm leading-relaxed p-8 bg-transparent"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Info className="w-4 h-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Guidelines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Use clear, numbered sections (e.g., 1. PARTIES, 2. VEHICLE DETAILS) to ensure compatibility with the PDF generator.
              </p>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2">Dynamic Fields</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  The system will automatically inject Client Names, Vehicle Plates, and Payment amounts based on the specific booking data.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Editor Tips</p>
                <ul className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-4 font-medium">
                  <li>Use bullet points for lists.</li>
                  <li>Keep text professional and legally sound.</li>
                  <li>Changes go live immediately for new contracts.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
            <CardHeader className="p-6 pb-2 text-primary">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Publication</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 italic">Syncing with User Agreement</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                When you save this agreement, users will be required to acknowledge it during the reservation process on the public website.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
