import React from 'react';

export interface BrandLogoProps {
  className?: string;
  size?: number;
  withContainer?: boolean;
  containerClassName?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-7 h-7',
  size,
  withContainer = false,
  containerClassName = 'flex items-center justify-center rounded-lg bg-white p-0.5 border border-[#e1e4e8] shadow-2xs',
  alt = 'Orqestra Logo',
}) => {
  const inlineStyle: React.CSSProperties = size ? { width: size, height: size } : {};

  const imgElement = (
    <img
      src="/logo.png"
      alt={alt}
      style={inlineStyle}
      className={`object-contain select-none shrink-0 ${className}`}
      loading="eager"
      decoding="async"
    />
  );

  if (withContainer) {
    return (
      <span className={containerClassName}>
        {imgElement}
      </span>
    );
  }

  return imgElement;
};
