import React from 'react';

const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.95 11.25a.75.75 0 0 1 0 1.5h-3.478a.75.75 0 0 1 0-1.5h3.478Z" transform="rotate(-30 12 12)" />
  </svg>
);

export default HistoryIcon;
