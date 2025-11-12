import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoSolicitacao = "Abertura" | "Fechamento";

interface Dia {
  data: string;
  inicio: string;
  tipo: TipoSolicitacao;
}

interface Props {
  user: string;
  onLogout: () => void;
  onShowHistorico: () => void;
}

function toKey(d: Date) {
  // Evita conversão de fuso (mantém o dia certo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// 🔧 Corrige exibição de data (sem UTC)
function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function GmudAgendaForm({
  user,
  onLogout,
  onShowHistorico,
}: Props) {
  const [solicitante, setSolicitante] = useState(user);
  const [dias, setDias] = useState<Dia[]>([]);
  const [observacao, setObservacao] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [tiposAgenda, setTiposAgenda] = useState<Array<"Convênio" | "HSM+">>([]);
  const [numeroSolicitacao, setNumeroSolicitacao] = useState("");


  const diasOrdenados = useMemo(
    () => [...dias].sort((a, b) => a.data.localeCompare(b.data)),
    [dias]
  );

  // 🧠 Carrega rascunho salvo
  useEffect(() => {
    try {
      const draft = localStorage.getItem("rascunhoGmud");
      if (draft) {
        const parsed = JSON.parse(draft);
        setSolicitante(parsed.solicitante || user);
        setDias(parsed.dias || []);
        setObservacao(parsed.observacao || "");
        setTiposAgenda(parsed.tiposAgenda || []);
        setSelectedDates(parsed.selectedDates?.map((d: string) => new Date(d)) || []);
      }
    } catch {
      console.warn("Erro ao carregar rascunho, limpando dados...");
      localStorage.removeItem("rascunhoGmud");
    }
  }, [user]);

  // 💾 Salva rascunho automaticamente
  useEffect(() => {
    localStorage.setItem(
      "rascunhoGmud",
      JSON.stringify({
        solicitante,
        dias,
        observacao,
        tiposAgenda,
        selectedDates,
      })
    );
  }, [solicitante, dias, observacao, tiposAgenda, selectedDates]);

  // 🔢 Gera número de solicitação único e sequencial
useEffect(() => {
  const anoAtual = new Date().getFullYear();
  const ultima = localStorage.getItem("ultimoNumeroSolicitacao");

  let novoNumero = 1;

  if (ultima) {
    const [num, ano] = ultima.split("/").map((v) => v.trim());
    if (parseInt(ano) === anoAtual) {
      novoNumero = parseInt(num) + 1;
    }
  }

  const numeroAtual = `${novoNumero}/${anoAtual}`;
  setNumeroSolicitacao(numeroAtual);
  localStorage.setItem("ultimoNumeroSolicitacao", numeroAtual);
}, []);


  // 🗓️ Atualiza dias ao mudar seleção no calendário
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

  function handleChange<T extends keyof Dia>(
    index: number,
    field: T,
    value: Dia[T]
  ) {
    setDias((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  }

  function handleClearAll() {
    setSelectedDates([]);
    setDias([]);
  }

  // 🚀 Envio
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (dias.length === 0) {
      alert("Selecione pelo menos um dia.");
      return;
    }

    if (tiposAgenda.length === 0) {
      alert("Selecione pelo menos um tipo de agenda (Convênio e/ou HSM+).");
      return;
    }

    const novaSolicitacao = {
      solicitante,
      tipoAgenda: tiposAgenda.join(" + "), // string amigável
      tiposAgenda, // guarda o array também
      dias,
      observacao,
      dataEnvio: new Date().toISOString(),
      status: "Pendente",
      origem: "Médico",
    };

    const antigas = JSON.parse(localStorage.getItem("solicitacoes") || "[]") || [];
    antigas.push(novaSolicitacao);
    localStorage.setItem("solicitacoes", JSON.stringify(antigas));
    localStorage.removeItem("rascunhoGmud");

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-hsmBlue/80 to-hsmCyan/30 text-center p-6">
        <h1 className="text-3xl font-bold text-white mb-4">
          ✅ Solicitação Enviada!
        </h1>
        <p className="text-white/90 mb-6">
          Sua solicitação foi registrada com sucesso.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setEnviado(false)}
            className="bg-hsmBlue text-white px-4 py-2 rounded-lg hover:bg-hsmCyan transition"
          >
            Nova Solicitação
          </button>
          <button
            onClick={onShowHistorico}
            className="bg-white text-hsmBlue font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Ver Minhas Solicitações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-hsmBlue/90 to-hsmCyan/30 flex items-start justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-5xl">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Solicitação de Abertura/Fechamento
          </h1>
          <div className="flex gap-2">
            <button
              onClick={onShowHistorico}
              className="text-sm text-hsmBlue hover:underline"
            >
              Minhas Solicitações
            </button>
            <button
              onClick={onLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Sair
            </button>
          </div>
        </div>
<div className="flex items-center justify-between mb-4">
  <div>
    <label className="block font-medium text-gray-700">Nº da Solicitação</label>
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

        {/* 🧾 Formulário principal */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-medium mb-1">Médico Solicitante</label>
            <input
              type="text"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* ✅ Checkboxes de Tipo de Agenda */}
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
            <p className="text-xs text-gray-500 mt-1">
              Você pode marcar ambos ou apenas um.
            </p>
          </div>

          {/* 📅 Calendário e Lista */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border rounded-xl p-4 bg-gray-50">
              <h2 className="font-semibold text-gray-800 mb-3">Escolha os dias</h2>

              {selectedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-hsmBlue/10 text-hsmBlue border border-hsmBlue/30 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-hsmBlue/20 transition"
                      onClick={() =>
                        setSelectedDates((prev) =>
                          prev.filter((d) => d.getTime() !== date.getTime())
                        )
                      }
                      title="Clique para remover"
                    >
                      {format(date, "dd/MM/yyyy", { locale: ptBR })}
                      <span className="ml-2 text-hsmBlue font-bold">×</span>
                    </div>
                  ))}
                  <button
                    onClick={handleClearAll}
                    type="button"
                    className="bg-red-100 text-red-600 border border-red-300 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition"
                  >
                    Limpar tudo
                  </button>
                </div>
              )}

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

            {/* ⏰ Configurar horários */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Configurar horários</h2>
              {diasOrdenados.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum dia selecionado ainda.</p>
              ) : (
                diasOrdenados.map((dia, i) => (
                  <div
                    key={i}
                    className={`flex flex-col sm:flex-row items-center gap-2 mb-3 border rounded-lg p-2 ${
                      dia.tipo === "Abertura"
                        ? "border-hsmBlue bg-blue-50"
                        : "border-red-400 bg-red-50"
                    }`}
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
                      onChange={(e) => handleChange(i, "inicio", e.target.value)}
                      className="border rounded-lg px-2 py-2 w-full sm:w-1/3"
                      required
                    />
                    <select
                      value={dia.tipo}
                      onChange={(e) => {
                        const tipo = e.target.value as TipoSolicitacao;
                        handleChange(i, "tipo", tipo);
                        handleChange(
                          i,
                          "inicio",
                          tipo === "Abertura" ? "08:00" : "12:00"
                        );
                      }}
                      className="border rounded-lg px-2 py-2 w-full sm:w-1/3"
                    >
                      <option value="Abertura">Abertura</option>
                      <option value="Fechamento">Fechamento</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block font-medium mb-1">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          {/* Botão enviar */}
          <button
            type="submit"
            className="w-full bg-hsmBlue text-white font-semibold py-2 rounded-lg hover:bg-hsmCyan transition"
          >
            Enviar Solicitação
          </button>
        </form>
      </div>
    </div>
  );
}
