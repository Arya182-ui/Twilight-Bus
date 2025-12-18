// src/components/LoadingSpinner.tsx
"use client";


const LoadingSpinner = () => {
  return (
    <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-60">
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 border-4 border-t-[#f9d423] border-b-[#203a43] border-l-transparent border-r-transparent rounded-full animate-spin shadow-2xl" style={{ boxShadow: '0 0 40px 10px #f9d42355, 0 0 20px 2px #203a4355' }}></div>
        <span className="mt-6 text-lg font-bold text-[#f9d423] drop-shadow-lg animate-pulse tracking-wide">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
