import React from 'react';
import { PlusCircle, Clock, BarChart3, Pill, Store, Users } from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  orderCount: number;
  medicineCount: number;
  pharmacyCount: number;
  draftItemCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  orderCount,
  medicineCount,
  pharmacyCount,
  draftItemCount = 0,
}) => {
  // Detect virtual keyboard on mobile devices to prevent covering active inputs
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      // Virtual keyboard takes > 150px of viewport on mobile
      const keyboardActive = window.innerHeight - vv.height > 150;
      setIsKeyboardOpen(keyboardActive);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  if (isKeyboardOpen) {
    return null;
  }

  const tabs = [
    {
      id: 'new-order' as ActiveTab,
      label: 'New Order',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'history' as ActiveTab,
      label: 'History',
      icon: Clock,
      badge: orderCount > 0 ? String(orderCount) : undefined,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'items' as ActiveTab,
      label: 'Items',
      icon: Pill,
      badge: medicineCount > 0 ? String(medicineCount) : undefined,
    },
    {
      id: 'pharmacies' as ActiveTab,
      label: 'Pharmacies',
      icon: Store,
      badge: pharmacyCount > 0 ? String(pharmacyCount) : undefined,
    },
    {
      id: 'receivers' as ActiveTab,
      label: 'Receivers',
      icon: Users,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                  isActive ? 'text-teal-800' : 'text-slate-600 hover:text-teal-800'
                }`}
                aria-label={tab.label}
              >
                <div
                  className={`w-10 h-10 -mt-3.5 rounded-full flex items-center justify-center shadow-md transition-all relative ${
                    isActive
                      ? 'bg-teal-800 text-white ring-4 ring-teal-100 scale-105'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {draftItemCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white ring-2 ring-white shadow-xs"
                      title={`${draftItemCount} items in draft`}
                    >
                      {draftItemCount}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-teal-900' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center relative py-1 px-1 transition-colors active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-teal-800' : 'text-slate-500'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 min-w-4 text-center leading-tight border border-teal-200">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'text-teal-900' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-4 h-1 bg-teal-800 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
