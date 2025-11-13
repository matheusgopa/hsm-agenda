import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

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
  status: "Pendente" | "Encaminhada" | "Aprovada" | "Recusada";
  origem: "Médico" | "Supervisão";
  obsSupervisao?: string;
  anexo?: string;
  NumeroSolicitacao?: string;
}

interface Props {
  onVoltar: () => void;
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function Supervisao({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [criando, setCriando] = useState(false);
  const [solicitante, setSolicitante] = useState("");
  const [tiposAgenda, setTiposAgenda] = useState<Array<"Convênio" | "HSM+">>(
    []
  );
  const [dias, setDias] = useState<Dia[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [observacao, setObservacao] = useState("");
  const [anexo, setAnexo] = useState<string | null>(null);
  const [numeroSolicitacao, setNumeroSolicitacao] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // filtros
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<
    "Todos" | "Médico" | "Supervisão"
  >("Todos");
  const [filtroTipo, setFiltroTipo] = useState<
    "Todos" | "Abertura" | "Fechamento"
  >("Todos");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | "Pendente" | "Encaminhada" | "Aprovada" | "Recusada" | "Concluída"
  >("Pendente");
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");
  const [filtroAgenda, setFiltroAgenda] = useState<
    "Todos" | "Convênio" | "HSM+"
  >("Todos");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("solicitacoes") || "[]");
    data.forEach((s: any) => {
      if (!s.status) s.status = "Pendente";
      if (!s.origem) s.origem = "Médico";
      if (!s.tipoAgenda) s.tipoAgenda = "Convênio";
      if (!s.tiposAgenda)
        s.tiposAgenda = s.tipoAgenda.split("+").map((t: string) => t.trim());
    });
    localStorage.setItem("solicitacoes", JSON.stringify(data));
    setSolicitacoes(data);
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  function handleObsChange(index: number, valor: string) {
    const novas = [...solicitacoes];
    novas[index].obsSupervisao = valor;
    atualizarLocalStorage(novas);
  }

  function handleEncaminhar(index: number) {
    const novas = [...solicitacoes];
    novas[index].status = "Encaminhada";
    atualizarLocalStorage(novas);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAnexo(reader.result as string);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    setDias((prev) => {
      const selectedKeys = new Set(selectedDates.map(toKey));
      let next = prev.filter((d) => selectedKeys.has(d.data));
      const existing = new Set(next.map((d) => d.data));
      selectedDates.forEach((date) => {
        const key = toKey(date);
        if (!existing.has(key)) {
          next.push({ data: key, inicio: "08:00", tipo: "Abertura" });
        }
      });
      next.sort((a, b) => a.data.localeCompare(b.data));
      return next;
    });
  }, [selectedDates]);

  useEffect(() => {
    if (criando) {
      const anoAtual = new Date().getFullYear();
      const ultima = localStorage.getItem("ultimoNumeroSolicitacao");
      let novoNumero = 1;
      if (ultima) {
        const [num, ano] = ultima.split("/").map((v) => v.trim());
        if (parseInt(ano) === anoAtual) novoNumero = parseInt(num) + 1;
      }
      const numeroAtual = `${novoNumero}/${anoAtual}`;
      setNumeroSolicitacao(numeroAtual);
      localStorage.setItem("ultimoNumeroSolicitacao", numeroAtual);
    }
  }, [criando]);

  function handleCriarSolicitacao(e: React.FormEvent) {
    e.preventDefault();
    if (!solicitante || dias.length === 0) {
      alert("Preencha o nome do médico e selecione pelo menos um dia.");
      return;
    }
    if (tiposAgenda.length === 0) {
      alert("Selecione pelo menos um tipo de agenda (Convênio e/ou HSM+).");
      return;
    }

    const nova: Solicitacao = {
      solicitante,
      tipoAgenda: tiposAgenda.join(" + "),
      tiposAgenda,
      dias,
      observacao,
      dataEnvio: new Date().toISOString(),
      status: "Encaminhada",
      origem: "Supervisão",
      anexo: anexo || undefined,
      NumeroSolicitacao: numeroSolicitacao,
    };

    const novas = [...solicitacoes, nova];
    atualizarLocalStorage(novas);
    setCriando(false);
    setSolicitante("");
    setSelectedDates([]);
    setObservacao("");
    setAnexo(null);
    setTiposAgenda([]);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroOrigem("Todos");
    setFiltroTipo("Todos");
    setFiltroStatus("Todos");
    setFiltroInicio("");
    setFiltroFim("");
    setFiltroAgenda("Todos");
  }

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
        filtroTipo === "Todos" ||
        s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" ||
        (s.tiposAgenda?.includes(filtroAgenda) ??
          s.tipoAgenda === filtroAgenda);

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
  }, [
    solicitacoes,
    busca,
    filtroOrigem,
    filtroTipo,
    filtroStatus,
    filtroInicio,
    filtroFim,
    filtroAgenda,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-6xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Supervisão — Solicitações Médicas
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setCriando(!criando)}
              className="bg-hsmBlue text-white px-4 py-2 rounded-lg hover:bg-hsmCyan transition text-sm"
            >
              {criando ? "Cancelar" : "+ Nova Solicitação"}
            </button>
            <button
              onClick={onVoltar}
              className="text-hsmBlue hover:underline text-sm"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Filtros */}
        {!criando && (
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option>Pendente</option>
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
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
        )}

        {/* Nº da Solicitação no formulário */}
        {criando && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block font-medium text-gray-700">
                Nº da Solicitação
              </label>
              <input
                type="text"
                value={numeroSolicitacao}
                readOnly
                className="border rounded-lg px-3 py-2 w-40 bg-gray-100 font-semibold text-hsmBlue"
              />
            </div>
            <div className="text-right text-sm text-gray-500">
              {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
        )}

        {/* Formulário completo */}
        {criando ? (
          <form onSubmit={handleCriarSolicitacao} className="space-y-6">
            <div>
              <label className="block font-medium mb-1">
                Médico Solicitante
              </label>
              <input
                type="text"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                placeholder="Nome do médico"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Tipo de Agenda</label>
              <div className="flex gap-6 items-center">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tiposAgenda.includes("Convênio")}
                    onChange={(e) =>
                      setTiposAgenda((prev) =>
                        e.target.checked
                          ? [...prev, "Convênio"]
                          : prev.filter((t) => t !== "Convênio")
                      )
                    }
                  />
                  <span>Convênio</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tiposAgenda.includes("HSM+")}
                    onChange={(e) =>
                      setTiposAgenda((prev) =>
                        e.target.checked
                          ? [...prev, "HSM+"]
                          : prev.filter((t) => t !== "HSM+")
                      )
                    }
                  />
                  <span>HSM+</span>
                </label>
              </div>
            </div>

            <div className="border rounded-xl p-4 bg-gray-50">
              <h2 className="font-semibold text-gray-800 mb-3">
                Selecionar dias
              </h2>
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates ?? [])}
                locale={ptBR}
                numberOfMonths={2}
                showOutsideDays
                weekStartsOn={1}
                captionLayout="dropdown"
                modifiersClassNames={{
                  selected: "bg-hsmBlue text-white !rounded-md",
                }}
              />
            </div>

            {dias.length > 0 && (
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <h2 className="font-semibold mb-3 text-gray-800">
                  Dias selecionados
                </h2>
                {dias.map((dia, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-center gap-2 mb-2"
                  >
                    <input
                      type="text"
                      value={format(fromKey(dia.data), "dd/MM/yyyy")}
                      readOnly
                      className="border rounded-lg px-2 py-2 w-full sm:w-1/3 bg-gray-100"
                    />
                    <input
                      type="time"
                      value={dia.inicio}
                      onChange={(e) =>
                        setDias((prev) => {
                          const copy = [...prev];
                          copy[i].inicio = e.target.value;
                          return copy;
                        })
                      }
                      className="border rounded-lg px-2 py-2 w-full sm:w-1/3"
                    />
                    <select
                      value={dia.tipo}
                      onChange={(e) =>
                        setDias((prev) => {
                          const copy = [...prev];
                          copy[i].tipo = e.target.value;
                          return copy;
                        })
                      }
                      className="border rounded-lg px-2 py-2 w-full sm:w-1/3"
                    >
                      <option value="Abertura">Abertura</option>
                      <option value="Fechamento">Fechamento</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block font-medium mb-1">Observação</label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Justificativa, observações..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Anexo (opcional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="bg-hsmBlue text-white px-4 py-2 rounded-lg hover:bg-hsmCyan transition w-full font-semibold"
            >
              Salvar Solicitação
            </button>
          </form>
        ) : solicitacoesFiltradas.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma solicitação encontrada.
          </p>
        ) : (
          solicitacoesFiltradas.map((sol, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 transition-all"
            >
              {/* Cabeçalho da solicitação */}
              <div
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
                }
              >
                {/* BLOCO DA ESQUERDA: agora com Nº da solicitação embaixo */}
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

                  {sol.NumeroSolicitacao && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Nº Solicitação:</strong>{" "}
                      {sol.NumeroSolicitacao}
                    </p>
                  )}
                </div>

                {/* BLOCO DA DIREITA (status + ver detalhes) */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      sol.status === "Encaminhada"
                        ? "bg-blue-100 text-blue-700"
                        : sol.status === "Aprovada"
                        ? "bg-green-100 text-green-700"
                        : sol.status === "Recusada"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {sol.status}
                  </span>

                  <button className="text-sm text-hsmBlue hover:underline flex items-center gap-1">
                    <span>
                      {expanded[index] ? "Recolher" : "Ver detalhes"}
                    </span>
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
                  expanded[index]
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

                <textarea
                  value={sol.obsSupervisao || ""}
                  onChange={(e) => handleObsChange(index, e.target.value)}
                  placeholder="Observação da supervisão (opcional)"
                  className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
                />

                <div className="flex justify-end">
                  {sol.status === "Pendente" ? (
                    <button
                      onClick={() => handleEncaminhar(index)}
                      className="bg-hsmBlue text-white px-4 py-2 rounded-lg hover:bg-hsmCyan transition"
                    >
                      Encaminhar para Aprovação
                    </button>
                  ) : (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ Encaminhada
                    </span>
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
