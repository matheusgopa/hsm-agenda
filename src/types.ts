// src/types.ts

// Quem criou a solicitação
export type Origem = "Médico" | "Supervisão";

// Tipo do dia dentro da solicitação
export type TipoDia = "Abertura" | "Fechamento";

// Tipos de agenda possíveis
export type TipoAgendaSimples = "Convênio" | "HSM+";

// Status único para TODO o fluxo
export type StatusSolicitacao =
  | "Pendente"
  | "Encaminhada"
  | "Aprovada"
  | "Recusada"
  | "Concluída";

export interface Dia {
  data: string;   // "yyyy-MM-dd"
  inicio: string; // "HH:mm"
  tipo: TipoDia;
}

export interface HistoricoTI {
  data: string;           // ISO string
  usuario: string;
  acao: string;
  status?: StatusSolicitacao;
}

export interface Solicitacao {
  solicitante: string;
  tipoAgenda: string;           // string já combinada ("Convênio + HSM+")
  tiposAgenda?: TipoAgendaSimples[]; // array para filtros

  dias: Dia[];
  observacao: string;
  dataEnvio: string;            // ISO string (new Date().toISOString())
  status: StatusSolicitacao;
  origem: Origem;

  obsSupervisao?: string;
  anexo?: string;

  // Número único "N/AAAA"
  NumeroSolicitacao?: string;

  // Campos usados na TI
  responsavelTI?: string;
  historicoTI?: HistoricoTI[];
}
