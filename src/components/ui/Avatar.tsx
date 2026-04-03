'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

function getInitials(name: string): string {
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a pleasant color
  const colors = [
    '#377DFF', '#41bfb8', '#f79952', '#10b981', '#8b5cf6',
    '#ec4899', '#f43f5e', '#06b6d4', '#84cc16', '#eab308'
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const pixelSize = sizeMap[size];
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  if (src) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${pixelSize}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center flex-shrink-0
        text-white font-semibold
        ${textSizeMap[size]}
        ${className}
      `}
      style={{
        width: pixelSize,
        height: pixelSize,
        backgroundColor: bgColor,
      }}
    >
      {initials}
    </div>
  );
}
