import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Custom multi-layered Duotone & Dimensional SVG Icons
 * Designed for a clean, authoritative environmental monitoring interface.
 */

export const BrandAirIcon: React.FC<IconProps> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className}>
    <defs>
      <linearGradient id="airDropGrad" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="0.5" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
    <path
      d="M14 2.75C8.8 2.75 4.75 6.95 4.75 12C4.75 16.4 9.7 21.85 12.6 24.6C13.38 25.35 14.62 25.35 15.4 24.6C18.3 21.85 23.25 16.4 23.25 12C23.25 6.95 19.2 2.75 14 2.75Z"
      fill="url(#airDropGrad)"
    />
    <path
      d="M14 6C11.2 6 9 8.7 9 12C9 15 11.7 18.8 14 21.1C16.3 18.8 19 15 19 12C19 8.7 16.8 6 14 6Z"
      fill="white"
      fillOpacity="0.22"
    />
    <path
      d="M10.5 12.2C11.6 10.8 13.4 10.8 14.5 12.2C15.6 13.6 17.4 13.6 18.5 12.2"
      stroke="white"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <circle cx="14" cy="9" r="1.5" fill="white" />
  </svg>
);

export const NavOverviewIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="8" height="8" rx="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="3" width="8" height="5" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13" y="10" width="8" height="11" rx="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const NavMapLayerIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3.5 6.8L9 4.2L15 6.8L20.5 4.2V17.2L15 19.8L9 17.2L3.5 19.8V6.8Z"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M9 4.2V17.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    <path d="M15 6.8V19.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    <circle cx="12" cy="11.5" r="2.3" fill="currentColor" />
  </svg>
);

export const NavKarhutlaIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12.5 2.8C12.5 2.8 18.5 7.2 18.5 13.2C18.5 17.2 15.4 20.5 11.8 20.5C8.1 20.5 5.5 17.4 5.5 13.6C5.5 10.9 7.1 8.5 8.5 7.3C8.5 9.2 9.8 10.2 10.6 10.2C10.1 7.4 11.2 4.5 12.5 2.8Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 13.2C13.2 14.2 13.8 15.8 13.2 17.3C12.8 18.3 11.7 18.8 10.8 18.3C9.9 17.8 9.6 16.5 10.3 15.3C10.8 14.5 11.5 13.8 12 13.2Z"
      fill="currentColor"
    />
  </svg>
);

export const NavHealthShieldIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3L4.5 6.2V11.6C4.5 16.4 7.7 20.6 12 21.8C16.3 20.6 19.5 16.4 19.5 11.6V6.2L12 3Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 8.5V15.5M8.5 12H15.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

export const SunModeIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2.5V5M12 19V21.5M4.22 4.22L6 6M18 18L19.78 19.78M2.5 12H5M19 12H21.5M4.22 19.78L6 18M18 6L19.78 4.22"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const MoonModeIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M20.2 14.6C19.1 15.1 17.8 15.4 16.5 15.4C11.5 15.4 7.5 11.4 7.5 6.4C7.5 5.1 7.8 3.8 8.3 2.7C4.8 3.9 2.3 7.3 2.3 11.3C2.3 16.4 6.4 20.5 11.5 20.5C15.5 20.5 18.9 18 20.2 14.6Z"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="9.5" r="0.7" fill="currentColor" />
  </svg>
);

export const LayerControlIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3.5L3 8.2L12 12.9L21 8.2L12 3.5Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M3 12.8L12 17.5L21 12.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 16.8L12 21.5L21 16.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const VisibilityOnIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M2.2 12C3.9 7.6 7.6 5 12 5C16.4 5 20.1 7.6 21.8 12C20.1 16.4 16.4 19 12 19C7.6 19 3.9 16.4 2.2 12Z"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export const VisibilityOffIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3.5 3.5L20.5 20.5M9.9 5.3C10.6 5.1 11.3 5 12 5C16.4 5 20.1 7.6 21.8 12C21.1 13.8 20 15.3 18.6 16.5M6.2 6.5C4.5 7.8 3.1 9.7 2.2 12C3.9 16.4 7.6 19 12 19C13.9 19 15.7 18.5 17.2 17.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GpsTargetIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const StatusShieldBadgeIcon: React.FC<{ color?: string; className?: string }> = ({
  color = '#10B981',
  className = 'h-3.5 w-3.5',
}) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="7" fill={color} fillOpacity="0.22" />
    <circle cx="8" cy="8" r="4" fill={color} />
  </svg>
);
