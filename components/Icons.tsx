import React from "react";

export const IconPlay = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export const IconRefresh = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M21 2v6h-6"></path>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M3 22v-6h6"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
  </svg>
);

export const IconBook = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

export const IconCpu = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
);

export const IconHistory = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M12 8v4l3 3"></path>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M3.05 11a9 9 0 1 1 .5 9m-.5-9v-5.5h-5.5" transform="rotate(-45 12 12)" opacity="0" />
  </svg>
);

export const IconArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);