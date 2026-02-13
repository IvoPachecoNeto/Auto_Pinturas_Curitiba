export interface ServiceSelection {
  funil: boolean;
  pintura: boolean;
  retoq: boolean;
  martel: boolean;
  partDescription?: string;
  partPrice?: number;
}

export interface ClientData {
  name: string;
  phone: string;
  cpfCnpj: string;
  date: string; // YYYY-MM-DD
  estimator: string;
  vehicle: string;
  color: string;
  plate: string;
  year: string;
}

export interface Budget {
  id: number;
  clientData: ClientData;
  services: Record<string, ServiceSelection>;
  observations: string;
  createdAt: number;
  totalValue: number;
  logo?: string; // Base64 string for the logo
}

// The exact list of parts requested
export const FIXED_PARTS_LIST = [
  "Para-choque Dian.",
  "Para-choque Tras.",
  "Capô",
  "Para-lama Esq.",
  "Para-lama Dir.",
  "Retrovisores",
  "Maçanetas",
  "Porta Dir. Diant.",
  "Porta Dir. Tras.",
  "Porta Esq. Tras.",
  "Porta Esq. Diant.",
  "Caixa de Ar Dir.",
  "Caixa de Ar Esq.",
  "Coluna Direita",
  "Coluna Esquerda",
  "Lateral Direita",
  "Lateral Esquerda",
  "Moldura Diant. Dir.",
  "Moldura Diant. Esq.",
  "Moldura Tras. Dir.",
  "Moldura Tras. Esq.",
  "Teto",
  "Tampa",
  "Porta-Malas Interno",
  "Painel Traseiro",
  "Polimento de Faróis",
  "Apliq. Para-cho. Dian.",
  "Apliq. Para-cho. Tras."
];
