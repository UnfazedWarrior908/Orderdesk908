import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Store,
  UserCheck,
  MoreVertical,
  FileDown,
  Share2,
  RotateCcw,
  Copy,
  ChevronDown,
  Check,
  Tag,
  StickyNote,
  Pill,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderItem, Pharmacy, Receiver, MedicineItem } from '../../types';
import { StorageService } from '../../services/storage';
import { DraftService, DraftOrderState, EditOrderDraftState } from '../../services/draftService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { calculateItemAmounts } from '../../utils/discount';
import { triggerHaptic } from '../../utils/haptics';
import { downloadOrderPdf } from '../../services/pdfGenerator';
import { shareOrderViaWhatsApp, copyOrderToClipboard } from '../../services/shareService';
import { PharmacySelectModal } from './PharmacySelectModal';
import { ReceiverSelectModal } from './ReceiverSelectModal';
import { QuickItemModal } from './QuickItemModal';
import { OrderSavedModal } from './OrderSavedModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShowMoreButton, useShowMore } from '../common/ShowMoreButton';

interface NewOrderScreenProps {
  pharmacies: Pharmacy[];
  receivers: Receiver[];
  medicines: MedicineItem[];
  onPharmacyAdded: (pharmacy: Omit<Pharmacy, 'id' | 'createdAt'>) => Pharmacy;
  onReceiverAdded: (receiver: Omit<Receiver, 'id' | 'createdAt'>) => Receiver;
  onMedicineAdded: (medicine: Omit<MedicineItem, 'id' | 'createdAt'>) => MedicineItem;
  onOrderSaved: (order: Order) => void;
  onViewHistory: () => void;
  onNotify: (text: string, type?: 'success' | 'info' | 'error') => void;
  initialOrderToEdit?: Order | null;
  onClearInitialOrder?: () => void;
  onDraftCountChange?: (count: number) => void;
}

export const NewOrderScreen: React.FC<NewOrderScreenProps> = ({
  pharmacies,
  receivers,
  medicines,
  onPharmacyAdded,
  onReceiverAdded,
  onMedicineAdded,
  onOrderSaved,
  onViewHistory,
  onNotify,
  initialOrderToEdit,
  onClearInitialOrder,
  onDraftCountChange,
}) => {
  // Flag to know if we restored a new order draft
  const [restoredBannerVisible, setRestoredBannerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state: Check if editing an existing order, or load persistent draft
  const initialData = useMemo(() => {
    if (initialOrderToEdit) {
      // Check if there is an in-progress edit draft for this specific order
      const editDraft = DraftService.loadEditDraft();
      if (editDraft && editDraft.originalOrderId === initialOrderToEdit.id) {
        return {
          orderNumber: editDraft.orderNumber || initialOrderToEdit.orderNumber,
          orderDate: editDraft.orderDate || initialOrderToEdit.date,
          pharmacy: editDraft.pharmacy || pharmacies.find((p) => p.id === initialOrderToEdit.pharmacyId) || null,
          receiver: editDraft.receiver || receivers.find((r) => r.id === initialOrderToEdit.receiverId) || null,
          items: editDraft.items || [],
          additionalDiscountType: editDraft.additionalDiscountType || 'none',
          additionalDiscountValue: editDraft.additionalDiscountValue || 0,
          notes: editDraft.notes || '',
          searchQuery: editDraft.searchQuery || '',
          wasRestored: false,
        };
      }

      return {
        orderNumber: initialOrderToEdit.orderNumber,
        orderDate: initialOrderToEdit.date,
        pharmacy:
          pharmacies.find((p) => p.id === initialOrderToEdit.pharmacyId) || {
            id: initialOrderToEdit.pharmacyId,
            name: initialOrderToEdit.pharmacyName,
            area: initialOrderToEdit.pharmacyArea,
            createdAt: new Date().toISOString(),
          },
        receiver:
          receivers.find((r) => r.id === initialOrderToEdit.receiverId) || {
            id: initialOrderToEdit.receiverId,
            name: initialOrderToEdit.receiverName,
            createdAt: new Date().toISOString(),
          },
        items: initialOrderToEdit.items.map((i) => {
          const type: 'percent' | 'fixed' = i.discountType === 'fixed' ? 'fixed' : 'percent';
          const val = typeof i.discountValue === 'number' ? i.discountValue : 0;
          const calc = calculateItemAmounts(i.quantity, i.rate, type, val);
          return {
            ...i,
            grossAmount: calc.grossAmount,
            discountType: type,
            discountValue: calc.validDiscountValue,
            discountAmount: calc.discountAmount,
            amount: calc.amount,
          };
        }),
        additionalDiscountType: initialOrderToEdit.additionalDiscountType || 'none',
        additionalDiscountValue: initialOrderToEdit.additionalDiscountValue || 0,
        notes: initialOrderToEdit.notes || '',
        searchQuery: '',
        wasRestored: false,
      };
    }

    // New Order mode: load saved draft if available
    const savedDraft = DraftService.loadDraft();
    if (savedDraft && ((savedDraft.items && savedDraft.items.length > 0) || (savedDraft.notes && savedDraft.notes.trim()) || (savedDraft.searchQuery && savedDraft.searchQuery.trim()))) {
      return {
        orderNumber: savedDraft.orderNumber || StorageService.getNextOrderNumber(),
        orderDate: savedDraft.orderDate || new Date().toISOString(),
        pharmacy: savedDraft.pharmacy || (pharmacies.length > 0 ? pharmacies[0] : null),
        receiver: savedDraft.receiver || (receivers.length > 0 ? receivers[0] : null),
        items: savedDraft.items || [],
        additionalDiscountType: savedDraft.additionalDiscountType || 'none',
        additionalDiscountValue: savedDraft.additionalDiscountValue || 0,
        notes: savedDraft.notes || '',
        searchQuery: savedDraft.searchQuery || '',
        wasRestored: savedDraft.items && savedDraft.items.length > 0,
      };
    }

    return {
      orderNumber: StorageService.getNextOrderNumber(),
      orderDate: new Date().toISOString(),
      pharmacy: pharmacies.length > 0 ? pharmacies[0] : null,
      receiver: receivers.length > 0 ? receivers[0] : null,
      items: [],
      additionalDiscountType: 'none' as const,
      additionalDiscountValue: 0,
      notes: '',
      searchQuery: '',
      wasRestored: false,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Order Identification
  const [orderNumber, setOrderNumber] = useState<string>(initialData.orderNumber);
  const [orderDate, setOrderDate] = useState<string>(initialData.orderDate);

  // Selected Entities
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(initialData.pharmacy);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(initialData.receiver);

  // Last used discount type remembered in localStorage for rapid entry
  const [lastDiscountType, setLastDiscountType] = useState<'percent' | 'fixed'>(() => {
    try {
      const saved = localStorage.getItem('orderdesk_last_discount_type');
      return saved === 'fixed' ? 'fixed' : 'percent';
    } catch {
      return 'percent';
    }
  });

  // Items in Order with normalized per-item discount properties
  const [items, setItems] = useState<OrderItem[]>(initialData.items);

  // Optional extra order-level discount
  const [additionalDiscountType, setAdditionalDiscountType] = useState<'none' | 'percent' | 'fixed'>(
    initialData.additionalDiscountType
  );
  const [additionalDiscountValue, setAdditionalDiscountValue] = useState<number>(
    initialData.additionalDiscountValue
  );

  const [notes, setNotes] = useState<string>(initialData.notes);
  const [showNotesField, setShowNotesField] = useState(Boolean(initialData.notes));
  const [showDiscountField, setShowDiscountField] = useState(
    Boolean(initialData.additionalDiscountValue && initialData.additionalDiscountValue > 0)
  );

  // Fast Medicine Search State
  const [searchQuery, setSearchQuery] = useState(initialData.searchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Show banner if we restored items from localStorage on initial load
  useEffect(() => {
    if (initialData.wasRestored && !initialOrderToEdit) {
      setRestoredBannerVisible(true);
    }
  }, [initialData.wasRestored, initialOrderToEdit]);

  // Notify parent of draft item count for bottom nav badge
  useEffect(() => {
    if (!initialOrderToEdit) {
      onDraftCountChange?.(items.length);
    } else {
      onDraftCountChange?.(0);
    }
  }, [items.length, initialOrderToEdit, onDraftCountChange]);

  // =========================================================================
  // AUTO-SAVE: Save on every state change + visibilitychange, pagehide, beforeunload
  // =========================================================================
  const persistCurrentState = useCallback(
    (immediate = false) => {
      if (initialOrderToEdit) {
        // Save to separate edit order draft key
        const editDraft: EditOrderDraftState = {
          originalOrderId: initialOrderToEdit.id,
          orderNumber,
          orderDate,
          pharmacy: selectedPharmacy,
          receiver: selectedReceiver,
          items,
          additionalDiscountType,
          additionalDiscountValue,
          notes,
          searchQuery,
          lastUpdated: new Date().toISOString(),
        };
        DraftService.saveEditDraft(editDraft);
      } else {
        // Save to primary and backup draft keys
        const draft: DraftOrderState = {
          orderNumber,
          orderDate,
          pharmacy: selectedPharmacy,
          receiver: selectedReceiver,
          items,
          additionalDiscountType,
          additionalDiscountValue,
          notes,
          searchQuery,
          lastUpdated: new Date().toISOString(),
        };
        if (immediate) {
          DraftService.saveDraftImmediate(draft);
        } else {
          DraftService.saveDraftDebounced(draft, 200);
        }
      }
    },
    [
      initialOrderToEdit,
      orderNumber,
      orderDate,
      selectedPharmacy,
      selectedReceiver,
      items,
      additionalDiscountType,
      additionalDiscountValue,
      notes,
      searchQuery,
    ]
  );

  // Auto-save on state change
  useEffect(() => {
    persistCurrentState(false);
  }, [persistCurrentState]);

  // Auto-save immediately on tab switch, window blur, pagehide, beforeunload
  useEffect(() => {
    const handleFlushSave = () => {
      persistCurrentState(true);
      DraftService.flush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlushSave();
      }
    };

    window.addEventListener('beforeunload', handleFlushSave);
    window.addEventListener('pagehide', handleFlushSave);
    window.addEventListener('blur', handleFlushSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      handleFlushSave();
      window.removeEventListener('beforeunload', handleFlushSave);
      window.removeEventListener('pagehide', handleFlushSave);
      window.removeEventListener('blur', handleFlushSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [persistCurrentState]);

  // Fast Keyboard Entry Chain State
  const [chainedItemId, setChainedItemId] = useState<string | null>(null);
  const [chainedStep, setChainedStep] = useState<'quantity' | 'discount' | null>(null);
  const [shakeItemId, setShakeItemId] = useState<string | null>(null);

  // Buffer raw input values so typing isn't interrupted by premature number parsing
  const [rawQtyInputs, setRawQtyInputs] = useState<Record<string, string>>({});
  const [rawDiscountInputs, setRawDiscountInputs] = useState<Record<string, string>>({});
  const [rawRateInputs, setRawRateInputs] = useState<Record<string, string>>({});

  // Modals
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false);
  const [isQuickItemModalOpen, setIsQuickItemModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  // Compact items list interactive states
  const [justAddedItemId, setJustAddedItemId] = useState<string | null>(null);
  const justAddedTimeoutRef = useRef<number | null>(null);
  const [expandedDiscountItemId, setExpandedDiscountItemId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (justAddedTimeoutRef.current) {
        window.clearTimeout(justAddedTimeoutRef.current);
      }
    };
  }, []);

  // Element References for Fast Keyboard Navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const qtyInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const discountInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const rateInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Update when initialOrderToEdit changes (e.g. from history edit or duplicate)
  useEffect(() => {
    if (initialOrderToEdit) {
      setOrderNumber(initialOrderToEdit.orderNumber);
      setOrderDate(initialOrderToEdit.date);
      setItems(
        initialOrderToEdit.items.map((i) => {
          const type: 'percent' | 'fixed' = i.discountType === 'fixed' ? 'fixed' : 'percent';
          const val = typeof i.discountValue === 'number' ? i.discountValue : 0;
          const calc = calculateItemAmounts(i.quantity, i.rate, type, val);
          return {
            ...i,
            grossAmount: calc.grossAmount,
            discountType: type,
            discountValue: calc.validDiscountValue,
            discountAmount: calc.discountAmount,
            amount: calc.amount,
          };
        })
      );
      setAdditionalDiscountType(initialOrderToEdit.additionalDiscountType || 'none');
      setAdditionalDiscountValue(initialOrderToEdit.additionalDiscountValue || 0);
      setNotes(initialOrderToEdit.notes || '');
      setShowNotesField(Boolean(initialOrderToEdit.notes));
      setShowDiscountField(Boolean(initialOrderToEdit.additionalDiscountAmount && initialOrderToEdit.additionalDiscountAmount > 0));

      const pharma = pharmacies.find((p) => p.id === initialOrderToEdit.pharmacyId);
      if (pharma) setSelectedPharmacy(pharma);

      const rec = receivers.find((r) => r.id === initialOrderToEdit.receiverId);
      if (rec) setSelectedReceiver(rec);
    }
  }, [initialOrderToEdit, pharmacies, receivers]);

  // Click outside listener for discrete More Options menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query for high-performance suggestion list rendering (150ms)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Smart suggestions with fuzzy & partial match anywhere in name or strength
  const suggestions = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const matches = medicines.filter((m) => {
      const full = `${m.name} ${m.strength || ''}`.toLowerCase();
      return full.includes(q);
    });

    // Rank: starts with query first, then anywhere in name, then strength
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    });

    return matches; // Return all matches, paginated via Show More
  }, [medicines, debouncedQuery]);

  // "Show More" pagination hooks for Ordered Items & Suggestions
  const orderedItemsPagination = useShowMore(items.length, 10, 10);
  const suggestionsPagination = useShowMore(suggestions.length, 10, 10);

  // Totals calculations: Gross Subtotal, Item Discounts Sum, Additional Discount, Grand Total
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (typeof item.grossAmount === 'number' ? item.grossAmount : item.quantity * item.rate),
      0
    );
  }, [items]);

  const itemDiscountsTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  }, [items]);

  const additionalDiscountAmount = useMemo(() => {
    const remaining = Math.max(0, subtotal - itemDiscountsTotal);
    if (additionalDiscountType === 'percent') {
      const val = Math.min(100, Math.max(0, additionalDiscountValue));
      return Math.round(((remaining * val) / 100) * 100) / 100;
    }
    if (additionalDiscountType === 'fixed') {
      return Math.min(remaining, Math.max(0, additionalDiscountValue));
    }
    return 0;
  }, [subtotal, itemDiscountsTotal, additionalDiscountType, additionalDiscountValue]);

  const totalDiscount = Math.round((itemDiscountsTotal + additionalDiscountAmount) * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

  const totalBoxes = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  // FAST KEYBOARD ENTRY CHAIN: Automatic Focus Movement
  useEffect(() => {
    if (chainedItemId && chainedStep === 'quantity') {
      const timer = setTimeout(() => {
        const el = qtyInputRefs.current.get(chainedItemId);
        if (el) {
          el.focus();
          el.select();
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 30);
      return () => clearTimeout(timer);
    } else if (chainedItemId && chainedStep === 'discount') {
      const timer = setTimeout(() => {
        const el = discountInputRefs.current.get(chainedItemId);
        if (el) {
          el.focus();
          el.select();
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [chainedItemId, chainedStep, items]);

  // Step 1: Selecting a medicine (adds directly or increments, starts Enter chain)
  const handleSelectMedicine = (med: MedicineItem) => {
    let targetItemId = '';

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => i.medicineId === med.id);
      if (existingIdx !== -1) {
        // Medicine already exists in order: increment quantity instead of adding duplicate row
        const existing = prevItems[existingIdx];
        targetItemId = existing.id;
        const newQty = existing.quantity + 1;
        const calc = calculateItemAmounts(
          newQty,
          existing.rate,
          existing.discountType,
          existing.discountValue
        );
        const updatedItem: OrderItem = {
          ...existing,
          quantity: newQty,
          grossAmount: calc.grossAmount,
          discountAmount: calc.discountAmount,
          amount: calc.amount,
        };
        // Move existing item to top so it's directly visible
        return [updatedItem, ...prevItems.filter((_, i) => i !== existingIdx)];
      }

      // Add new item to the order
      const newId = `oi-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      targetItemId = newId;
      const discType = lastDiscountType;
      const calc = calculateItemAmounts(1, med.rate, discType, 0);
      const newItem: OrderItem = {
        id: newId,
        medicineId: med.id,
        name: med.name,
        strength: med.strength,
        rate: med.rate,
        quantity: 1,
        grossAmount: calc.grossAmount,
        discountType: discType,
        discountValue: 0,
        discountAmount: 0,
        amount: calc.amount,
      };
      return [newItem, ...prevItems];
    });

    // Haptic feedback (light vibration if supported)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }

    // Row visual highlight
    setTimeout(() => {
      if (targetItemId) {
        setJustAddedItemId(targetItemId);
        if (justAddedTimeoutRef.current) window.clearTimeout(justAddedTimeoutRef.current);
        justAddedTimeoutRef.current = window.setTimeout(() => setJustAddedItemId(null), 2200);

        // Initiate Enter-key chain: Step 2 focuses Quantity input
        setChainedItemId(targetItemId);
        setChainedStep('quantity');
      }
    }, 15);

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Keyboard navigation on search input (Arrow navigation, Enter selection, Escape)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen && searchQuery.trim()) setIsDropdownOpen(true);
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isDropdownOpen && searchQuery.trim()) setIsDropdownOpen(true);
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchQuery('');
      setIsDropdownOpen(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // Check highlighted or top suggestion
      let chosen: MedicineItem | undefined = suggestions[selectedIndex] || suggestions[0];

      // Synchronous instant lookup if debounced suggestion list hasn't updated yet
      if (!chosen) {
        chosen = medicines.find((m) => {
          const full = `${m.name} ${m.strength || ''}`.toLowerCase();
          return full.includes(q);
        });
      }

      if (chosen) {
        handleSelectMedicine(chosen);
      } else {
        // If no match found, open quick "Add as new item" form
        setIsQuickItemModalOpen(true);
      }
    }
  };

  // Quantity input handling
  const handleQtyChange = (itemId: string, valStr: string) => {
    setRawQtyInputs((prev) => ({ ...prev, [itemId]: valStr }));
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      handleUpdateItemQty(itemId, parsed);
    }
  };

  const handleQtyBlur = (itemId: string) => {
    setRawQtyInputs((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
    const item = items.find((i) => i.id === itemId);
    if (!item || item.quantity < 1) {
      handleUpdateItemQty(itemId, 1);
    }
  };

  // Step 2 Enter key: Validate quantity (must be >= 1) and advance to Discount input
  const handleQtyKeyDown = (itemId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items.find((i) => i.id === itemId);
      const qty = item ? item.quantity : 0;

      // Validation: Quantity must be at least 1. If empty or invalid, show subtle shake and keep focus there.
      if (!qty || qty < 1 || isNaN(qty)) {
        setShakeItemId(itemId);
        setTimeout(() => setShakeItemId(null), 400);
        const el = qtyInputRefs.current.get(itemId);
        el?.focus();
        el?.select();
        return;
      }

      // If this item is part of the newly added fast chain, advance to discount
      if (chainedItemId === itemId && chainedStep === 'quantity') {
        setExpandedDiscountItemId(itemId);
        setChainedStep('discount');
      } else {
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === 'Escape') {
      setChainedItemId(null);
      setChainedStep(null);
      searchInputRef.current?.focus();
    }
  };

  // Discount input handling
  const handleDiscountChange = (itemId: string, valStr: string) => {
    setRawDiscountInputs((prev) => ({ ...prev, [itemId]: valStr }));
    const parsed = parseFloat(valStr);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      handleUpdateItemDiscount(itemId, item.discountType, isNaN(parsed) ? 0 : parsed);
    }
  };

  const handleDiscountBlur = (itemId: string) => {
    setRawDiscountInputs((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Step 3 Enter key: Confirm discount, collapse editor, return cursor to search box (Step 4)
  const handleDiscountKeyDown = (itemId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      if (chainedItemId === itemId) {
        // Step 4: Cursor returns to search box (cleared and focused), ready for the next item
        setExpandedDiscountItemId(null);
        setChainedItemId(null);
        setChainedStep(null);
        setSearchQuery('');
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      } else {
        setExpandedDiscountItemId(null);
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === 'Escape') {
      setExpandedDiscountItemId(null);
      setChainedItemId(null);
      setChainedStep(null);
      searchInputRef.current?.focus();
    }
  };

  // Rate input handling
  const handleRateChange = (itemId: string, valStr: string) => {
    setRawRateInputs((prev) => ({ ...prev, [itemId]: valStr }));
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      handleUpdateItemRate(itemId, parsed);
    }
  };

  const handleRateBlur = (itemId: string) => {
    setRawRateInputs((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleRateKeyDown = (itemId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const qtyEl = qtyInputRefs.current.get(itemId);
      qtyEl?.focus();
      qtyEl?.select();
    }
  };

  // Updating quantity directly on item card/row
  const handleUpdateItemQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const calc = calculateItemAmounts(
          newQty,
          item.rate,
          item.discountType || 'percent',
          item.discountValue || 0
        );
        return {
          ...item,
          quantity: newQty,
          grossAmount: calc.grossAmount,
          discountAmount: calc.discountAmount,
          amount: calc.amount,
        };
      })
    );
  };

  // Updating rate directly on item row
  const handleUpdateItemRate = (itemId: string, newRate: number) => {
    const rate = Math.max(0, newRate);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const calc = calculateItemAmounts(
          item.quantity,
          rate,
          item.discountType || 'percent',
          item.discountValue || 0
        );
        return {
          ...item,
          rate,
          grossAmount: calc.grossAmount,
          discountAmount: calc.discountAmount,
          amount: calc.amount,
        };
      })
    );
  };

  // Dedicated Per-Item Discount updater
  const handleUpdateItemDiscount = (
    itemId: string,
    newType: 'percent' | 'fixed',
    newValue: number
  ) => {
    setLastDiscountType(newType);
    try {
      localStorage.setItem('orderdesk_last_discount_type', newType);
    } catch {}

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const calc = calculateItemAmounts(item.quantity, item.rate, newType, newValue);
        return {
          ...item,
          discountType: newType,
          discountValue: calc.validDiscountValue,
          discountAmount: calc.discountAmount,
          grossAmount: calc.grossAmount,
          amount: calc.amount,
        };
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Clearing current order draft
  const handleClearDraft = () => {
    setItems([]);
    setAdditionalDiscountType('none');
    setAdditionalDiscountValue(0);
    setNotes('');
    setSearchQuery('');
    const freshOrderNo = StorageService.getNextOrderNumber();
    const freshDate = new Date().toISOString();
    setOrderNumber(freshOrderNo);
    setOrderDate(freshDate);
    setIsClearConfirmOpen(false);
    setRestoredBannerVisible(false);

    if (initialOrderToEdit) {
      DraftService.clearEditDraft();
      if (onClearInitialOrder) onClearInitialOrder();
    } else {
      DraftService.clearDraft();
      onDraftCountChange?.(0);
    }

    onNotify('Order draft reset.', 'info');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Validate and Save Order (Protected against double-saving)
  const handleSaveOrder = async () => {
    if (isSaving) return;

    if (!selectedPharmacy) {
      onNotify('Please select a pharmacy before saving.', 'error');
      setIsPharmacyModalOpen(true);
      return;
    }

    if (items.length === 0) {
      onNotify('Please add at least one medicine item to the order.', 'error');
      searchInputRef.current?.focus();
      return;
    }

    setIsSaving(true);

    try {
      const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber: orderNumber || StorageService.getNextOrderNumber(),
        date: orderDate || new Date().toISOString(),
        pharmacyId: selectedPharmacy.id,
        pharmacyName: selectedPharmacy.name,
        pharmacyArea: selectedPharmacy.area,
        receiverId: selectedReceiver ? selectedReceiver.id : 'rec-default',
        receiverName: selectedReceiver ? selectedReceiver.name : 'Order Booking Rep',
        items,
        subtotal,
        itemDiscountsTotal,
        additionalDiscountType,
        additionalDiscountValue,
        additionalDiscountAmount,
        discountAmount: totalDiscount,
        grandTotal,
        notes: notes.trim() || undefined,
        status: 'saved',
      };

      const saved = StorageService.saveOrder(
        orderData,
        initialOrderToEdit ? initialOrderToEdit.id : undefined
      );

      // Clean up the draft completely upon successful save
      if (initialOrderToEdit) {
        DraftService.clearEditDraft();
        if (onClearInitialOrder) onClearInitialOrder();
      } else {
        DraftService.clearDraft();
        onDraftCountChange?.(0);
      }

      setRestoredBannerVisible(false);
      onOrderSaved(saved);
      setLastSavedOrder(saved);
      setIsSavedModalOpen(true);
    } catch (err) {
      console.error('Error saving order:', err);
      onNotify('Failed to save order. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Current draft object representation for actions
  const currentDraftOrder: Order = {
    id: initialOrderToEdit ? initialOrderToEdit.id : 'draft-temp',
    orderNumber: orderNumber || 'OD-DRAFT',
    date: orderDate,
    pharmacyId: selectedPharmacy ? selectedPharmacy.id : 'pharma-temp',
    pharmacyName: selectedPharmacy ? selectedPharmacy.name : 'Select Pharmacy',
    pharmacyArea: selectedPharmacy?.area,
    receiverId: selectedReceiver ? selectedReceiver.id : 'rec-temp',
    receiverName: selectedReceiver ? selectedReceiver.name : 'Booking Officer',
    items,
    subtotal,
    itemDiscountsTotal,
    additionalDiscountType,
    additionalDiscountValue,
    additionalDiscountAmount,
    discountAmount: totalDiscount,
    grandTotal,
    notes,
    status: 'saved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Discrete WhatsApp Share
  const handleShareWhatsAppDraft = async () => {
    setIsMoreMenuOpen(false);
    if (!selectedPharmacy) {
      onNotify('Select a pharmacy before sharing.', 'error');
      return;
    }
    if (items.length === 0) {
      onNotify('Add items before sharing.', 'error');
      return;
    }
    await shareOrderViaWhatsApp(currentDraftOrder);
  };

  // Download PDF
  const handleDownloadPdfDraft = () => {
    setIsMoreMenuOpen(false);
    if (!selectedPharmacy) {
      onNotify('Select a pharmacy before downloading PDF.', 'error');
      return;
    }
    if (items.length === 0) {
      onNotify('Add items before downloading PDF.', 'error');
      return;
    }
    downloadOrderPdf(currentDraftOrder);
    onNotify('Order PDF downloaded!', 'success');
  };

  // Copy Summary
  const handleCopySummaryDraft = async () => {
    setIsMoreMenuOpen(false);
    const ok = await copyOrderToClipboard(currentDraftOrder);
    if (ok) {
      onNotify('Order summary copied to clipboard!', 'success');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-4 space-y-3">
      {/* RESTORED DRAFT NON-BLOCKING BANNER */}
      {restoredBannerVisible && items.length > 0 && !initialOrderToEdit && (
        <div className="bg-amber-50/95 border border-amber-200/90 text-amber-900 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2 text-xs">
            <span className="p-1 rounded-full bg-amber-500 text-white shrink-0">
              <Sparkles className="w-3 h-3" />
            </span>
            <span>
              <strong>Draft restored</strong> ({items.length} item{items.length !== 1 ? 's' : ''} restored from your previous session)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-[11px] font-bold text-red-700 hover:text-red-800 bg-red-100/70 hover:bg-red-100 px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer"
            >
              Discard draft
            </button>
            <button
              type="button"
              onClick={() => setRestoredBannerVisible(false)}
              className="text-[11px] font-semibold text-amber-800/80 hover:text-amber-950 px-1.5 py-1 cursor-pointer"
              title="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER SECTION: Pharmacy, Receiver, Order #, Date, and Discreet Menu */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        {/* Pharmacy & Receiver Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Pharmacy Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <Store className="w-3 h-3 text-teal-800" />
                Pharmacy <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsPharmacyModalOpen(true)}
                className="text-[11px] font-bold text-teal-800 hover:text-teal-900 cursor-pointer"
              >
                + Change / Add
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsPharmacyModalOpen(true)}
              className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                selectedPharmacy
                  ? 'bg-teal-50/50 border-teal-200 hover:border-teal-300'
                  : 'bg-red-50/50 border-red-300 text-red-700'
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-xs text-slate-900 truncate block">
                  {selectedPharmacy ? selectedPharmacy.name : 'Select Pharmacy (Required)'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {selectedPharmacy?.area || 'Tap to choose or create new pharmacy'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Receiver Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-teal-800" />
                Booked By (Receiver)
              </label>
              <button
                type="button"
                onClick={() => setIsReceiverModalOpen(true)}
                className="text-[11px] font-bold text-teal-800 hover:text-teal-900 cursor-pointer"
              >
                + Change / Add
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsReceiverModalOpen(true)}
              className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 flex items-center justify-between transition cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-xs text-slate-800 truncate block">
                  {selectedReceiver ? selectedReceiver.name : 'Select Booking Officer'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  {selectedReceiver?.role || 'Field Sales Rep'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Order Meta Strip & Discreet More Options */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Order #</span>
              <span className="font-mono font-bold text-teal-900 text-xs">{orderNumber}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Date &amp; Time</span>
              <span className="font-medium text-slate-700 text-xs">{formatDateTime(orderDate)}</span>
            </div>
          </div>

          {/* DISCREET "⋮" MORE OPTIONS MENU (Hidden WhatsApp Share per user requirement #7) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-8 z-40 w-48 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                {/* 1. Hidden WhatsApp Share */}
                <button
                  type="button"
                  onClick={handleShareWhatsAppDraft}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share on WhatsApp</span>
                </button>

                {/* 2. Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdfDraft}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-teal-600" />
                  <span>Download PDF Sheet</span>
                </button>

                {/* 3. Copy Text Summary */}
                <button
                  type="button"
                  onClick={handleCopySummaryDraft}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text Summary</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* 4. Reset Draft */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    if (items.length > 0) {
                      setIsClearConfirmOpen(true);
                    } else {
                      handleClearDraft();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                  <span>Clear Current Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. FAST ORDER ENTRY: Auto-focused Search Field at Top (Most Important Feature) */}
      <div className="relative z-20">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-700" />
          <input
            ref={searchInputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            placeholder="Type medicine name (e.g. Ryzik, Panadol)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-11 pr-24 py-3 sm:py-3.5 bg-white border-2 border-teal-700/60 rounded-2xl text-base sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-sm focus:outline-none focus:border-teal-800 focus:ring-4 focus:ring-teal-700/15 transition"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-1"
            >
              Clear
            </button>
          )}

          {/* Inline quick + New Medicine button */}
          <button
            type="button"
            onClick={() => setIsQuickItemModalOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
            title="Add medicine not in catalog"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* SMART INSTANT SUGGESTIONS DROPDOWN */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 z-50">
            {suggestions.length > 0 ? (
              <>
                {suggestions.slice(0, suggestionsPagination.visibleCount).map((med, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleSelectMedicine(med)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 text-teal-950 font-medium'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{med.name}</span>
                          {med.strength && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {med.strength}
                            </span>
                          )}
                          {med.packSize && (
                            <span className="text-[10px] text-slate-400 hidden xs:inline">
                              {med.packSize}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-teal-800 font-bold mt-0.5">
                          Rs. {med.rate.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-500">/ box</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-teal-800 font-semibold text-xs">
                        <span className="hidden sm:inline text-[11px] text-slate-400 font-normal">
                          Tap or Enter
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </button>
                  );
                })}

                <ShowMoreButton
                  totalCount={suggestions.length}
                  visibleCount={suggestionsPagination.visibleCount}
                  onShowMore={suggestionsPagination.showMore}
                  onShowLess={suggestionsPagination.showLess}
                />
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-600">
                  No medicine matches &ldquo;<span className="font-bold text-slate-900">{searchQuery}</span>&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setIsQuickItemModalOpen(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add &ldquo;{searchQuery}&rdquo; as new item
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. ULTRA-COMPACT ORDERED ITEMS LIST (Handles 50+ items smoothly) */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Ordered Medicines
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-800 text-white">
              {items.length}
            </span>
          </div>

          {items.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              {totalBoxes} total box{totalBoxes !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50/80 border border-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No items added yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Type any medicine name in the search bar above. Suggestions appear instantly and can be added in 2 taps.
            </p>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-100/90">
              {items.slice(0, orderedItemsPagination.visibleCount).map((item, index) => {
                const isNewlyAdded = item.id === justAddedItemId;
                const isDiscountExpanded = expandedDiscountItemId === item.id;
                const hasDiscount = item.discountAmount > 0;

                return (
                  <div
                    key={item.id}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '58px' }}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 transition-colors ${
                      isNewlyAdded
                        ? 'bg-emerald-50/95 ring-1 ring-inset ring-emerald-400'
                        : index % 2 === 0
                        ? 'bg-white/85 hover:bg-teal-50/40'
                        : 'bg-slate-50/70 hover:bg-teal-50/40'
                    }`}
                  >
                  {/* Line 1: serial no. + medicine name (truncated) + small strength tag */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 w-4.5 shrink-0 select-none">
                      {index + 1}.
                    </span>
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate min-w-0 flex-1">
                      {item.name}
                    </h4>
                    {item.strength && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100/90 text-slate-600 border border-slate-200/70 shrink-0">
                        {item.strength}
                      </span>
                    )}
                  </div>

                  {/* Line 2: Rate input (small), [-] qty [+] stepper (compact), discount chip, Net Amount (bold, right-aligned), trash icon (small) */}
                  <div className="flex items-center justify-between gap-1 mt-1 pt-0.5">
                    {/* Left inline controls */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Rate input */}
                      <div className="inline-flex items-center gap-0.5 bg-white border border-slate-200/90 rounded px-1 py-0.5 shadow-2xs">
                        <span className="text-[10px] font-medium text-slate-400">Rs.</span>
                        <input
                          ref={(el) => {
                            if (el) rateInputRefs.current.set(item.id, el);
                            else rateInputRefs.current.delete(item.id);
                          }}
                          type="text"
                          inputMode="decimal"
                          enterKeyHint="next"
                          value={rawRateInputs[item.id] !== undefined ? rawRateInputs[item.id] : item.rate}
                          onChange={(e) => handleRateChange(item.id, e.target.value)}
                          onBlur={() => handleRateBlur(item.id)}
                          onKeyDown={(e) => handleRateKeyDown(item.id, e)}
                          className="w-13 sm:w-15 text-xs font-bold text-slate-800 bg-transparent text-center focus:outline-none focus:text-teal-900 focus:bg-teal-50/50 rounded"
                          title="Rate per box"
                        />
                      </div>

                      {/* Stepper [-] qty [+] */}
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center transition cursor-pointer touch-manipulation"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          ref={(el) => {
                            if (el) qtyInputRefs.current.set(item.id, el);
                            else qtyInputRefs.current.delete(item.id);
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          enterKeyHint="next"
                          value={rawQtyInputs[item.id] !== undefined ? rawQtyInputs[item.id] : item.quantity}
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => handleQtyBlur(item.id)}
                          onKeyDown={(e) => handleQtyKeyDown(item.id, e)}
                          className={`w-9 sm:w-10 h-7 sm:h-7.5 text-center text-xs font-extrabold text-slate-900 bg-white border rounded shadow-2xs transition-all ${
                            chainedItemId === item.id && chainedStep === 'quantity'
                              ? 'ring-2 ring-teal-600 border-teal-700 bg-teal-50/80'
                              : 'border-slate-200/90 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                          } ${shakeItemId === item.id ? 'animate-shake border-red-500 ring-2 ring-red-400 bg-red-50' : ''}`}
                          title="Boxes quantity"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded bg-teal-800 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center transition cursor-pointer touch-manipulation"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Item discount collapsed chip: "% Disc" or "5% off" in green */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDiscountItemId((prev) => (prev === item.id ? null : item.id))
                        }
                        className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer touch-manipulation flex items-center gap-0.5 ${
                          hasDiscount
                            ? 'font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100'
                            : 'font-semibold bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-800'
                        }`}
                        title="Toggle item discount editor"
                      >
                        <Tag className="w-2.5 h-2.5 shrink-0" />
                        <span>
                          {hasDiscount
                            ? item.discountType === 'percent'
                              ? `${item.discountValue}% off`
                              : `Rs. ${item.discountValue} off`
                            : '% Disc'}
                        </span>
                      </button>
                    </div>

                    {/* Right: Net Amount (bold, right-aligned) + trash icon (small) */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="font-extrabold text-xs sm:text-sm text-teal-950 text-right whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer touch-manipulation"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Mini Discount Editor (Collapsed by default, opens directly under row) */}
                  {isDiscountExpanded && (
                    <div className="mt-1.5 pt-1.5 pb-0.5 border-t border-dashed border-teal-200/80 bg-teal-50/50 -mx-3 px-3 sm:-mx-4 sm:px-4 flex items-center justify-between gap-2 flex-wrap text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-teal-900">Discount:</span>
                        {/* Segmented Toggle: [ % ] [ Rs. ] - Prevents taking focus away from discount input */}
                        <div className="inline-flex rounded-md border border-teal-200 bg-white p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              handleUpdateItemDiscount(item.id, 'percent', item.discountValue);
                              discountInputRefs.current.get(item.id)?.focus();
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer min-h-[26px] ${
                              item.discountType === 'percent'
                                ? 'bg-teal-800 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              handleUpdateItemDiscount(item.id, 'fixed', item.discountValue);
                              discountInputRefs.current.get(item.id)?.focus();
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer min-h-[26px] ${
                              item.discountType === 'fixed'
                                ? 'bg-teal-800 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Rs.
                          </button>
                        </div>

                        {/* Numeric Input for Discount Value */}
                        <div className="flex items-center gap-1">
                          <input
                            ref={(el) => {
                              if (el) discountInputRefs.current.set(item.id, el);
                              else discountInputRefs.current.delete(item.id);
                            }}
                            type="text"
                            inputMode="decimal"
                            enterKeyHint="next"
                            value={
                              rawDiscountInputs[item.id] !== undefined
                                ? rawDiscountInputs[item.id]
                                : item.discountValue === 0
                                ? ''
                                : String(item.discountValue)
                            }
                            placeholder="0"
                            onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => handleDiscountBlur(item.id)}
                            onKeyDown={(e) => handleDiscountKeyDown(item.id, e)}
                            className={`w-16 px-1.5 py-0.5 text-xs font-bold text-slate-900 bg-white border rounded text-center shadow-2xs transition-all ${
                              chainedItemId === item.id && chainedStep === 'discount'
                                ? 'ring-2 ring-teal-600 border-teal-700 bg-teal-50/80'
                                : 'border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-700'
                            }`}
                          />
                          <span className="text-[10px] font-semibold text-slate-500">
                            {item.discountType === 'percent' ? '%' : 'Rs.'}
                          </span>
                        </div>

                        {/* Live calculation preview */}
                        {item.discountAmount > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Saved {formatCurrency(item.discountAmount)} (
                            {formatCurrency(item.grossAmount)} → {formatCurrency(item.amount)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {item.discountValue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItemDiscount(item.id, item.discountType, 0);
                              setExpandedDiscountItemId(null);
                            }}
                            className="text-[11px] text-slate-500 hover:text-red-600 px-1.5 py-0.5 cursor-pointer font-medium"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedDiscountItemId(null);
                            if (chainedItemId === item.id) {
                              setChainedItemId(null);
                              setChainedStep(null);
                              searchInputRef.current?.focus();
                            }
                          }}
                          className="px-2.5 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1 min-h-[26px]"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <ShowMoreButton
            totalCount={items.length}
            visibleCount={orderedItemsPagination.visibleCount}
            onShowMore={orderedItemsPagination.showMore}
            onShowLess={orderedItemsPagination.showLess}
          />
        </div>
      )}
    </div>

    {/* 5. SUMMARY & OPTIONAL ORDER-LEVEL DISCOUNT & DELIVERY NOTES */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
        {/* Order Totals Summary Card */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal (before discounts):</span>
            <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
          </div>

          {itemDiscountsTotal > 0 && (
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <span>Item Discounts Total:</span>
              <span className="font-bold">-{formatCurrency(itemDiscountsTotal)}</span>
            </div>
          )}

          {additionalDiscountAmount > 0 && (
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <span>
                Additional Order Discount{' '}
                {additionalDiscountType === 'percent' ? `(${additionalDiscountValue}%)` : ''}:
              </span>
              <span className="font-bold">-{formatCurrency(additionalDiscountAmount)}</span>
            </div>
          )}

          {totalDiscount > 0 && (
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-emerald-800">
              <span>Total Savings &amp; Discounts:</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-sm font-black text-teal-950">
            <span>Final Grand Total:</span>
            <span className="text-base text-teal-800">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Action Toggles: Additional Order Discount & Delivery Notes */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDiscountField((v) => !v)}
            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              showDiscountField || additionalDiscountAmount > 0
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-teal-700" />
            <span>
              {additionalDiscountAmount > 0
                ? `Extra Disc: -${formatCurrency(additionalDiscountAmount)}`
                : '+ Extra Order Discount'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowNotesField((v) => !v)}
            className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              showNotesField || notes
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5 text-teal-700" />
            <span>{notes ? 'Order Notes (Added)' : '+ Order Notes'}</span>
          </button>
        </div>

        {/* Extra Order Discount Configuration */}
        {showDiscountField && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase">
                Additional Order Discount (Applied over entire order)
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdditionalDiscountValue(0);
                  setAdditionalDiscountType('none');
                  setShowDiscountField(false);
                }}
                className="text-[11px] text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setAdditionalDiscountType('fixed')}
                  className={`px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    additionalDiscountType === 'fixed'
                      ? 'bg-teal-800 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Rs. Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setAdditionalDiscountType('percent')}
                  className={`px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    additionalDiscountType === 'percent'
                      ? 'bg-teal-800 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  % Percent
                </button>
              </div>

              <input
                type="number"
                min="0"
                placeholder={additionalDiscountType === 'percent' ? 'e.g. 5%' : 'e.g. 200'}
                value={additionalDiscountValue || ''}
                onChange={(e) => setAdditionalDiscountValue(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>
        )}

        {/* Delivery notes field */}
        {showNotesField && (
          <div className="animate-in fade-in duration-100">
            <textarea
              rows={2}
              placeholder="e.g. Deliver before 2:00 PM; Cash on Delivery; Include duplicate invoice copy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
            />
          </div>
        )}
      </div>

      {/* 6. STICKY BOTTOM ACTION BAR: Live Grand Total & Save Order */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Live Grand Total & Items counter */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium leading-none">
              <span>{items.length} items</span>
              <span>•</span>
              <span>{totalBoxes} boxes</span>
              <span>•</span>
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              {totalDiscount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Disc: -{formatCurrency(totalDiscount)}
                  </span>
                </>
              )}
            </div>
            <div className="text-lg sm:text-xl font-black text-teal-950 tracking-tight mt-1">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={items.length === 0 || isSaving}
              className={`py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
                items.length > 0 && !isSaving
                  ? 'bg-teal-800 hover:bg-teal-700 text-white shadow-teal-950/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSaving ? 'Saving...' : 'Save Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Sheets */}
      <PharmacySelectModal
        isOpen={isPharmacyModalOpen}
        selectedPharmacyId={selectedPharmacy?.id}
        pharmacies={pharmacies}
        onSelect={(p) => {
          setSelectedPharmacy(p);
          setIsPharmacyModalOpen(false);
        }}
        onAddNewPharmacy={onPharmacyAdded}
        onClose={() => setIsPharmacyModalOpen(false)}
      />

      <ReceiverSelectModal
        isOpen={isReceiverModalOpen}
        selectedReceiverId={selectedReceiver?.id}
        receivers={receivers}
        onSelect={(r) => {
          setSelectedReceiver(r);
          setIsReceiverModalOpen(false);
        }}
        onAddNewReceiver={onReceiverAdded}
        onClose={() => setIsReceiverModalOpen(false)}
      />

      <QuickItemModal
        isOpen={isQuickItemModalOpen}
        initialName={searchQuery}
        onSave={(newMed) => {
          const created = onMedicineAdded(newMed);
          handleSelectMedicine(created);
          setIsQuickItemModalOpen(false);
          return created;
        }}
        onClose={() => setIsQuickItemModalOpen(false)}
      />

      <OrderSavedModal
        order={lastSavedOrder}
        isOpen={isSavedModalOpen}
        onStartNewOrder={() => {
          setIsSavedModalOpen(false);
          handleClearDraft();
        }}
        onViewHistory={() => {
          setIsSavedModalOpen(false);
          onViewHistory();
        }}
        onClose={() => setIsSavedModalOpen(false)}
        onNotify={onNotify}
      />

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Clear Current Order?"
        message="This will reset all medicines entered in this draft. This cannot be undone."
        confirmLabel="Yes, Clear Order"
        onConfirm={handleClearDraft}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
