import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Building,
  Save,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { DistributorProfile, AppBackupData } from '../../types';
import { StorageService } from '../../services/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  onNotify,
}) => {
  const [profile, setProfile] = useState<DistributorProfile>(() => StorageService.getProfile());
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export full JSON backup
  const handleExportBackup = () => {
    try {
      const data = StorageService.exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const d = new Date();
      const dateTag = d.toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orderdesk_backup_${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotify('Backup file exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      onNotify('Failed to export backup.', 'error');
    }
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as AppBackupData;

        const res = StorageService.importBackup(parsed, true);
        if (res.success) {
          onNotify(res.message, 'success');
          onDataRestored();
          onClose();
        } else {
          onNotify(res.message, 'error');
        }
      } catch (err) {
        console.error(err);
        onNotify('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save Company Header Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveProfile(profile);
    onNotify('Distributor details saved for PDF invoices.', 'success');
  };

  // Reset to Demo Data
  const handleResetToDemo = () => {
    StorageService.resetToDemo();
    setProfile(StorageService.getProfile());
    setIsResetConfirmOpen(false);
    onNotify('Restored default sample demo data.', 'info');
    onDataRestored();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Data Safety &amp; Settings</h3>
              <p className="text-[11px] text-teal-200">Offline persistence, backup &amp; PDF header</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section: Backup & Restore */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <span>Full Data Backup &amp; Restore</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              All your pharmacies, medicines, rates, and past orders are stored safely inside this device&apos;s browser memory. You can export a backup JSON anytime.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Section: Distributor Company PDF Header Profile */}
          <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-teal-800" />
              <span>Distributor Profile (PDF Header)</span>
            </h4>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Distributor Company Name
              </label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Tagline / Service Description
              </label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Helpline / Contact
                </label>
                <input
                  type="text"
                  value={profile.contactNumber}
                  onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Warehouse / Address
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>

          {/* Section: Reset to Demo Data */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Reset to Sample Data</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition active:scale-95 cursor-pointer"
              >
                Reset Demo
              </button>
            </div>
            <p className="text-amber-800 text-[11px]">
              Restores the default 3 pharmacies, 2 receivers, 10 medicines, and sample orders.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">Reset to Demo Data?</h4>
            </div>
            <p className="text-xs text-slate-600">
              This will replace current items with the preloaded sample pharmacies, receivers, medicines, and sample history.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDemo}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
