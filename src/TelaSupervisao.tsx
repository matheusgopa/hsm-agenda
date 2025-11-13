// src/TelaSupervisao.tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import Screen from "./ui/Screen";
import { Button } from "./ui/Button";
import { StatusBadge } from "./ui/Badge";
import FiltroSolicitacoes from "./FiltroSolicitacoes";

import {
  Dia,
  Solicitacao,
  StatusSolicitacao,
  TipoAgendaSimples,
  TipoDia,
} from "./types";

// Helpers
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

interface Props {
  onVoltar: () => void;
}

export default function TelaSupervisao({ onVoltar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [criando, setCriando] = useState(false);

  const [solicitante, setSolicitante] = useState("");
  const [tiposAgenda, setTiposAgenda] = useState<TipoAgendaSimples[]>([]);
  const [dias, setDias] = useState<Dia[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [observacao, setObservacao] = useState("");
  const [anexo, setAnexo] = useState<string | null>(null);
  const [numeroSolicitacao, setNumeroSolicitacao] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<
    "Todos" | "Médico" | "Supervisão"
  >("Todos");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoDia>("Todos");
  const [filtroStatus, setFiltroStatus] = useState<
    "Todos" | StatusSolicitacao
  >("Pendente");
  const [filtroInicio, setFiltroInicio] = useState<string>("");
  const [filtroFim, setFiltroFim] = useState<string>("");
  const [filtroAgenda, setFiltroAgenda] =
    useState<"Todos" | TipoAgendaSimples>("Todos");

  // 🔁 Carregar e normalizar (inclui correção de NumeroSolicitacao → numeroSolicitacao)
  useEffect(() => {
    let data: any[] = JSON.parse(localStorage.getItem("solicitacoes") || "[]");

    const anoAtual = new Date().getFullYear();

    data = data.map((s, i) => {
      const numero =
        s.numeroSolicitacao ||
        s.NumeroSolicitacao || // remover legado
        `${i + 1}/${anoAtual}`;

      return {
        ...s,
        numeroSolicitacao: numero,
        tiposAgenda:
          s.tiposAgenda ??
          s.tipoAgenda?.split("+").map((t: string) => t.trim()) ??
          ["Convênio"],
        status: s.status || "Pendente",
        origem: s.origem || "Médico",
      };
    });

    localStorage.setItem("solicitacoes", JSON.stringify(data));
    localStorage.setItem(
      "ultimoNumeroSolicitacao",
      data[data.length - 1]?.numeroSolicitacao || `1/${anoAtual}`
    );

    setSolicitacoes(data);
  }, []);

  function atualizarLocalStorage(lista: Solicitacao[]) {
    setSolicitacoes(lista);
    localStorage.setItem("solicitacoes", JSON.stringify(lista));
  }

  // Observação da supervisão
  function handleObsChange(indexGlobal: number, valor: string) {
    const novas = [...solicitacoes];
    novas[indexGlobal].obsSupervisao = valor;
    atualizarLocalStorage(novas);
  }

  // Encaminhar
  function handleEncaminhar(indexGlobal: number) {
    const novas = [...solicitacoes];
    novas[indexGlobal].status = "Encaminhada";
    atualizarLocalStorage(novas);
  }

  // Upload de anexo
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAnexo(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Montagem dos dias selecionados
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

  // Geração do número da solicitação ao abrir o formulário
  useEffect(() => {
    if (!criando) return;

    const anoAtual = new Date().getFullYear();
    const ultima = localStorage.getItem("ultimoNumeroSolicitacao");

    let novoNumero = 1;
    if (ultima) {
      const [num, ano] = ultima.split("/");
      if (parseInt(ano) === anoAtual) novoNumero = parseInt(num) + 1;
    }

    const numeroAtual = `${novoNumero}/${anoAtual}`;
    setNumeroSolicitacao(numeroAtual);
    localStorage.setItem("ultimoNumeroSolicitacao", numeroAtual);
  }, [criando]);

  // Criar solicitação
  function handleCriarSolicitacao(e: React.FormEvent) {
    e.preventDefault();

    if (!solicitante || dias.length === 0) {
      alert("Preencha o nome do médico e selecione pelo menos um dia.");
      return;
    }

    if (tiposAgenda.length === 0) {
      alert("Selecione Convênio e/ou HSM+.");
      return;
    }

    const nova: Solicitacao = {
      solicitante,
      tipoAgenda: tiposAgenda.join(" + "),
      tiposAgenda,
      dias,
      observacao,
      dataEnvio: new Date().toISOString(),
      status: "Pendente",
      origem: "Supervisão",
      anexo: anexo || undefined,
      numeroSolicitacao,
    };

    atualizarLocalStorage([...solicitacoes, nova]);

    // reset form
    setCriando(false);
    setSolicitante("");
    setSelectedDates([]);
    setObservacao("");
    setAnexo(null);
    setTiposAgenda([]);
  }

  // Filtros
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
      const matchNome = s.solicitante.toLowerCase().includes(busca.toLowerCase());
      const matchOrigem = filtroOrigem === "Todos" || s.origem === filtroOrigem;
      const matchStatus = filtroStatus === "Todos" || s.status === filtroStatus;
      const matchTipo =
        filtroTipo === "Todos" || s.dias.some((d) => d.tipo === filtroTipo);
      const matchAgenda =
        filtroAgenda === "Todos" || s.tiposAgenda?.includes(filtroAgenda);

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
    filtroStatus,
    filtroInicio,
    filtroFim,
    filtroAgenda,
  ]);

  return (
    <Screen>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Supervisão — Solicitações Médicas
        </h1>

        <div className="flex gap-3">
          <Button color="primary" onClick={() => setCriando(!criando)}>
            {criando ? "Cancelar" : "+ Nova Solicitação"}
          </Button>

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
      )}

      {/* Nº Solicitação ao criar */}
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

      {/* Formulário */}
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

          {/* Checkbox Tipo Agenda */}
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

          {/* Calendário */}
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

          {/* Dias selecionados */}
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
                        copy[i].tipo = e.target.value as TipoDia;
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

          {/* Observação */}
          <div>
            <label className="block font-medium mb-1">Observação</label>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Justificativa, observações..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Anexo */}
          <div>
            <label className="block font-medium mb-1">Anexo (opcional)</label>

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Botão salvar */}
          <Button type="submit" color="primary" className="w-full">
            Salvar Solicitação
          </Button>
        </form>
      ) : solicitacoesFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        // LISTA DE SOLICITAÇÕES
        solicitacoesFiltradas.map((sol, indexFiltrado) => {
          const indexGlobal = solicitacoes.indexOf(sol);

          return (
            <div
              key={indexGlobal}
              className="border rounded-xl p-4 mb-4 shadow-sm bg-gray-50 transition-all"
            >
              {/* CARD HEADER */}
              <div
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [indexFiltrado]: !prev[indexFiltrado],
                  }))
                }
              >
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

                  {/* Tipo Agenda */}
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Tipo de Agenda:</strong>{" "}
                    {sol.tiposAgenda?.join(" + ")}
                  </p>

                  {/* Número da Solicitação */}
                  {sol.numeroSolicitacao && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Nº Solicitação:</strong>{" "}
                      {sol.numeroSolicitacao}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={sol.status} />

                  <button className="text-sm text-hsmBlue hover:underline flex items-center gap-1">
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

              {/* DETALHES */}
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

                {/* Observação do médico */}
                {sol.observacao && (
                  <p className="text-sm text-gray-500 italic mb-3">
                    Observação: "{sol.observacao}"
                  </p>
                )}

                {/* Anexo */}
                {sol.anexo && (
                  <a
                    href={sol.anexo}
                    target="_blank"
                    className="text-hsmBlue text-sm underline block mb-3"
                  >
                    📎 Ver Anexo
                  </a>
                )}

                {/* Observação da supervisão */}
                <textarea
                  value={sol.obsSupervisao || ""}
                  onChange={(e) =>
                    handleObsChange(indexGlobal, e.target.value)
                  }
                  placeholder="Observação da supervisão (opcional)"
                  className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
                />

                {/* Botão encaminhar */}
                <div className="flex justify-end">
                  {sol.status === "Pendente" ? (
                    <Button
                      color="primary"
                      onClick={() => handleEncaminhar(indexGlobal)}
                    >
                      Encaminhar para Aprovação
                    </Button>
                  ) : (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ Encaminhada
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
