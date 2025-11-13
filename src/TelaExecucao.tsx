// === TelaExecucao.tsx — TI ===

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Dia {
  data: string;
  inicio: string;
  tipo: "Abertura" | "Fechamento";
}

interface HistoricoTI {
  data: string;
  usuario: string;
  acao: string;
}

interface SolicitacaoPadrao {
  solicitante: string;
  tipoAgenda: string;
  tiposAgenda?: Array<"Convênio" | "HSM+">;
  dias: Dia[];
  observacao: string;
  dataEnvio: string;
  status: "Encaminhada" | "Aprovada" | "Recusada" | "Concluída";
  origem: "Médico" | "Supervisão";
  anexo?: string;
  NumeroSolicitacao: string;
  responsavelTI?: string;
  historicoTI?: HistoricoTI[];
}

interface Props {
  onVoltar: () => void;
}

export default function TelaExecucao({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPadrao[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const usuario = localStorage.getItem("user") || "TI";

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("solicitacoes") || "[]");
    setSolicitacoes(data);
  }, []);

  function salvar(lista: SolicitacaoPadrao[]) {
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
    setSolicitacoes(lista);
  }

  function registrar(numero: string, acao: string) {
    const novas = solicitacoes.map((s) => {
      if (s.NumeroSolicitacao !== numero) return s;

      const hist = s.historicoTI || [];
      hist.push({
        data: new Date().toISOString(),
        usuario,
        acao,
      });

      return { ...s, historicoTI: hist };
    });

    salvar(novas);
  }

  function handlePegar(numero: string) {
    const novas = solicitacoes.map((s) => {
      if (s.NumeroSolicitacao !== numero) return s;

      if (s.responsavelTI && s.responsavelTI !== usuario)
        return s;

      return { ...s, responsavelTI: usuario };
    });

    registrar(numero, "Pegou para execução");
    salvar(novas);
  }

  function handleStatus(numero: string, novo: SolicitacaoPadrao["status"]) {
    const novas = solicitacoes.map((s) =>
      s.NumeroSolicitacao === numero ? { ...s, status: novo } : s
    );
    registrar(numero, `Alterou status para ${novo}`);
    salvar(novas);
  }

  const aprovadas = solicitacoes.filter((s) => s.status === "Aprovada");

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">TI — Execução de Agendas</h1>

          <button onClick={onVoltar} className="text-hsmBlue hover:underline text-sm">
            ← Voltar
          </button>
        </div>

        {aprovadas.length === 0 && (
          <p className="text-gray-500 text-center">Nenhuma solicitação aprovada.</p>
        )}

        {aprovadas.map((sol) => {
          const open = expanded[sol.NumeroSolicitacao] ?? false;
          return (
            <div key={sol.NumeroSolicitacao} className="border rounded-xl p-4 mb-4 bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h2 className="font-semibold text-hsmBlue text-lg">
                    {sol.solicitante}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {format(new Date(sol.dataEnvio), "dd/MM/yyyy HH:mm")}
                  </p>

                  <p className="text-sm">
                    <strong>Tipo de Agenda:</strong> {sol.tipoAgenda}
                  </p>

                  <p className="text-sm">
                    <strong>Nº Solicitação:</strong> {sol.NumeroSolicitacao}
                  </p>

                  {sol.responsavelTI && (
                    <p className="text-green-600 text-sm">
                      Em execução por: <strong>{sol.responsavelTI}</strong>
                    </p>
                  )}
                </div>

                <button
                  className="text-hsmBlue text-sm hover:underline"
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [sol.NumeroSolicitacao]: !open }))
                  }
                >
                  {open ? "Recolher ▲" : "Ver detalhes ▼"}
                </button>
              </div>

              {open && (
                <div className="mt-4">
                  <div className="border rounded-lg bg-white p-3 mb-3">
                    {sol.dias.map((d, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{format(new Date(d.data), "dd/MM/yyyy")}</span>
                        <span>
                          {d.tipo} — {d.inicio}
                        </span>
                      </div>
                    ))}
                  </div>

                  {sol.historicoTI && sol.historicoTI.length > 0 && (
                    <div className="border rounded-lg bg-gray-100 p-3 mb-3">
                      <h3 className="font-medium mb-2">Histórico:</h3>
                      {sol.historicoTI.map((h, i) => (
                        <p key={i} className="text-sm">
                          {format(new Date(h.data), "dd/MM/yyyy HH:mm")} —{" "}
                          <strong>{h.usuario}</strong> {h.acao}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {!sol.responsavelTI && (
                      <button
                        onClick={() => handlePegar(sol.NumeroSolicitacao)}
                        className="bg-hsmBlue text-white px-4 py-2 rounded-lg"
                      >
                        🤝 Pegar para mim
                      </button>
                    )}

                    {sol.responsavelTI === usuario && (
                      <select
                        value={sol.status}
                        onChange={(e) =>
                          handleStatus(sol.NumeroSolicitacao, e.target.value as any)
                        }
                        className="border rounded-lg px-3 py-2"
                      >
                        <option value="Aprovada">Aprovada</option>
                        <option value="Encaminhada">Encaminhada</option>
                        <option value="Recusada">Recusada</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
