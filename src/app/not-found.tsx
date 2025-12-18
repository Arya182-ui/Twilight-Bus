import { Suspense } from "react";

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-[#232946] p-10 rounded-xl shadow-xl text-center">
          <h1 className="text-4xl font-bold mb-4 text-[#f9d423]">404 - Page Not Found</h1>
          <p className="text-gray-300 mb-6">Sorry, the page you are looking for does not exist.</p>
          <a href="/" className="text-[#f9d423] underline">Go back home</a>
        </div>
      </div>
    </Suspense>
  );
}
