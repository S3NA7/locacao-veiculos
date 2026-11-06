import { prisma } from "../src/lib/prisma.js";

export async function limparBanco() {
  await prisma.locacao.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.usuario.deleteMany();
}
