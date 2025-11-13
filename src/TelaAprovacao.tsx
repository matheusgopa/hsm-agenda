// src/TelaAprovacao.tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Solicitacao,
  StatusSolicitacao,
  TipoAgendaSimples,
  TipoDia,
} from "./types";

interface Props {
  onVoltar: () => void;
}

export default function TelaAprovacao({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  // filtros
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<"Todos" | "Médico" | "Supervisão">("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoDia>("Todos");
  const [filtroAgenda, setFiltroAgenda] =
    useState<"Todos" | TipoAgendaSimples>("Todos");
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | "Todos">(
    "Encaminhada"
  );
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");

  useEffect(() => {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem("solicitacoes") || "[]"
    );

    // Diretoria não vê pendentes
    setSolicitacoes(data.filter((s) => s.status !== "Pendente"));
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  function handleAprovar(indexGlobal: number) {
    const novas = [...solicitacoes];
    if (novas[indexGlobal].status !== "Encaminhada") return;
    novas[indexGlobal].status = "Aprovada";
    atualizarLocalStorage(novas);
  }

  function handleRecusar(indexGlobal: number) {
    const novas = [...solicitacoes];
    if (novas[indexGlobal].status !== "Encaminhada") return;
    novas[indexGlobal].status = "Recusada";
    atualizarLocalStorage(novas);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroOrigem("Todos");
    setFiltroTipo("Todos");
    setFiltroAgenda("Todos");
    setFiltroStatus("Encaminhada");
    setFiltroInicio("");
    setFiltroFim("");
    setSelecionadas([]);
  }

  // Seleção múltipla
  function toggleSelecionada(indexGlobal: number) {
    setSelecionadas((prev) =>
      prev.includes(indexGlobal)
        ? prev.filter((i) => i !== indexGlobal)
        : [...prev, indexGlobal]
    );
  }

  function selecionarTodas() {
    const indexes = solicitacoesFiltradas.map((sol) =>
      solicitacoes.indexOf(sol)
    );
    const todasJa = indexes.every((i) => selecionadas.includes(i));

    setSelecionadas(todasJa ? [] : indexes);
  }

  function aprovarSelecionadas() {
    if (!window.confirm("Confirmar aprovação das solicitações selecionadas?"))
      return;

    const novas = [...solicitacoes];
    selecionadas.forEach((i) => {
      if (novas[i].status === "Encaminhada") novas[i].status = "Aprovada";
    });

    atualizarLocalStorage(novas);
    setSelecionadas([]);
  }

  function recusarSelecionadas() {
    if (!window.confirm("Confirmar recusa das solicitações selecionadas?"))
      return;

    const novas = [...solicitacoes];
    selecionadas.forEach((i) => {
      if (novas[i].status === "Encaminhada") novas[i].status = "Recusada";
    });

    atualizarLocalStorage(novas);
    setSelecionadas([]);
  }

  // FILTROS CORRIGIDOS COM 23:59:59
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      const matchNome = s.solicitante.toLowerCase().includes(busca.toLowerCase());
      const matchOrigem = filtroOrigem === "Todos" || s.origem === filtroOrigem;
      const matchStatus = filtroStatus === "Todos" || s.status === filtroStatus;
      const matchTipo =
        filtroTipo === "Todos" || s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" ||
        (s.tiposAgenda?.includes(filtroAgenda) ?? s.tipoAgenda === filtroAgenda);

      const dataEnvio = new Date(s.dataEnvio);
      const inicio = filtroInicio ? new Date(filtroInicio + "T00:00:00") : null;
      const fim = filtroFim ? new Date(filtroFim + "T23:59:59") : null;

      let matchPeriodo = true;
      if (inicio && fim) matchPeriodo = dataEnvio >= inicio && dataEnvio <= fim;
      else if (inicio) matchPeriodo = dataEnvio >= inicio;
      else if (fim) matchPeriodo = dataEnvio <= fim;

      return (
        matchNome &&
        matchOrigem &&
        matchStatus &&
        matchTipo &&
        matchAgenda &&
        matchPeriodo
      );
    });
  }, [
    solicitacoes,
    busca,
    filtroOrigem,
    filtroTipo,
    filtroAgenda,
    filtroStatus,
    filtroInicio,
    filtroFim,
  ]);

  const todasSelecionadasNaTela =
    solicitacoesFiltradas.length > 0 &&
    solicitacoesFiltradas
      .map((sol) => solicitacoes.indexOf(sol))
      .every((i) => selecionadas.includes(i));

  const podeAcoesEmMassa =
    selecionadas.length > 0 &&
    selecionadas.every(
      (i) => solicitacoes[i]?.status === "Encaminhada"
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Diretoria Médica — Aprovação de Solicitações
          </h1>

          <button
            onClick={onVoltar}
            className="text-hsmBlue hover:underline text-sm"
          >
            ← Voltar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Buscar por médico
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Origem
              </label>
              <select
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Todos</option>
                <option>Médico</option>
                <option>Supervisão</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Todos</option>
                <option>Abertura</option>
                <option>Fechamento</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Tipo de Agenda
              </label>
              <select
                value={filtroAgenda}
                onChange={(e) => setFiltroAgenda(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Todos</option>
                <option>Convênio</option>
                <option>HSM+</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Encaminhada</option>
                <option>Aprovada</option>
                <option>Recusada</option>
                <option>Concluída</option>
                <option>Todos</option>
              </select>
            </div>
          </div>

          {/* período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                De
              </label>
              <input
                type="date"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Até
              </label>
              <input
                type="date"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={limparFiltros}
              className="text-sm text-red-500 hover:underline"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* ações em massa */}
        {solicitacoesFiltradas.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todasSelecionadasNaTela}
                onChange={selecionarTodas}
              />
              <span className="text-sm">Selecionar todas</span>
            </div>

            {podeAcoesEmMassa && (
              <div className="flex gap-3">
                <button
                  onClick={aprovarSelecionadas}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Aprovar selecionadas
                </button>

                <button
                  onClick={recusarSelecionadas}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Recusar selecionadas
                </button>
              </div>
            )}
          </div>
        )}

        {/* lista */}
        {solicitacoesFiltradas.length === 0 ? (
          <p className="text-center text-gray-500">
            Nenhuma solicitação encontrada.
          </p>
        ) : (
          solicitacoesFiltradas.map((sol, indexFiltrado) => {
            const indexGlobal = solicitacoes.indexOf(sol);
            const selecionada = selecionadas.includes(indexGlobal);

            return (
              <div
                key={indexGlobal}
                className={`border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 ${
                  selecionada ? "ring-2 ring-hsmBlue" : ""
                }`}
              >
                {/* header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => toggleSelecionada(indexGlobal)}
                    />

                    <div>
                      <h2 className="font-semibold text-hsmBlue text-lg">
                        {sol.solicitante}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {sol.origem === "Supervisão"
                          ? "🧾 Inserido pela supervisão"
                          : "🩺 Enviado pelo médico"}{" "}
                        em{" "}
                        {format(new Date(sol.dataEnvio), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>

                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Agenda:</strong>{" "}
                        {sol.tiposAgenda?.join(" + ") || sol.tipoAgenda}
                      </p>

                      {sol.NumeroSolicitacao && (
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Nº Solicitação:</strong>{" "}
                          {sol.NumeroSolicitacao}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        sol.status === "Encaminhada"
                          ? "bg-blue-100 text-blue-700"
                          : sol.status === "Aprovada"
                          ? "bg-green-100 text-green-700"
                          : sol.status === "Recusada"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {sol.status}
                    </span>

                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [indexFiltrado]: !prev[indexFiltrado],
                        }))
                      }
                      className="text-sm text-hsmBlue hover:underline"
                    >
                      {expanded[indexFiltrado] ? "Recolher ▲" : "Ver detalhes ▼"}
                    </button>
                  </div>
                </div>

                {/* detalhes */}
                {expanded[indexFiltrado] && (
                  <div className="mt-4">
                    <div className="border bg-white p-3 rounded-lg mb-3">
                      <h3 className="font-medium mb-2 text-gray-700">
                        Dias e horários:
                      </h3>

                      <ul className="text-sm text-gray-700 space-y-1">
                        {sol.dias.map((d, i) => (
                          <li key={i} className="flex justify-between">
                            <span>
                              {format(new Date(d.data), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                            <span>
                              {d.tipo} — {d.inicio}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {sol.observacao && (
                      <p className="text-sm italic text-gray-500 mb-3">
                        Observação do médico: "{sol.observacao}"
                      </p>
                    )}

                    {sol.anexo && (
                      <a
                        href={sol.anexo}
                        target="_blank"
                        className="underline text-hsmBlue text-sm block mb-3"
                      >
                        📎 Ver anexo
                      </a>
                    )}

                    <div className="flex justify-end gap-3">
                      {sol.status === "Encaminhada" ? (
                        <>
                          <button
                            onClick={() => handleAprovar(indexGlobal)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg"
                          >
                            Aprovar
                          </button>

                          <button
                            onClick={() => handleRecusar(indexGlobal)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            Recusar
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm italic">
                          (Sem ações — já finalizada)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
