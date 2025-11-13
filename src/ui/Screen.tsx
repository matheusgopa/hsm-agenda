export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
