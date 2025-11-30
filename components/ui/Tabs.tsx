
import React, { useState } from 'react';

interface Tab {
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.title}
              onClick={() => setActiveTab(index)}
              className={`${
                activeTab === index
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text hover:border-muted'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs;