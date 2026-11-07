import React, { useState, useEffect } from 'react';
import { Pill, X, Plus } from 'lucide-react';
import { MedicineItem } from '../../types';

interface QuickItemModalProps {
  isOpen: boolean;
  initialName?: string;
  onSave: (item: Omit<MedicineItem, 'id' | 'createdAt'>) => MedicineItem;
  onClose: () => void;
}

export const QuickItemModal: React.FC<QuickItemModalProps> = ({
  isOpen,
  initialName = '',
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [rate, setRate] = useState('');
  const [category, setCategory] = useState<MedicineItem['category']>('Tablets');
  const [packSize, setPackSize] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Split typed string into potential name and strength if user typed "Panadol 500mg"
      const trimmed = initialName.trim();
      const match = trimmed.match(/^(.*?)\s+(\d+\s*(?:mg|ml|mcg|g|gm|iu|%|drop|syrup|tab|cap)?.*)$/i);
      if (match) {
        setName(match[1]);
        setStrength(match[2]);
      } else {
        setName(trimmed);
        setStrength('');
      }
      setRate('');
      setError('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Medicine name is required');
      return;
    }
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) {
      setError('Please enter a valid rate per box (e.g. 340)');
      return;
    }

    onSave({
      name: name.trim(),
      strength: strength.trim() || 'Standard',
      rate: numRate,
      category,
      packSize: packSize.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Pill className="w-4 h-4 text-teal-200 rotate-45" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Add New Medicine</h3>
              <p className="text-[11px] text-teal-200">Saves to catalog and adds to order</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ryzik, Panadol, Augmentin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Strength / Form
              </label>
              <input
                type="text"
                placeholder="e.g. 20mg Cap"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Rate / Box (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 340"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicineItem['category'])}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-teal-700"
              >
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Syrups">Syrups</option>
                <option value="Injections">Injections</option>
                <option value="Drops">Drops</option>
                <option value="Ointment">Ointment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Pack Size (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 10x10, 200's"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add &amp; Insert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
