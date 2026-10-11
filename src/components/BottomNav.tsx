import React from 'react';
import { Store, PlusCircle, Package, Calculator, Zap } from 'lucide-react';

export type NavTab = 'stands' | 'quick-add' | 'products' | 'calc' | 'jev';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'stands' as NavTab, label: 'Stands', icon: Store },
    { id: 'products' as NavTab, label: 'Produtos', icon: Package },
    { id: 'quick-add' as NavTab, label: 'Novo', icon: PlusCircle, isPrimary: true },
    { id: 'calc' as NavTab, label: 'Calculadora', icon: Calculator },
    { id: 'jev' as NavTab, label: 'JEV Intel', icon: Zap }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B142B]/95 backdrop-blur-lg border-t border-canton-border pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="flex flex-col items-center justify-center relative -top-3 focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-canton-gold text-black shadow-canton-gold/40'
                      : 'bg-gradient-to-tr from-canton-gold to-canton-goldBright text-black shadow-canton-gold/25'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold text-canton-gold mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-canton-gold font-semibold' : 'text-canton-dim hover:text-canton-cream'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-2'}`} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
