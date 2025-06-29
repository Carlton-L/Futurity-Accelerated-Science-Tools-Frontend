import React from 'react';

export type IconSubjectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconSubjectProps {
  size?: IconSubjectSize | number;
  color?: string;
  className?: string;
}

const sizeMap: Record<IconSubjectSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const IconSubject: React.FC<IconSubjectProps> = ({
  size = 'md',
  color = '#0005E9',
  className,
}) => {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M12 2L20.196 7V17L12 22L3.804 17V7L12 2Z'
        fill={color}
        stroke={color}
        strokeWidth='1'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export default IconSubject;
