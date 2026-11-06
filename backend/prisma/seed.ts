import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const veiculosIniciais = [
  { placa: "ABC1D23", marca: "Fiat", modelo: "Argo", ano: 2022, valorDiaria: 120 },
  { placa: "DEF4E56", marca: "Volkswagen", modelo: "Polo", ano: 2023, valorDiaria: 150 },
  { placa: "GHI7F89", marca: "Toyota", modelo: "Corolla", ano: 2024, valorDiaria: 260 }
];

async function semear() {
  const senhaHash = await bcrypt.hash("admin123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@locadora.com" },
    update: { senhaHash, perfil: "ADMIN" },
    create: { nome: "Administrador", email: "admin@locadora.com", senhaHash, perfil: "ADMIN" }
  });

  for (const veiculo of veiculosIniciais) {
    await prisma.veiculo.upsert({
      where: { placa: veiculo.placa },
      update: {},
      create: veiculo
    });
  }

  console.log("Seed concluído: 1 admin e 3 veículos.");
}

semear()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
