// src/TelaExecucao.tsx
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
  HistoricoTI,
} from "./types";

interface Props {
  onVoltar: () => void;
}

export default function TelaExecucao({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] =
    useState<"Todos" | "Médico" | "Supervisão">("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoDia>("Todos");
  const [filtroAgenda, setFiltroAgenda] =
    useState<"Todos" | TipoAgendaSimples>("Todos");
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | "Todos">(
    "Aprovada"
  );
  const [filtroExecucao, setFiltroExecucao] =
    useState<"Todos" | "Em execução" | "Não iniciada">("Todos");
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");

  const usuarioTI = localStorage.getItem("user") || "TI";

  useEffect(() => {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem("solicitacoes") || "[]"
    );
    setSolicitacoes(data);
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  // 🧾 Registrar histórico
  function registrarHistorico(indexGlobal: number, acao: string, status?: StatusSolicitacao) {
    const novas = [...solicitacoes];
    const item = novas[indexGlobal];
    if (!item) return;

    const novoRegistro: HistoricoTI = {
      data: new Date().toISOString(),
      usuario: usuarioTI,
      acao,
      status,
    };

    if (!item.historicoTI) item.historicoTI = [];
    item.historicoTI.push(novoRegistro);
    atualizarLocalStorage(novas);
  }

  // 📌 Pegar solicitação
  function handlePegar(indexGlobal: number) {
    const novas = [...solicitacoes];
    const item = novas[indexGlobal];
    if (!item) return;

    // já tem responsável? não deixa outro pegar
    if (item.responsavelTI && item.responsavelTI !== usuarioTI) {
      alert(
        `Esta solicitação já está sendo executada por: ${item.responsavelTI}.`
      );
      return;
    }

    if (!item.responsavelTI) {
      item.responsavelTI = usuarioTI;
      registrarHistorico(indexGlobal, "Pegou para execução");
    }
  }

  // 📌 Alterar status (somente quem pegou)
  function handleStatusChange(indexGlobal: number, novoStatus: StatusSolicitacao) {
    const novas = [...solicitacoes];
    const item = novas[indexGlobal];
    if (!item) return;

    if (item.responsavelTI && item.responsavelTI !== usuarioTI) {
      alert(
        `Somente ${item.responsavelTI} pode alterar o status desta solicitação.`
      );
      return;
    }

    item.status = novoStatus;
    registrarHistorico(indexGlobal, "Alterou status", novoStatus);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroOrigem("Todos");
    setFiltroTipo("Todos");
    setFiltroAgenda("Todos");
    setFiltroStatus("Aprovada");
    setFiltroExecucao("Todos");
    setFiltroInicio("");
    setFiltroFim("");
  }

  // 🔍 Filtros
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

      const emExecucao = !!s.responsavelTI;
      const matchExecucao =
        filtroExecucao === "Todos" ||
        (filtroExecucao === "Em execução" && emExecucao) ||
        (filtroExecucao === "Não iniciada" && !emExecucao);

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
        matchExecucao &&
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
    filtroExecucao,
    filtroInicio,
    filtroFim,
  ]);

  return (
    <Screen>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          TI — Execução de Agendas
        </h1>
        <button
          onClick={onVoltar}
          className="text-hsmBlue hover:underline text-sm"
        >
          ← Voltar
        </button>
      </div>

      {/* Filtros principais (reutilizando componente) */}
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

      {/* Filtro extra: Execução */}
      <div className="bg-gray-50 p-3 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Execução:
            </span>
            <select
              value={filtroExecucao}
              onChange={(e) => setFiltroExecucao(e.target.value as any)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option>Todos</option>
              <option>Em execução</option>
              <option>Não iniciada</option>
            </select>
          </div>
          <span className="text-xs text-gray-500">
            Usuário logado (TI): <strong>{usuarioTI}</strong>
          </span>
        </div>
      </div>

      {/* Lista */}
      {solicitacoesFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        solicitacoesFiltradas.map((sol, indexFiltrado) => {
          const indexGlobal = solicitacoes.indexOf(sol);

          return (
            <div
              key={indexGlobal}
              className="border rounded-xl p-4 mb-4 shadow-sm bg-gray-50"
            >
              <div className="flex justify-between items-center">
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
                    <p className="text-sm text-gray-600">
                      <strong>Nº Solicitação:</strong>{" "}
                      {sol.numeroSolicitacao}
                    </p>
                  )}

                  {sol.responsavelTI && (
                    <p className="text-sm text-green-600">
                      Em execução por: <strong>{sol.responsavelTI}</strong>
                    </p>
                  )}
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

                {/* Histórico */}
                {sol.historicoTI && sol.historicoTI.length > 0 && (
                  <div className="border rounded-lg bg-gray-100 p-3 mb-3">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Histórico de execução:
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {sol.historicoTI.map((h, i) => (
                        <li key={i}>
                          {format(new Date(h.data), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}{" "}
                          — <strong>{h.usuario}</strong> {h.acao}
                          {h.status && ` (${h.status})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-3 justify-end">
                  {!sol.responsavelTI && (
                    <Button
                      color="primary"
                      onClick={() => handlePegar(indexGlobal)}
                    >
                      🤝 Pegar para mim
                    </Button>
                  )}

                  {sol.responsavelTI === usuarioTI && (
                    <select
                      value={sol.status}
                      onChange={(e) =>
                        handleStatusChange(
                          indexGlobal,
                          e.target.value as StatusSolicitacao
                        )
                      }
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="Encaminhada">Encaminhada</option>
                      <option value="Aprovada">Aprovada</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Recusada">Recusada</option>
                    </select>
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
