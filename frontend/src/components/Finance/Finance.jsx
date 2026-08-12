import React, { useState } from 'react';
import Salary from './Salary';
import FixedExpense from './FixedExpense';
import ExtraExpense from './ExtraExpense';
import AddAccount from '../Accounts/AddAccount';
import './Finance.css';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('salary');

  const tabs = [
    { id: 'salary', label: 'Employee Salary' },
    { id: 'fixed', label: 'Fixed Expenses' },
    { id: 'extra', label: 'Extra Expenses' },
    { id: 'account', label: 'Add Account' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'salary': return <Salary />;
      case 'fixed': return <FixedExpense />;
      case 'extra': return <ExtraExpense />;
      case 'account': return <AddAccount />;
      default: return null;
    }
  };

  return (
    <div className="finance-container">
      <h2>Finance Management</h2>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Finance;