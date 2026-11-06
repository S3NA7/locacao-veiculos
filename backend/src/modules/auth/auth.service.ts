import { Prisma, type Perfil } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ErroHttp } from "../../lib/erro-http.js";
import { gerarToken } from "../../lib/jwt.js";
import { compararSenha, gerarHash } from "../../lib/senha.js";
import type { DadosLogin, DadosRegistro } from "./auth.schemas.js";

const selecaoPublica = { id: true, nome: true, email: true, perfil: true } as const;

async function definirPerfilInicial(): Promise<Perfil> {
  const total = await prisma.usuario.count();
  return total === 0 ? "ADMIN" : "CLIENTE";
}

function emailDuplicado(erro: unknown) {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
}

export async function registrar(dados: DadosRegistro) {
  const perfil = await definirPerfilInicial();
  const senhaHash = await gerarHash(dados.senha);

  try {
    const usuario = await prisma.usuario.create({
      data: { nome: dados.nome, email: dados.email, senhaHash, perfil },
      select: selecaoPublica
    });
    return { ...usuario, token: gerarToken({ sub: usuario.id, perfil: usuario.perfil }) };
  } catch (erro) {
    if (emailDuplicado(erro)) {
      throw new ErroHttp(409, "Email já cadastrado");
    }
    throw erro;
  }
}

export async function login(dados: DadosLogin) {
  const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
  const senhaConfere = usuario ? await compararSenha(dados.senha, usuario.senhaHash) : false;

  if (!usuario || !senhaConfere) {
    throw new ErroHttp(401, "Credenciais inválidas");
  }

  return {
    token: gerarToken({ sub: usuario.id, perfil: usuario.perfil }),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
  };
}

export async function buscarPorId(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: selecaoPublica });
  if (!usuario) {
    throw new ErroHttp(404, "Usuário não encontrado");
  }
  return usuario;
}
