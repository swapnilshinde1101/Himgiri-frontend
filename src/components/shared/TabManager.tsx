import React from 'react';
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabManagerProps {
  tabs: TabItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function TabManager({ tabs, selectedIndex, onChange }: TabManagerProps) {
  return (
    <div className="w-full mb-6">
      <Tab.Group selectedIndex={selectedIndex} onChange={onChange}>
        <Tab.List className="flex space-x-1 rounded-2xl bg-gray-100 p-1.5 border border-gray-200 shadow-inner">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                clsx(
                  'w-full rounded-xl py-2.5 text-sm font-bold leading-5 transition-all outline-none',
                  'flex items-center justify-center gap-2',
                  selected
                    ? 'bg-white text-himgiri-primary shadow-soft ring-1 ring-black/5'
                    : 'text-himgiri-secondary hover:bg-white/50 hover:text-gray-900'
                )
              }
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
}
