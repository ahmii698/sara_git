import React from 'react';
import './StatsCard.css';
import { TrendingUp } from 'lucide-react';

const StatsCard = ({ label, value, icon: Icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={24} />
        </div>
        <span className="stat-growth">
          <TrendingUp size={14} /> +12%
        </span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
};

export default StatsCard;