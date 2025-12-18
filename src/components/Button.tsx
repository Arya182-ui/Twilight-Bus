// src/components/Button.tsx
"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading, ...props }) => {
  return (
    <button
      {...props}
      disabled={isLoading}
      className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white border border-transparent rounded-md group bg-gradient-to-r from-rainbow-1 to-rainbow-2 hover:animate-gradient-x disabled:opacity-50"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
