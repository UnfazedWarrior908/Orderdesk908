import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Store, MapPin, Phone, User, X } from 'lucide-react';
import { Pharmacy, Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface PharmaciesScreenProps {
  pharmacies: Pharmacy[];
  orders: Order[];
  onAddPharmacy: (pharmacy: Omit<Pharmacy, 'id' | 'createdAt'>) => Pharmacy;
  onUpdatePharmacy: (id: string, pharmacy: Omit<Pharmacy, 'id' | 'createdAt'>) => void;
  onDeletePharmacy: (id: string) => void;
  onSelectForNewOrder: (pharmacy: Pharmacy) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const PharmaciesScreen: React.FC<PharmaciesScreenProps> = ({
  pharmacies,
  orders,
  onAddPharmacy,
  onUpdatePharmacy,
  onDeletePharmacy,
  onSelectForNewOrder,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacyToDelete, setPharmacyToDelete] = useState<Pharmacy | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [error, setError] = useState('');

  // Pharmacy order statistics lookup
  const pharmacyStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      if (!stats[o.pharmacyId]) {
        stats[o.pharmacyId] = { count: 0, total: 0 };
      }
      stats[o.pharmacyId].count += 1;
      stats[o.pharmacyId].total += o.grandTotal;
    });
    return stats;
  }, [orders]);

  const openAddModal = () => {
    setEditingPharmacy(null);
    setName('');
    setArea('');
    setPhone('');
    setContactPerson('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pharmacy) => {
    setEditingPharmacy(p);
    setName(p.name);
    setArea(p.area || '');
    setPhone(p.phone || '');
    setContactPerson(p.contactPerson || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Pharmacy name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      area: area.trim() || undefined,
      phone: phone.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
    };

    if (editingPharmacy) {
      onUpdatePharmacy(editingPharmacy.id, payload);
      onNotify(`Updated ${payload.name}`, 'success');
    } else {
      onAddPharmacy(payload);
      onNotify(`Added ${payload.name}`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (pharmacyToDelete) {
      onDeletePharmacy(pharmacyToDelete.id);
      onNotify(`Deleted ${pharmacyToDelete.name}`, 'info');
      setPharmacyToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pharmacies;
    return pharmacies.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.area && p.area.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q))
    );
  }, [pharmacies, search]);

  // "Show More" pagination for filtered pharmacies
  const pagination = useShowMore(filtered.length, 10, 10);

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-800" />
            <span>Saved Pharmacies Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {pharmacies.length} pharmacies registered for manual order booking
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pharmacy</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pharmacy by name, location, or contact..."
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
      </div>

      {/* Pharmacies List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No pharmacies found</h3>
            <p className="text-xs text-slate-500">
              {pharmacies.length === 0
                ? 'No pharmacies recorded yet. Add your first customer pharmacy.'
                : 'No pharmacies match your search query.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pharmacy Now
            </button>
          </div>
        ) : (
          <>
            {filtered.slice(0, pagination.visibleCount).map((pharma) => {
              const stats = pharmacyStats[pharma.id] || { count: 0, total: 0 };
              return (
                <div
                  key={pharma.id}
                  className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 hover:border-teal-300 p-3.5 flex flex-col justify-between gap-3 transition shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {pharma.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(pharma)}
                          className="p-1 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                          title="Edit Pharmacy"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPharmacyToDelete(pharma)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Pharmacy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {pharma.area && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{pharma.area}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                      {pharma.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{pharma.phone}</span>
                        </div>
                      )}
                      {pharma.contactPerson && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 shrink-0" />
                          <span>{pharma.contactPerson}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Order stats & Book Order action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      <strong className="text-teal-900">{stats.count}</strong> orders (
                      {formatCurrency(stats.total)})
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectForNewOrder(pharma)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-[11px] border border-teal-200 transition active:scale-95 cursor-pointer"
                    >
                      + New Order
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="col-span-full">
              <ShowMoreButton
                totalCount={filtered.length}
                visibleCount={pagination.visibleCount}
                onShowMore={pagination.showMore}
                onShowLess={pagination.showLess}
              />
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Pharmacy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
                  <Store className="w-4 h-4 text-teal-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingPharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy'}
                  </h3>
                  <p className="text-[11px] text-teal-200">Customer destination record</p>
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
              {error && (
                <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Pharmacy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hassan Pharmacy, D Watson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Area / City Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blue Area, Jinnah Avenue"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Tariq"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
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
                  {editingPharmacy ? 'Update Pharmacy' : 'Save Pharmacy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(pharmacyToDelete)}
        title="Delete Pharmacy?"
        message={`Are you sure you want to delete ${pharmacyToDelete?.name} from your pharmacy records? Past orders will retain the pharmacy name.`}
        confirmLabel="Yes, Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPharmacyToDelete(null)}
      />
    </div>
  );
};
