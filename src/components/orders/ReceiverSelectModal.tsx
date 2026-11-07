import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Users, Phone, Check, Briefcase } from 'lucide-react';
import { Receiver } from '../../types';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface ReceiverSelectModalProps {
  isOpen: boolean;
  selectedReceiverId?: string;
  receivers: Receiver[];
  onSelect: (receiver: Receiver) => void;
  onAddNewReceiver: (receiver: Omit<Receiver, 'id' | 'createdAt'>) => Receiver;
  onClose: () => void;
}

export const ReceiverSelectModal: React.FC<ReceiverSelectModalProps> = ({
  isOpen,
  selectedReceiverId,
  receivers,
  onSelect,
  onAddNewReceiver,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New receiver inline form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [formError, setFormError] = useState('');

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

  const pagination = useShowMore(filtered.length, 10, 10);

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Receiver name is required');
      return;
    }
    const created = onAddNewReceiver({
      name: newName.trim(),
      role: newRole.trim() || 'Order Booking Officer',
      phone: newPhone.trim() || undefined,
    });
    setNewName('');
    setNewRole('');
    setNewPhone('');
    setIsAddingNew(false);
    onSelect(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[85vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Select Receiver / Booking Rep</h3>
              <p className="text-[11px] text-slate-500">Person taking or booking this order in app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search / Add Form */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2">
          {!isAddingNew ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receiver by name or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
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
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setNewName(search);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shrink-0 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateNew} className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add New Receiver
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
              </div>

              {formError && <p className="text-[11px] text-red-600">{formError}</p>}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field Officer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0321-4433221"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-teal-800 text-white font-semibold text-xs rounded-lg hover:bg-teal-700 shadow-sm"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Receivers List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 max-h-96">
          {filtered.length === 0 ? (
            <div className="py-8 text-center px-4">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No receivers found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching or add a new receiver person.</p>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setNewName(search);
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold text-xs hover:bg-teal-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add &ldquo;{search || 'New Receiver'}&rdquo;
              </button>
            </div>
          ) : (
            filtered.map((receiver) => {
              const isSelected = selectedReceiverId === receiver.id;
              return (
                <button
                  key={receiver.id}
                  onClick={() => onSelect(receiver)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border border-teal-300 text-teal-950 font-medium'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs truncate text-slate-900">{receiver.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-200 text-teal-900">
                          Selected
                        </span>
                      )}
                    </div>
                    {receiver.role && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                        <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{receiver.role}</span>
                      </div>
                    )}
                    {receiver.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Phone className="w-2.5 h-2.5 shrink-0" />
                        <span>{receiver.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 hover:border-teal-500 hover:text-teal-700">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
