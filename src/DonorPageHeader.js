import React, { useState } from 'react';

const DonorPageHeader = () => {
  const [activeTab, setActiveTab] = useState('Settings & Feedback');

  const tabs = ['Overview', 'Post Food', 'My Listings', 'Settings & Feedback'];

  const handleTabClick = (tab) => {
    if (tab !== 'Settings & Feedback') {
      alert('Coming soon');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between">
          
          {/* Left Side: Profile Info & Welcome */}
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-2xl border-2 border-emerald-500">
                JD
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Welcome back!</p>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Active Donor
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row: Tabs */}
        <div className="mt-6 sm:mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorPageHeader;
