interface Props {
  onVoltar: () => void;
  onLogout: () => void;
}

export default function SolicitacoesEnviadas({ onVoltar, onLogout }: Props) {
  const solicitacoes =
    JSON.parse(localStorage.getItem("solicitacoes") || "[]") || [];

  if (solicitacoes.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-hsmBlue/80 to-hsmCyan/30 text-white">
        <p className="mb-4">Nenhuma solicitação enviada ainda.</p>
        <button
          onClick={onVoltar}
          className="bg-white text-hsmBlue px-4 py-2 rounded-lg"
        >
          Nova Solicitação
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/80 to-hsmCyan/30 text-white p-8">
      <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-hsmBlue">
            Minhas Solicitações
          </h1>
          <div className="flex gap-2">
            <button
              onClick={onVoltar}
              className="text-sm text-hsmBlue hover:underline"
            >
              Nova Solicitação
            </button>
            <button
              onClick={onLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Sair
            </button>
          </div>
        </div>

        <ul className="space-y-4">
          {solicitacoes.map((s: any, i: number) => (
            <li
              key={i}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <p className="font-semibold">
                {s.solicitante} —{" "}
                <span className="text-sm text-gray-500">
                  {new Date(s.dataEnvio).toLocaleString("pt-BR")}
                </span>
              </p>
              <ul className="text-sm mt-2 text-gray-700 list-disc ml-6">
                {s.dias.map((d: any, j: number) => (
                  <li key={j}>
                    {d.tipo} — {d.data} às {d.inicio}
                  </li>
                ))}
              </ul>
              {s.observacao && (
                <p className="text-gray-600 mt-2">
                  <strong>Obs:</strong> {s.observacao}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
