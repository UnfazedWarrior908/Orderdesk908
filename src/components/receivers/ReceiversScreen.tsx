import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Users, Phone, Briefcase, X } from 'lucide-react';
import { Receiver, Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface ReceiversScreenProps {
  receivers: Receiver[];
  orders: Order[];
  onAddReceiver: (receiver: Omit<Receiver, 'id' | 'createdAt'>) => Receiver;
  onUpdateReceiver: (id: string, receiver: Omit<Receiver, 'id' | 'createdAt'>) => void;
  onDeleteReceiver: (id: string) => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ReceiversScreen: React.FC<ReceiversScreenProps> = ({
  receivers,
  orders,
  onAddReceiver,
  onUpdateReceiver,
  onDeleteReceiver,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [receiverToDelete, setReceiverToDelete] = useState<Receiver | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // Receiver stats
  const receiverStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      if (!stats[o.receiverId]) {
        stats[o.receiverId] = { count: 0, total: 0 };
      }
      stats[o.receiverId].count += 1;
      stats[o.receiverId].total += o.grandTotal;
    });
    return stats;
  }, [orders]);

  const openAddModal = () => {
    setEditingReceiver(null);
    setName('');
    setRole('Order Booking Officer');
    setPhone('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Receiver) => {
    setEditingReceiver(r);
    setName(r.name);
    setRole(r.role || '');
    setPhone(r.phone || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Receiver name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      role: role.trim() || 'Order Booking Officer',
      phone: phone.trim() || undefined,
    };

    if (editingReceiver) {
      onUpdateReceiver(editingReceiver.id, payload);
      onNotify(`Updated ${payload.name}`, 'success');
    } else {
      onAddReceiver(payload);
      onNotify(`Added ${payload.name}`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (receiverToDelete) {
      onDeleteReceiver(receiverToDelete.id);
      onNotify(`Deleted ${receiverToDelete.name}`, 'info');
      setReceiverToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receivers;
    return receivers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.role && r.role.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
    );
  }, [receivers, search]);

  // "Show More" pagination for filtered receivers
  const pagination = useShowMore(filtered.length, 10, 10);

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-800" />
            <span>Saved Order Receivers &amp; Officers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnel taking and recording orders in the field
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Receiver</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receiver by name or designation..."
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

      {/* Receivers Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No receivers found</h3>
            <p className="text-xs text-slate-500">
              {receivers.length === 0
                ? 'No receivers added yet. Add sales officers who book orders.'
                : 'No receivers match your search query.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Receiver Now
            </button>
          </div>
        ) : (
          <>
            {filtered.slice(0, pagination.visibleCount).map((receiver) => {
              const stats = receiverStats[receiver.id] || { count: 0, total: 0 };
              return (
                <div
                  key={receiver.id}
                  className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 hover:border-teal-300 p-3.5 flex flex-col justify-between gap-3 transition shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {receiver.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(receiver)}
                          className="p-1 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                          title="Edit Receiver"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReceiverToDelete(receiver)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Receiver"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {receiver.role && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{receiver.role}</span>
                      </div>
                    )}

                    {receiver.phone && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{receiver.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Order stats */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Booked orders: <strong className="text-teal-900">{stats.count}</strong>
                    </span>
                    <span className="text-[11px] font-bold text-teal-900">
                      {formatCurrency(stats.total)}
                    </span>
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

      {/* Add / Edit Receiver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingReceiver ? 'Edit Receiver' : 'Add New Receiver'}
                  </h3>
                  <p className="text-[11px] text-teal-200">Order booking representative</p>
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
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Order Booking Officer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Phone / Mobile
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0321-4433221"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-700"
                />
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
                  {editingReceiver ? 'Update Receiver' : 'Save Receiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(receiverToDelete)}
        title="Delete Receiver?"
        message={`Are you sure you want to delete ${receiverToDelete?.name}? Existing orders will keep the receiver name.`}
        confirmLabel="Yes, Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setReceiverToDelete(null)}
      />
    </div>
  );
};
