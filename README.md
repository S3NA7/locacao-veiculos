# Sistema de Locação de Veículos

Projeto da disciplina **Programação com Frameworks Web**. Sistema completo de locação de veículos com API REST e interface web.

## Integrantes

- Arthur Sena
- _(adicione os demais integrantes)_

## Tecnologias

| Camada   | Tecnologias                                                        |
| -------- | ------------------------------------------------------------------ |
| Backend  | Node.js 22, Express 4, TypeScript, Prisma 5, MySQL 8, JWT, bcrypt, Zod |
| Frontend | React 19, TypeScript, Vite, React Router                           |
| Testes   | Vitest, Supertest                                                  |

## Funcionalidades

- Cadastro e login de usuários com autenticação JWT.
- Dois perfis: **ADMIN** (gerencia veículos) e **CLIENTE** (aluga e devolve). O primeiro usuário cadastrado vira ADMIN automaticamente.
- Cadastro, edição, exclusão e consulta de veículos, com filtro por disponibilidade.
- Registro de locações com data prevista de devolução.
- Devolução com cálculo automático do valor total (dias × diária, mínimo 1 dia).

## Estrutura do projeto

```
backend/              API Express + Prisma
  prisma/             schema, migrações e seed
  src/
    lib/              prisma, jwt, senha, erros
    middlewares/      autenticar, exigirAdmin, validar
    modules/          auth, usuarios, veiculos, locacoes
  tests/              testes de integração (vitest + supertest)
frontend/             React + Vite
  src/
    api/              chamadas HTTP e tipos
    contexto/         AuthContext (sessão)
    paginas/          Login, Cadastro, Veículos, FormularioVeiculo, Locacoes
    componentes/      Layout, RotaProtegida, DialogoAlugar
docs/
  requisicoes.http    exemplos de todas as rotas (REST Client / curl)
  diagramas.md        diagrama ER e diagrama de sequência
docker-compose.yml    MySQL 8 em container
```

## Pré-requisitos

- **Node.js 22** (mínimo 20.19; o Vite não roda em versões anteriores)
- **MySQL 8**, por uma das opções abaixo:
  - **Opção A:** Docker Desktop (recomendado, sobe com um comando)
  - **Opção B:** MySQL já instalado na máquina (XAMPP, WAMP, MySQL Installer etc.)

## Como rodar

### 1. Clonar o repositório

```bash
git clone https://github.com/S3NA7/locacao-veiculos.git
cd locacao-veiculos
```

### 2. Subir o banco de dados

**Opção A — Docker:**

```bash
docker compose up -d
```

Isso cria o banco `locadora` (e `locadora_test` para os testes) com usuário `root` e senha `root` na porta 3306.

**Opção B — MySQL já instalado:**

Crie o banco manualmente no seu MySQL:

```sql
CREATE DATABASE locadora;
```

### 3. Configurar e iniciar o backend

```bash
cd backend
npm install
```

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
copy .env.example .env
```

(No Linux/Mac: `cp .env.example .env`)

O arquivo `.env` tem este conteúdo. Se estiver usando a **Opção B**, troque `root:root` pelo usuário e senha do seu MySQL:

```
DATABASE_URL="mysql://root:root@127.0.0.1:3306/locadora"
JWT_SECRET="troque-este-segredo"
PORT=3333
```

Crie as tabelas e os dados iniciais:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Inicie a API:

```bash
npm run dev
```

A API fica em `http://localhost:3333`. Teste com `http://localhost:3333/saude`.

### 4. Iniciar o frontend

Em outro terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.

### Credenciais de demonstração (criadas pelo seed)

| Perfil | Email                | Senha      |
| ------ | -------------------- | ---------- |
| ADMIN  | admin@locadora.com   | admin123   |

Para testar como cliente, use a tela **Cadastre-se** e crie um usuário novo.

O seed também cadastra três veículos: Fiat Argo (ABC1D23), Volkswagen Polo (DEF4E56) e Toyota Corolla (GHI7F89).

## Rotas da API

Todas as rotas, exceto `/auth/*` e `/saude`, exigem o header `Authorization: Bearer <token>`.

| Método | Rota                      | Acesso  | Corpo / Descrição                                              |
| ------ | ------------------------- | ------- | -------------------------------------------------------------- |
| POST   | `/auth/registrar`         | público | `{ nome, email, senha }` → 201 com usuário e token             |
| POST   | `/auth/login`             | público | `{ email, senha }` → 200 com token e usuário                   |
| GET    | `/usuarios/eu`            | logado  | Dados do usuário autenticado                                   |
| GET    | `/veiculos`               | logado  | Lista veículos. Filtro opcional `?status=DISPONIVEL`           |
| GET    | `/veiculos/:id`           | logado  | Detalhe de um veículo                                          |
| POST   | `/veiculos`               | admin   | `{ placa, marca, modelo, ano, valorDiaria }` → 201             |
| PUT    | `/veiculos/:id`           | admin   | Mesmos campos, todos opcionais                                 |
| DELETE | `/veiculos/:id`           | admin   | 204. Recusa (409) se houver locação ativa                      |
| GET    | `/locacoes`               | logado  | Cliente vê as suas; admin vê todas                             |
| POST   | `/locacoes`               | logado  | `{ veiculoId, dataPrevista }` → 201. Veículo vira ALUGADO      |
| POST   | `/locacoes/:id/devolucao` | logado  | Registra devolução, calcula `valorTotal`, libera o veículo     |

Erros sempre retornam JSON no formato `{ "erro": "mensagem" }` com status 400, 401, 403, 404 ou 409.

Exemplos prontos de todas as rotas estão em [`docs/requisicoes.http`](docs/requisicoes.http).

## Regras de negócio

1. O primeiro usuário cadastrado é ADMIN; os demais são CLIENTE.
2. Só ADMIN cadastra, edita e exclui veículos.
3. Só é possível alugar veículo com status DISPONIVEL; ao alugar, vira ALUGADO.
4. A data prevista de devolução não pode ser anterior a hoje.
5. Na devolução, o valor total é `dias × valorDiaria`, com dias arredondados para cima e mínimo de 1. O veículo volta a DISPONIVEL.
6. Uma locação só pode ser devolvida pelo próprio cliente ou por um ADMIN, e apenas uma vez.

## Testes

Os testes de integração rodam contra o banco `locadora_test` (criado automaticamente pelo Docker). Com o MySQL no ar:

```bash
cd backend
npx dotenv -e .env.test -- prisma migrate deploy
npm test
```

## Diagramas

O diagrama entidade-relacionamento e o diagrama de sequência de locação/devolução estão em [`docs/diagramas.md`](docs/diagramas.md).
