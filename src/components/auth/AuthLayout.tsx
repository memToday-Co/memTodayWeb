import { ReactNode } from "react";
import { Quote } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Quote className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-bold text-black">QuoteMemory</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Master the art of memorization with your favorite quotes
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
