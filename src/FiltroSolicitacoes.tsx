import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

interface Props {
  busca: string;
  setBusca: (v: string) => void;

  filtroOrigem: string;
  setFiltroOrigem: (v: any) => void;

  filtroTipo: string;
  setFiltroTipo: (v: any) => void;

  filtroAgenda: string;
  setFiltroAgenda: (v: any) => void;

  filtroStatus: string;
  setFiltroStatus: (v: any) => void;

  filtroInicio: string;
  setFiltroInicio: (v: string) => void;

  filtroFim: string;
  setFiltroFim: (v: string) => void;

  onLimpar: () => void;
}

export default function FiltroSolicitacoes(props: Props) {
  const {
    busca,
    setBusca,
    filtroOrigem,
    setFiltroOrigem,
    filtroTipo,
    setFiltroTipo,
    filtroAgenda,
    setFiltroAgenda,
    filtroStatus,
    setFiltroStatus,
    filtroInicio,
    setFiltroInicio,
    filtroFim,
    setFiltroFim,
    onLimpar,
  } = props;

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">

        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Buscar por médico
          </label>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Origem</label>
          <Select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
          >
            <option>Todos</option>
            <option>Médico</option>
            <option>Supervisão</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <Select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option>Todos</option>
            <option>Abertura</option>
            <option>Fechamento</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Tipo de Agenda
          </label>
          <Select
            value={filtroAgenda}
            onChange={(e) => setFiltroAgenda(e.target.value)}
          >
            <option>Todos</option>
            <option>Convênio</option>
            <option>HSM+</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option>Pendente</option>
            <option>Encaminhada</option>
            <option>Aprovada</option>
            <option>Recusada</option>
            <option>Concluída</option>
            <option>Todos</option>
          </Select>
        </div>
      </div>

      {/* Período */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div>
          <label className="text-sm font-medium text-gray-700">De</label>
          <Input
            type="date"
            value={filtroInicio}
            onChange={(e) => setFiltroInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Até</label>
          <Input
            type="date"
            value={filtroFim}
            onChange={(e) => setFiltroFim(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button onClick={onLimpar} className="text-sm text-red-500 hover:underline">
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
