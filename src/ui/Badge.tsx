export function StatusBadge({ status }: { status: string }) {
  const cores: any = {
    Pendente: "bg-yellow-100 text-yellow-700",
    Encaminhada: "bg-blue-100 text-blue-700",
    Aprovada: "bg-green-100 text-green-700",
    Recusada: "bg-red-100 text-red-700",
    Concluída: "bg-gray-200 text-gray-700",
  };

  return (
    <span className={`px-3 py-1 text-sm rounded-full font-medium ${cores[status]}`}>
      {status}
    </span>
  );
}
