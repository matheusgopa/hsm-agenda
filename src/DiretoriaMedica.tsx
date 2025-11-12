import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Dia {
  data: string;
  inicio: string;
  tipo: string;
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
}

interface Props {
  onVoltar: () => void;
}

export default function DiretoriaMedica({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  // filtros
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<"Todos" | "Médico" | "Supervisão">("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "Abertura" | "Fechamento">("Todos");
  const [filtroAgenda, setFiltroAgenda] = useState<"Todos" | "Convênio" | "HSM+">("Todos");
  const [filtroStatus, setFiltroStatus] = useState<
    "Encaminhada" | "Aprovada" | "Recusada" | "Concluída" | "Todos"
  >("Encaminhada");
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("solicitacoes") || "[]");
    setSolicitacoes(data.filter((s: any) => s.status !== "Pendente"));
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  function handleAprovar(index: number) {
    const novas = [...solicitacoes];
    novas[index].status = "Aprovada";
    atualizarLocalStorage(novas);
  }

  function handleRecusar(index: number) {
    const novas = [...solicitacoes];
    novas[index].status = "Recusada";
    atualizarLocalStorage(novas);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroOrigem("Todos");
    setFiltroTipo("Todos");
    setFiltroAgenda("Todos");
    setFiltroStatus("Encaminhada"); // padrão ao resetar
    setFiltroInicio("");
    setFiltroFim("");
  }

  // seleção múltipla
  function toggleSelecionada(index: number) {
    setSelecionadas((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function selecionarTodas() {
    if (selecionadas.length === solicitacoesFiltradas.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(solicitacoesFiltradas.map((_, i) => i));
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
    if (novas[i].status === "Encaminhada") {
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
    if (novas[i].status === "Encaminhada") {
      novas[i].status = "Recusada";
    }
  });
  atualizarLocalStorage(novas);
  setSelecionadas([]);
}


  // filtros
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      const matchNome = s.solicitante.toLowerCase().includes(busca.toLowerCase());
      const matchOrigem = filtroOrigem === "Todos" || s.origem === filtroOrigem;
      const matchStatus = filtroStatus === "Todos" || s.status === filtroStatus;
      const matchTipo = filtroTipo === "Todos" || s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" ||
        (s.tiposAgenda?.includes(filtroAgenda) ?? s.tipoAgenda === filtroAgenda);

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
        matchPeriodo
      );
    });
  }, [solicitacoes, busca, filtroOrigem, filtroTipo, filtroAgenda, filtroStatus, filtroInicio, filtroFim]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Diretoria Médica — Aprovação de Solicitações
          </h1>
          <button onClick={onVoltar} className="text-hsmBlue hover:underline text-sm">
            ← Voltar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">
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
                <option>Encaminhada</option>
                <option>Aprovada</option>
                <option>Recusada</option>
                <option>Concluída</option>
                <option>Todos</option>
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

       {/* Ações em massa */}
{solicitacoesFiltradas.length > 0 && (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={
          selecionadas.length > 0 &&
          selecionadas.length === solicitacoesFiltradas.length
        }
        onChange={selecionarTodas}
      />
      <span className="text-sm text-gray-700">Selecionar todas</span>
    </div>

    {/* Só mostra botões se TODAS selecionadas estiverem “Encaminhadas” */}
    {selecionadas.length > 0 &&
      selecionadas.every(
        (i) => solicitacoesFiltradas[i].status === "Encaminhada"
      ) && (
        <div className="flex gap-3">
          <button
            onClick={aprovarSelecionadas}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            ✅ Aprovar selecionadas
          </button>

          <button
            onClick={recusarSelecionadas}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            ❌ Recusar selecionadas
          </button>
        </div>
      )}
  </div>
)}


        {/* Listagem */}
        {solicitacoesFiltradas.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhuma solicitação encontrada.</p>
        ) : (
          solicitacoesFiltradas.map((sol, index) => {
            const iGlobal = solicitacoes.indexOf(sol);
            return (
              <div
                key={index}
                className={`border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 transition-all ${
                  selecionadas.includes(index) ? "ring-2 ring-hsmBlue" : ""
                }`}
              >
                {/* Cabeçalho */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selecionadas.includes(index)}
                      onChange={() => toggleSelecionada(index)}
                    />
                    <div>
                      <h2 className="font-semibold text-hsmBlue text-lg">{sol.solicitante}</h2>
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
                    </div>
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
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
                      }
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
                          <span>
                            {format(new Date(d.data), "dd/MM/yyyy", { locale: ptBR })}
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
      <button
        onClick={() => handleAprovar(iGlobal)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        ✅ Aprovar
      </button>
      <button
        onClick={() => handleRecusar(iGlobal)}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        ❌ Recusar
      </button>
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
      </div>
    </div>
  );
}
