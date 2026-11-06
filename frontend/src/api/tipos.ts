export type Perfil = "ADMIN" | "CLIENTE";

export type StatusVeiculo = "DISPONIVEL" | "ALUGADO";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Veiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  valorDiaria: number;
  status: StatusVeiculo;
}

export interface DadosVeiculo {
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  valorDiaria: number;
}

export interface Locacao {
  id: number;
  dataInicio: string;
  dataPrevista: string;
  dataDevolucao: string | null;
  valorDiaria: number;
  valorTotal: number | null;
  veiculo: Pick<Veiculo, "id" | "placa" | "marca" | "modelo">;
  usuario: Pick<Usuario, "id" | "nome" | "email">;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}
