import React from 'react';

const imageUrl = "https://i.postimg.cc/y8htBK2y/1.png";

interface LogoProps {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ className, alt = "شعار كنيسة القديس بولس الرسول", style }) => {
  return (
    <img 
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
    />
  );
};

export default Logo;