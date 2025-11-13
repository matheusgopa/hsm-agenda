// src/TelaAprovacao.tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import Screen from "./ui/Screen";
import { Button } from "./ui/Button";
import { StatusBadge } from "./ui/Badge";
import FiltroSolicitacoes from "./FiltroSolicitacoes";

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
  const [selecionadas, setSelecionadas] = useState<number[]>([]); // índices globais

  // filtros
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] =
    useState<"Todos" | "Médico" | "Supervisão">("Todos");
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
    // Diretoria não vê as pendentes
    setSolicitacoes(data.filter((s) => s.status !== "Pendente"));
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  function handleAprovar(indexGlobal: number) {
    const novas = [...solicitacoes];
    if (!novas[indexGlobal] || novas[indexGlobal].status !== "Encaminhada")
      return;
    novas[indexGlobal].status = "Aprovada";
    atualizarLocalStorage(novas);
  }

  function handleRecusar(indexGlobal: number) {
    const novas = [...solicitacoes];
    if (!novas[indexGlobal] || novas[indexGlobal].status !== "Encaminhada")
      return;
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

  // seleção múltipla sempre guardando índice global
  function toggleSelecionada(indexGlobal: number) {
    setSelecionadas((prev) =>
      prev.includes(indexGlobal)
        ? prev.filter((i) => i !== indexGlobal)
        : [...prev, indexGlobal]
    );
  }

  function selecionarTodas() {
    const indicesNaTela = solicitacoesFiltradas.map((sol) =>
      solicitacoes.indexOf(sol)
    );
    const todasJa = indicesNaTela.every((i) => selecionadas.includes(i));

    if (todasJa) {
      setSelecionadas([]);
    } else {
      setSelecionadas(indicesNaTela);
    }
  }

  function aprovarSelecionadas() {
    if (
      !window.confirm(
        "Tem certeza que deseja aprovar as solicitações selecionadas?"
      )
    ) {
      return;
    }

    const novas = [...solicitacoes];
    selecionadas.forEach((i) => {
      if (novas[i]?.status === "Encaminhada") {
        novas[i].status = "Aprovada";
      }
    });
    atualizarLocalStorage(novas);
    setSelecionadas([]);
  }

  function recusarSelecionadas() {
    if (
      !window.confirm(
        "Tem certeza que deseja recusar as solicitações selecionadas?"
      )
    ) {
      return;
    }

    const novas = [...solicitacoes];
    selecionadas.forEach((i) => {
      if (novas[i]?.status === "Encaminhada") {
        novas[i].status = "Recusada";
      }
    });
    atualizarLocalStorage(novas);
    setSelecionadas([]);
  }

  // filtros
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      const matchNome = s.solicitante
        .toLowerCase()
        .includes(busca.toLowerCase());
      const matchOrigem =
        filtroOrigem === "Todos" || s.origem === filtroOrigem;
      const matchStatus =
        filtroStatus === "Todos" || s.status === filtroStatus;
      const matchTipo =
        filtroTipo === "Todos" || s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" ||
        (s.tiposAgenda?.includes(filtroAgenda) ?? s.tipoAgenda === filtroAgenda);

      const dataEnvio = new Date(s.dataEnvio);
      const inicioDate = filtroInicio
        ? new Date(`${filtroInicio}T00:00:00`)
        : null;
      const fimDate = filtroFim
        ? new Date(`${filtroFim}T23:59:59`)
        : null;
      let matchPeriodo = true;
      if (inicioDate && fimDate)
        matchPeriodo = dataEnvio >= inicioDate && dataEnvio <= fimDate;
      else if (inicioDate) matchPeriodo = dataEnvio >= inicioDate;
      else if (fimDate) matchPeriodo = dataEnvio <= fimDate;

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
    <Screen>
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
      <FiltroSolicitacoes
        busca={busca}
        setBusca={setBusca}
        filtroOrigem={filtroOrigem}
        setFiltroOrigem={setFiltroOrigem}
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        filtroAgenda={filtroAgenda}
        setFiltroAgenda={setFiltroAgenda}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        filtroInicio={filtroInicio}
        setFiltroInicio={setFiltroInicio}
        filtroFim={filtroFim}
        setFiltroFim={setFiltroFim}
        onLimpar={limparFiltros}
      />

      {/* Ações em massa */}
      {solicitacoesFiltradas.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={todasSelecionadasNaTela}
              onChange={selecionarTodas}
            />
            <span className="text-sm text-gray-700">Selecionar todas</span>
          </div>

          {podeAcoesEmMassa && (
            <div className="flex gap-3">
              <Button color="green" onClick={aprovarSelecionadas}>
                ✅ Aprovar selecionadas
              </Button>

              <Button color="red" onClick={recusarSelecionadas}>
                ❌ Recusar selecionadas
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Listagem */}
      {solicitacoesFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        solicitacoesFiltradas.map((sol, indexFiltrado) => {
          const indexGlobal = solicitacoes.indexOf(sol);
          const selecionada = selecionadas.includes(indexGlobal);

          return (
            <div
              key={indexGlobal}
              className={`border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 transition-all ${
                selecionada ? "ring-2 ring-hsmBlue" : ""
              }`}
            >
              {/* Cabeçalho do card */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
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
                      <strong>Tipo de Agenda:</strong>{" "}
                      {sol.tiposAgenda?.join(" + ") || sol.tipoAgenda}
                    </p>
                    {sol.numeroSolicitacao && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Nº Solicitação:</strong>{" "}
                        {sol.numeroSolicitacao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={sol.status} />
                  <button
                    className="text-sm text-hsmBlue hover:underline flex items-center gap-1"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [indexFiltrado]: !prev[indexFiltrado],
                      }))
                    }
                  >
                    <span>
                      {expanded[indexFiltrado] ? "Recolher" : "Ver detalhes"}
                    </span>
                    <span
                      className={`transform transition-transform duration-300 ${
                        expanded[indexFiltrado] ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </div>
              </div>

              {/* Detalhes */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  expanded[indexFiltrado]
                    ? "max-h-[1000px] opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="border rounded-lg bg-white p-3 mb-3">
                  <h3 className="font-medium mb-2 text-gray-700">
                    Dias e horários:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
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
                  <p className="text-sm text-gray-500 italic mb-3">
                    Observação: “{sol.observacao}”
                  </p>
                )}

                {sol.anexo && (
                  <a
                    href={sol.anexo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-hsmBlue text-sm underline block mb-3"
                  >
                    📎 Ver Anexo
                  </a>
                )}

                {/* Ações individuais */}
                <div className="flex justify-end gap-3">
                  {sol.status === "Encaminhada" ? (
                    <>
                      <Button
                        color="green"
                        onClick={() => handleAprovar(indexGlobal)}
                      >
                        ✅ Aprovar
                      </Button>
                      <Button
                        color="red"
                        onClick={() => handleRecusar(indexGlobal)}
                      >
                        ❌ Recusar
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">
                      Status: {sol.status} — sem ações disponíveis
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Screen>
  );
}
