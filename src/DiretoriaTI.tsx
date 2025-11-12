import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Dia {
  data: string;
  inicio: string;
  tipo: string;
}

interface HistoricoTI {
  data: string;
  usuario: string;
  acao: string;
  status?: string;
}

interface Solicitacao {
  solicitante: string;
  tipoAgenda: string;
  tiposAgenda?: Array<"Convênio" | "HSM+">;
  dias: Dia[];
  observacao: string;
  dataEnvio: string;
  status: "Encaminhada" | "Aprovada" | "Recusada" | "Concluída";
  origem: "Médico" | "Supervisão";
  anexo?: string;
  numero?: string;
  responsavelTI?: string;
  historicoTI?: HistoricoTI[];
}

interface Props {
  onVoltar: () => void;
}

export default function DiretoriaTI({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<"Todos" | "Médico" | "Supervisão">("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "Abertura" | "Fechamento">("Todos");
  const [filtroAgenda, setFiltroAgenda] = useState<"Todos" | "Convênio" | "HSM+">("Todos");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | "Encaminhada" | "Aprovada" | "Recusada" | "Concluída"
  >("Aprovada");
  const [filtroExecucao, setFiltroExecucao] = useState<"Todos" | "Em execução" | "Não iniciada">("Todos");
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");

  const usuarioTI = localStorage.getItem("user") || "TI";

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("solicitacoes") || "[]");
    setSolicitacoes(data);
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  // 🧾 Registrar histórico
  function registrarHistorico(index: number, acao: string, status?: string) {
    const novas = [...solicitacoes];
    const item = novas[index];
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
  function handlePegar(index: number) {
    const novas = [...solicitacoes];
    if (!novas[index].responsavelTI) {
      novas[index].responsavelTI = usuarioTI;
      registrarHistorico(index, "Pegou para execução");
    }
  }

  // 📌 Alterar status
  function handleStatusChange(index: number, novoStatus: Solicitacao["status"]) {
    const novas = [...solicitacoes];
    novas[index].status = novoStatus;
    registrarHistorico(index, "Alterou status", novoStatus);
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
      const matchNome = s.solicitante.toLowerCase().includes(busca.toLowerCase());
      const matchOrigem = filtroOrigem === "Todos" || s.origem === filtroOrigem;
      const matchStatus = filtroStatus === "Todos" || s.status === filtroStatus;
      const matchTipo = filtroTipo === "Todos" || s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" ||
        (s.tiposAgenda?.includes(filtroAgenda) ?? s.tipoAgenda === filtroAgenda);

      // Execução
      const emExecucao = !!s.responsavelTI;
      const matchExecucao =
        filtroExecucao === "Todos" ||
        (filtroExecucao === "Em execução" && emExecucao) ||
        (filtroExecucao === "Não iniciada" && !emExecucao);

      // Período
      const dataEnvio = new Date(s.dataEnvio);
      const inicio = filtroInicio ? new Date(filtroInicio) : null;
      const fim = filtroFim ? new Date(filtroFim) : null;
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
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">TI — Execução de Agendas</h1>
          <button onClick={onVoltar} className="text-hsmBlue hover:underline text-sm">
            ← Voltar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">Buscar por médico</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Origem</label>
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
              <label className="block text-sm font-medium mb-1 text-gray-700">Tipo</label>
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
              <label className="block text-sm font-medium mb-1 text-gray-700">Tipo de Agenda</label>
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
              <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Aprovada</option>
                <option>Encaminhada</option>
                <option>Recusada</option>
                <option>Concluída</option>
                <option>Todos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Execução</label>
              <select
                value={filtroExecucao}
                onChange={(e) => setFiltroExecucao(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Todos</option>
                <option>Em execução</option>
                <option>Não iniciada</option>
              </select>
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">De</label>
              <input
                type="date"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Até</label>
              <input
                type="date"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button onClick={limparFiltros} className="text-sm text-red-500 hover:underline">
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista */}
        {solicitacoesFiltradas.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhuma solicitação encontrada.</p>
        ) : (
          solicitacoesFiltradas.map((sol, index) => (
            <div key={index} className="border rounded-xl p-4 mb-4 shadow-sm bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-hsmBlue text-lg">{sol.solicitante}</h2>
                  <p className="text-sm text-gray-500">
                    {sol.origem === "Supervisão"
                      ? "🧾 Inserido pela supervisão"
                      : "🩺 Enviado pelo médico"}{" "}
                    em{" "}
                    {format(new Date(sol.dataEnvio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Tipo de Agenda:</strong>{" "}
                    {sol.tiposAgenda?.join(" + ") || sol.tipoAgenda}
                  </p>

                  {sol.numero && (
                    <p className="text-sm text-gray-500">
                      <strong>Nº Solicitação:</strong> {sol.numero}
                    </p>
                  )}

                  {sol.responsavelTI && (
                    <p className="text-sm text-green-600">
                      Em execução por: <strong>{sol.responsavelTI}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
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
                    className="text-sm text-hsmBlue hover:underline flex items-center gap-1"
                    onClick={() => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))}
                  >
                    <span>{expanded[index] ? "Recolher" : "Ver detalhes"}</span>
                    <span
                      className={`transform transition-transform duration-300 ${
                        expanded[index] ? "rotate-180" : ""
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
                  expanded[index] ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border rounded-lg bg-white p-3 mb-3">
                  <h3 className="font-medium mb-2 text-gray-700">Dias e horários:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {sol.dias.map((d, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{format(new Date(d.data), "dd/MM/yyyy", { locale: ptBR })}</span>
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
                    <h3 className="font-medium text-gray-700 mb-2">Histórico de execução:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {sol.historicoTI.map((h, i) => (
                        <li key={i}>
                          {format(new Date(h.data), "dd/MM/yyyy HH:mm", { locale: ptBR })} —{" "}
                          <strong>{h.usuario}</strong> {h.acao}
                          {h.status && ` (${h.status})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-3 justify-end">
                  {!sol.responsavelTI && (
                    <button
                      onClick={() => handlePegar(index)}
                      className="bg-hsmBlue text-white px-4 py-2 rounded-lg hover:bg-hsmCyan transition"
                    >
                      🤝 Pegar para mim
                    </button>
                  )}

                  {sol.responsavelTI === usuarioTI && (
                    <select
                      value={sol.status}
                      onChange={(e) => handleStatusChange(index, e.target.value as any)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="Encaminhada">Encaminhada</option>
                      <option value="Aprovada">Aprovada</option>
                      <option value="Recusada">Recusada</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
