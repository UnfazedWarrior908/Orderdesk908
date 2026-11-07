import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Pharmacy, Receiver, MedicineItem, Order } from './types';
import { StorageService } from './services/storage';
import { DraftService } from './services/draftService';
import { Header } from './components/common/Header';
import { FloralBackground } from './components/common/FloralBackground';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { NewOrderScreen } from './components/orders/NewOrderScreen';
import { HistoryScreen } from './components/history/HistoryScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { ItemsScreen } from './components/items/ItemsScreen';
import { PharmaciesScreen } from './components/pharmacies/PharmaciesScreen';
import { ReceiversScreen } from './components/receivers/ReceiversScreen';
import { BackupModal } from './components/backup/BackupModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const isOnline = useOnlineStatus();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('new-order');

  // Application Data in browser state
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Draft state for editing / duplicating
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  // Modals & Toasts
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Track draft item count for bottom nav badge
  const [draftItemCount, setDraftItemCount] = useState<number>(() => {
    const d = DraftService.loadDraft();
    return d && d.items ? d.items.length : 0;
  });

  // Load data from localStorage on mount
  const refreshData = useCallback(() => {
    StorageService.init();
    setPharmacies(StorageService.getPharmacies());
    setReceivers(StorageService.getReceivers());
    setMedicines(StorageService.getMedicines());
    setOrders(StorageService.getOrders());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Toast notification helper
  const notify = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Pharmacy Handlers
  const handleAddPharmacy = (data: Omit<Pharmacy, 'id' | 'createdAt'>): Pharmacy => {
    const saved = StorageService.savePharmacy(data);
    setPharmacies(StorageService.getPharmacies());
    return saved;
  };

  const handleUpdatePharmacy = (id: string, data: Omit<Pharmacy, 'id' | 'createdAt'>) => {
    StorageService.savePharmacy(data, id);
    setPharmacies(StorageService.getPharmacies());
  };

  const handleDeletePharmacy = (id: string) => {
    StorageService.deletePharmacy(id);
    setPharmacies(StorageService.getPharmacies());
  };

  // Receiver Handlers
  const handleAddReceiver = (data: Omit<Receiver, 'id' | 'createdAt'>): Receiver => {
    const saved = StorageService.saveReceiver(data);
    setReceivers(StorageService.getReceivers());
    return saved;
  };

  const handleUpdateReceiver = (id: string, data: Omit<Receiver, 'id' | 'createdAt'>) => {
    StorageService.saveReceiver(data, id);
    setReceivers(StorageService.getReceivers());
  };

  const handleDeleteReceiver = (id: string) => {
    StorageService.deleteReceiver(id);
    setReceivers(StorageService.getReceivers());
  };

  // Medicine Handlers
  const handleAddMedicine = (data: Omit<MedicineItem, 'id' | 'createdAt'>): MedicineItem => {
    const saved = StorageService.saveMedicine(data);
    setMedicines(StorageService.getMedicines());
    return saved;
  };

  const handleUpdateMedicine = (id: string, data: Omit<MedicineItem, 'id' | 'createdAt'>) => {
    StorageService.saveMedicine(data, id);
    setMedicines(StorageService.getMedicines());
  };

  const handleDeleteMedicine = (id: string) => {
    StorageService.deleteMedicine(id);
    setMedicines(StorageService.getMedicines());
  };

  // Order Handlers
  const handleOrderSaved = (_order: Order) => {
    setOrders(StorageService.getOrders());
    notify(`Order ${_order.orderNumber} saved successfully!`, 'success');
  };

  const handleDeleteOrder = (orderId: string) => {
    StorageService.deleteOrder(orderId);
    setOrders(StorageService.getOrders());
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setActiveTab('new-order');
    notify(`Editing Order ${order.orderNumber}`, 'info');
  };

  const handleDuplicateOrder = (order: Order) => {
    const newOrderNumber = StorageService.getNextOrderNumber();
    const duplicated: Order = {
      ...order,
      id: '',
      orderNumber: newOrderNumber,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrderToEdit(duplicated);
    setActiveTab('new-order');
    notify(`Duplicated items into new Order ${newOrderNumber}`, 'success');
  };

  const handleSelectPharmacyForOrder = (pharma: Pharmacy) => {
    const freshOrder: Order = {
      id: '',
      orderNumber: StorageService.getNextOrderNumber(),
      date: new Date().toISOString(),
      pharmacyId: pharma.id,
      pharmacyName: pharma.name,
      pharmacyArea: pharma.area,
      receiverId: receivers[0]?.id || 'rec-1',
      receiverName: receivers[0]?.name || 'Muhammad Ali',
      items: [],
      subtotal: 0,
      itemDiscountsTotal: 0,
      additionalDiscountType: 'none',
      additionalDiscountValue: 0,
      additionalDiscountAmount: 0,
      discountAmount: 0,
      grandTotal: 0,
      status: 'saved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrderToEdit(freshOrder);
    setActiveTab('new-order');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans relative selection:bg-teal-200">
      {/* Soft Watercolor Floral Background (Fixed Leaves & Pink Flowers) */}
      <FloralBackground />

      {/* Top Application Header */}
      <Header onOpenBackup={() => setIsBackupModalOpen(true)} />

      {/* Offline Toast Banner if device loses connection */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center shadow-xs flex items-center justify-center gap-2 relative z-20">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode Active — All orders and medicines saved locally on device.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10">
        {/* Keep NewOrderScreen permanently mounted so tab switching NEVER resets in-memory draft state */}
        <div className={activeTab === 'new-order' ? 'block' : 'hidden'}>
          <NewOrderScreen
            pharmacies={pharmacies}
            receivers={receivers}
            medicines={medicines}
            onPharmacyAdded={handleAddPharmacy}
            onReceiverAdded={handleAddReceiver}
            onMedicineAdded={handleAddMedicine}
            onOrderSaved={handleOrderSaved}
            onViewHistory={() => setActiveTab('history')}
            onNotify={notify}
            initialOrderToEdit={orderToEdit}
            onClearInitialOrder={() => setOrderToEdit(null)}
            onDraftCountChange={setDraftItemCount}
          />
        </div>

        {activeTab === 'history' && (
          <HistoryScreen
            orders={orders}
            pharmacies={pharmacies}
            onStartNewOrder={() => {
              setOrderToEdit(null);
              setActiveTab('new-order');
            }}
            onEditOrder={handleEditOrder}
            onDuplicateOrder={handleDuplicateOrder}
            onDeleteOrder={handleDeleteOrder}
            onNotify={notify}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            orders={orders}
            pharmacies={pharmacies}
            receivers={receivers}
            onNotify={notify}
          />
        )}

        {activeTab === 'items' && (
          <ItemsScreen
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicine={handleUpdateMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onNotify={notify}
          />
        )}

        {activeTab === 'pharmacies' && (
          <PharmaciesScreen
            pharmacies={pharmacies}
            orders={orders}
            onAddPharmacy={handleAddPharmacy}
            onUpdatePharmacy={handleUpdatePharmacy}
            onDeletePharmacy={handleDeletePharmacy}
            onSelectForNewOrder={handleSelectPharmacyForOrder}
            onNotify={notify}
          />
        )}

        {activeTab === 'receivers' && (
          <ReceiversScreen
            receivers={receivers}
            orders={orders}
            onAddReceiver={handleAddReceiver}
            onUpdateReceiver={handleUpdateReceiver}
            onDeleteReceiver={handleDeleteReceiver}
            onNotify={notify}
          />
        )}
      </main>

      {/* Floating Notifications Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Data Backup & Settings Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={refreshData}
        onNotify={notify}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab === 'new-order' && activeTab !== 'new-order') {
            // Keep existing orderToEdit or start fresh
          }
          setActiveTab(tab);
        }}
        orderCount={orders.length}
        medicineCount={medicines.length}
        pharmacyCount={pharmacies.length}
        draftItemCount={draftItemCount}
      />
    </div>
  );
}
