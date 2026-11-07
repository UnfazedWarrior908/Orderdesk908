import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Pill, X, Tag } from 'lucide-react';
import { MedicineItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface ItemsScreenProps {
  medicines: MedicineItem[];
  onAddMedicine: (item: Omit<MedicineItem, 'id' | 'createdAt'>) => MedicineItem;
  onUpdateMedicine: (id: string, item: Omit<MedicineItem, 'id' | 'createdAt'>) => void;
  onDeleteMedicine: (id: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ItemsScreen: React.FC<ItemsScreenProps> = ({
  medicines,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineItem | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<MedicineItem | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [rate, setRate] = useState('');
  const [category, setCategory] = useState<MedicineItem['category']>('Tablets');
  const [packSize, setPackSize] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingMedicine(null);
    setName('');
    setStrength('');
    setRate('');
    setCategory('Tablets');
    setPackSize('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MedicineItem) => {
    setEditingMedicine(item);
    setName(item.name);
    setStrength(item.strength);
    setRate(String(item.rate));
    setCategory(item.category || 'Tablets');
    setPackSize(item.packSize || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Medicine name is required');
      return;
    }
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) {
      setFormError('Please enter a valid rate per box');
      return;
    }

    const payload = {
      name: name.trim(),
      strength: strength.trim() || 'Standard',
      rate: numRate,
      category,
      packSize: packSize.trim() || undefined,
    };

    if (editingMedicine) {
      onUpdateMedicine(editingMedicine.id, payload);
      onNotify(`Updated ${payload.name}`, 'success');
    } else {
      onAddMedicine(payload);
      onNotify(`Added ${payload.name} to catalog`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (medicineToDelete) {
      onDeleteMedicine(medicineToDelete.id);
      onNotify(`Deleted ${medicineToDelete.name}`, 'info');
      setMedicineToDelete(null);
    }
  };

  // Filtered medicines
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) {
        return false;
      }
      if (q) {
        const full = `${m.name} ${m.strength || ''} ${m.packSize || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [medicines, search, categoryFilter]);

  // "Show More" pagination for filtered medicines
  const pagination = useShowMore(filtered.length, 10, 10);

  const categories = ['all', 'Tablets', 'Capsules', 'Syrups', 'Injections', 'Drops', 'Other'];

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-800 rotate-45" />
            <span>Medicine Catalog with Rates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {medicines.length} saved medicines available for fast order booking
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Search and Category filter */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine by name or strength (e.g. Ryzik, 20mg)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat === 'all' ? 'All Medicines' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines List */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Pill className="w-10 h-10 text-slate-300 mx-auto rotate-45" />
            <h3 className="font-bold text-sm text-slate-800">No medicines found</h3>
            <p className="text-xs text-slate-500">
              {medicines.length === 0
                ? 'Your catalog is empty. Add your first medicine to get started.'
                : 'No items match your filter criteria.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine Now
            </button>
          </div>
        ) : (
          <>
            {filtered.slice(0, pagination.visibleCount).map((med, idx) => (
              <div
                key={med.id}
                className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 pt-0.5 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900">{med.name}</span>
                      {med.strength && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-900 border border-teal-200">
                          {med.strength}
                        </span>
                      )}
                      {med.category && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                          {med.category}
                        </span>
                      )}
                    </div>
                    {med.packSize && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pack: {med.packSize}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-none">
                      Rate / Box
                    </span>
                    <span className="font-black text-xs text-teal-950">
                      {formatCurrency(med.rate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(med)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                      title="Edit Rate & Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setMedicineToDelete(med)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <ShowMoreButton
              totalCount={filtered.length}
              visibleCount={pagination.visibleCount}
              onShowMore={pagination.showMore}
              onShowLess={pagination.showLess}
            />
          </>
        )}
      </div>

      {/* Add / Edit Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-teal-200 rotate-45" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                  </h3>
                  <p className="text-[11px] text-teal-200">Catalog item with distributor rate</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teal-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {formError && (
                <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ryzik, Augmentin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-900 focus:outline-none focus:border-teal-700"
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
                    placeholder="e.g. 14's, 10x10"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(medicineToDelete)}
        title="Delete Medicine?"
        message={`Are you sure you want to delete ${medicineToDelete?.name} (${medicineToDelete?.strength}) from your medicine catalog?`}
        confirmLabel="Yes, Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMedicineToDelete(null)}
      />
    </div>
  );
};
