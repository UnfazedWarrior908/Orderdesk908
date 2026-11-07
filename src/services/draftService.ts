import { Pharmacy, Receiver, OrderItem } from '../types';

export interface DraftOrderState {
  orderNumber: string;
  orderDate: string;
  pharmacy: Pharmacy | null;
  receiver: Receiver | null;
  items: OrderItem[];
  additionalDiscountType: 'none' | 'percent' | 'fixed';
  additionalDiscountValue: number;
  notes: string;
  searchQuery: string;
  lastUpdated: string;
  scrollPosition?: number;
}

export interface EditOrderDraftState {
  originalOrderId: string;
  orderNumber: string;
  orderDate: string;
  pharmacy: Pharmacy | null;
  receiver: Receiver | null;
  items: OrderItem[];
  additionalDiscountType: 'none' | 'percent' | 'fixed';
  additionalDiscountValue: number;
  notes: string;
  searchQuery: string;
  lastUpdated: string;
}

const PRIMARY_KEY = 'orderdesk_draft_order_primary_v1';
const BACKUP_KEY = 'orderdesk_draft_order_backup_v1';
const EDIT_DRAFT_KEY = 'orderdesk_edit_order_draft_v1';

let memoryDraft: DraftOrderState | null = null;
let saveTimeout: number | null = null;

export const DraftService = {
  /**
   * Save draft with dual-key redundancy (primary + backup)
   */
  saveDraftImmediate(draft: DraftOrderState): void {
    memoryDraft = draft;
    try {
      const serialized = JSON.stringify(draft);
      localStorage.setItem(PRIMARY_KEY, serialized);
      // Secondary key prevents data loss if write is interrupted
      localStorage.setItem(BACKUP_KEY, serialized);
    } catch (err) {
      console.error('Failed to save draft to storage:', err);
    }
  },

  /**
   * Debounced save (max 300ms) for high frequency typing (search, discount, notes)
   */
  saveDraftDebounced(draft: DraftOrderState, delay = 250): void {
    memoryDraft = draft;
    if (saveTimeout !== null) {
      window.clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
      DraftService.saveDraftImmediate(draft);
      saveTimeout = null;
    }, delay);
  },

  /**
   * Force flush any pending debounced save
   */
  flush(): void {
    if (saveTimeout !== null) {
      window.clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (memoryDraft) {
      DraftService.saveDraftImmediate(memoryDraft);
    }
  },

  /**
   * Retrieve saved draft, falling back to backup key if primary is corrupt
   */
  loadDraft(): DraftOrderState | null {
    if (memoryDraft) {
      return memoryDraft;
    }

    // Try primary key
    try {
      const primaryRaw = localStorage.getItem(PRIMARY_KEY);
      if (primaryRaw) {
        const parsed = JSON.parse(primaryRaw) as DraftOrderState;
        if (parsed && Array.isArray(parsed.items)) {
          memoryDraft = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Primary draft corrupted, trying backup key...', err);
    }

    // Fallback to secondary key
    try {
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (backupRaw) {
        const parsed = JSON.parse(backupRaw) as DraftOrderState;
        if (parsed && Array.isArray(parsed.items)) {
          memoryDraft = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.error('Backup draft also invalid or corrupted:', err);
    }

    return null;
  },

  /**
   * Clear draft from memory and both localStorage keys
   */
  clearDraft(): void {
    if (saveTimeout !== null) {
      window.clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    memoryDraft = null;
    try {
      localStorage.removeItem(PRIMARY_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch (err) {
      console.error('Error clearing draft:', err);
    }
  },

  /**
   * Checks if an active uncommitted draft with items or custom input exists
   */
  hasDraftWithContent(): boolean {
    const draft = DraftService.loadDraft();
    if (!draft) return false;
    return (
      (draft.items && draft.items.length > 0) ||
      Boolean(draft.notes && draft.notes.trim()) ||
      Boolean(draft.searchQuery && draft.searchQuery.trim())
    );
  },

  // --- SEPARATE DRAFT STORAGE FOR EDITING PAST ORDERS ---
  saveEditDraft(draft: EditOrderDraftState): void {
    try {
      localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.error('Failed to save edit draft:', err);
    }
  },

  loadEditDraft(): EditOrderDraftState | null {
    try {
      const raw = localStorage.getItem(EDIT_DRAFT_KEY);
      if (raw) {
        return JSON.parse(raw) as EditOrderDraftState;
      }
    } catch (err) {
      console.error('Failed to load edit draft:', err);
    }
    return null;
  },

  clearEditDraft(): void {
    try {
      localStorage.removeItem(EDIT_DRAFT_KEY);
    } catch (err) {
      console.error('Failed to clear edit draft:', err);
    }
  },
};
