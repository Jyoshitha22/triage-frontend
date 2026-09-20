import React from 'react';
import './Card.css';

export default function Card({ children, elevated = true, className = '' }) {
  return (
    <div className={`card ${elevated ? 'card--elevated' : ''} ${className}`}>
      {children}
    </div>
  );
}