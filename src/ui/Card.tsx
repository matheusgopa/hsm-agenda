export function Card({ children, className = "" }: any) {
  return (
    <div
      className={`border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 transition-all ${className}`}
    >
      {children}
    </div>
  );
}
