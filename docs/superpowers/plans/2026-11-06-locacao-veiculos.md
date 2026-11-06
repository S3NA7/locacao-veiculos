# Sistema de Locação de Veículos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API Express + Prisma + MySQL com JWT e frontend React para cadastro de usuários, veículos, locações e devoluções.

**Architecture:** Monorepo com `backend/` (Express em camadas routes → controllers → services → Prisma, validação zod, middlewares de autenticação) e `frontend/` (Vite + React Router, contexto de auth, cliente fetch). MySQL 8 em Docker. Testes de integração do backend com vitest + supertest contra um banco `locadora_test` no mesmo container.

**Tech Stack:** Node 22, TypeScript, Express 4, Prisma 5, MySQL 8, jsonwebtoken, bcryptjs, zod, vitest, supertest, Vite, React 18, React Router 6.

**Spec:** `docs/superpowers/specs/2026-11-06-locacao-veiculos-design.md`

## Global Constraints

- Nenhum comentário em nenhum arquivo de código (`.ts`, `.tsx`, `.prisma`, `.css`). Nomes explicam o código.
- Textos de interface e mensagens de erro em português.
- Erros da API sempre `{ "erro": "mensagem" }` com 400, 401, 403, 404 ou 409.
- Token JWT expira em 8h; segredo vem de `JWT_SECRET` no `.env`.
- Primeiro usuário cadastrado vira ADMIN; os demais CLIENTE.
- Seed cria `admin@locadora.com` / `admin123` e três veículos.
- Rotas exatamente como no spec (`/auth/registrar`, `/auth/login`, `/usuarios/eu`, `/veiculos`, `/veiculos/:id`, `/locacoes`, `/locacoes/:id/devolucao`).

## Review Focus

1. Email já cadastrado → 409 com mensagem clara, não erro 500 do Prisma (teste na Task 2).
2. Placa duplicada no cadastro de veículo → 409 (teste na Task 3).
3. Alugar veículo já ALUGADO → 409; dois clientes alugando o mesmo veículo não podem ambos ter sucesso (teste na Task 4).
4. `dataPrevista` anterior a hoje ou inválida → 400 (teste na Task 4).
5. Token ausente, malformado ou expirado → 401, nunca 500 (teste na Task 2).

---

### Task 1: Infraestrutura do backend, banco e seed

**Files:**
- Create: `docker-compose.yml`, `docker/init.sql`, `.gitignore`
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/.env.test`, `backend/vitest.config.ts`
- Create: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`
- Create: `backend/src/lib/prisma.ts`, `backend/src/lib/erro-http.ts`, `backend/src/app.ts`, `backend/src/server.ts`
- Test: `backend/tests/setup.ts`, `backend/tests/saude.test.ts`

**Interfaces:**
- Produces: `prisma` (PrismaClient singleton) em `src/lib/prisma.ts`; `criarApp(): Express` em `src/app.ts`; `ErroHttp(status, mensagem)` em `src/lib/erro-http.ts`; `tests/setup.ts` exporta `limparBanco(): Promise<void>` que apaga Locacao, Veiculo, Usuario nessa ordem.
- Env: `DATABASE_URL`, `JWT_SECRET`, `PORT` (padrão 3333). Em teste, `DATABASE_URL` aponta para `locadora_test`.

- [ ] **Step 1: `docker-compose.yml`** com serviço `mysql` imagem `mysql:8`, `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=locadora`, porta `3306:3306`, volume nomeado, e `docker/init.sql` montado em `/docker-entrypoint-initdb.d/` com `CREATE DATABASE IF NOT EXISTS locadora_test;`.

- [ ] **Step 2: `backend/package.json`** com scripts `dev` (`tsx watch src/server.ts`), `build` (`tsc`), `start` (`node dist/server.js`), `test` (`dotenv -e .env.test -- vitest run`), `prisma:migrate` (`prisma migrate dev`), `prisma:seed` (`tsx prisma/seed.ts`), e `"prisma": { "seed": "tsx prisma/seed.ts" }`. Dependências: express, cors, @prisma/client, jsonwebtoken, bcryptjs, zod, dotenv. Dev: typescript, tsx, prisma, vitest, supertest, dotenv-cli, @types/*. `tsconfig.json` com `target ES2022`, `module NodeNext`, `strict`, `outDir dist`, `rootDir src`.

- [ ] **Step 3: `prisma/schema.prisma`** com enums `Perfil { ADMIN CLIENTE }`, `StatusVeiculo { DISPONIVEL ALUGADO }` e os modelos `Usuario`, `Veiculo`, `Locacao` exatamente com os campos do spec (`valorDiaria` e `valorTotal` como `Decimal @db.Decimal(10,2)`, `email` e `placa` `@unique`, `dataDevolucao` e `valorTotal` opcionais, `@@map` com nomes em minúsculo plural).

- [ ] **Step 4: Rodar `docker compose up -d` e `npx prisma migrate dev --name inicial`** (em `backend/`, com `.env` copiado de `.env.example`). Esperado: pasta `prisma/migrations/*_inicial` criada, sem erro.

- [ ] **Step 5: `src/lib/prisma.ts`** exporta `export const prisma = new PrismaClient()`.

- [ ] **Step 6: `src/app.ts`** com `criarApp()` que monta `cors()`, `express.json()`, rota `GET /saude` → `{ ok: true }`, e handler de erro final `(erro, req, res, next)` que responde `{ erro }` com o status de `erro.status ?? 500`. `src/server.ts` chama `criarApp().listen(PORT)`.

- [ ] **Step 7: Teste** `tests/saude.test.ts`: `GET /saude` retorna 200 e `{ ok: true }`. `tests/setup.ts` exporta `limparBanco()`. `.env.test` com `DATABASE_URL` do `locadora_test` e `JWT_SECRET=teste`.

- [ ] **Step 8: Rodar `npx dotenv -e .env.test -- prisma migrate deploy` e `npm test`.** Esperado: 1 teste passa.

- [ ] **Step 9: `prisma/seed.ts`** cria admin (`admin@locadora.com`, senha `admin123` com bcrypt custo 10, perfil ADMIN) e três veículos com placas `ABC1D23`, `DEF4E56`, `GHI7F89`, usando `upsert` por email/placa. Rodar `npm run prisma:seed`. Esperado: saída sem erro.

- [ ] **Step 10: Commit** `chore: infraestrutura do backend, prisma e seed`.

---

### Task 2: Autenticação e usuários

**Files:**
- Create: `backend/src/lib/jwt.ts`, `backend/src/lib/senha.ts`, `backend/src/types/express.d.ts`
- Create: `backend/src/middlewares/autenticar.ts`, `backend/src/middlewares/exigir-admin.ts`, `backend/src/middlewares/validar.ts`
- Create: `backend/src/modules/auth/auth.schemas.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`
- Create: `backend/src/modules/usuarios/usuarios.routes.ts`
- Modify: `backend/src/app.ts` (montar `/auth` e `/usuarios`)
- Test: `backend/tests/auth.test.ts`, `backend/tests/helpers.ts`

**Interfaces:**
- Produces: `gerarToken(payload: { sub: number; perfil: Perfil }): string` e `verificarToken(token: string): { sub: number; perfil: Perfil }` em `lib/jwt.ts`; `gerarHash(senha)`, `compararSenha(senha, hash)` em `lib/senha.ts`.
- `autenticar` lê `Authorization: Bearer <token>` e coloca `req.usuario = { id, perfil }` (tipo `UsuarioAutenticado` declarado em `types/express.d.ts` via `declare global namespace Express`). `exigirAdmin` responde 403 `{ erro: "Acesso restrito a administradores" }`.
- `validar(schema: ZodSchema)` middleware que faz `schema.parse(req.body)` e substitui `req.body`; erro vira 400 com a primeira mensagem do zod.
- `tests/helpers.ts`: `criarUsuario(app, { nome, email, senha }): Promise<{ token, id, perfil }>` e `criarAdmin(app)` (cadastra primeiro, portanto ADMIN).
- Respostas: `POST /auth/registrar` → 201 `{ id, nome, email, perfil, token }`; `POST /auth/login` → 200 `{ token, usuario: { id, nome, email, perfil } }`; `GET /usuarios/eu` → 200 `{ id, nome, email, perfil }`.

- [ ] **Step 1: Testes** em `tests/auth.test.ts` (com `beforeEach(limparBanco)`):
  - registrar primeiro usuário retorna 201 e `perfil === "ADMIN"`; segundo retorna `perfil === "CLIENTE"`.
  - registrar com email repetido → 409 `{ erro: "Email já cadastrado" }`.
  - registrar com senha menor que 6 caracteres → 400.
  - login correto → 200 com `token` string; senha errada → 401 `{ erro: "Credenciais inválidas" }`.
  - `GET /usuarios/eu` sem token → 401; com token `Bearer abc` → 401; com token válido → 200 e email correto.
  - token expirado (gerar com `jwt.sign(..., { expiresIn: -1 })`) → 401.

- [ ] **Step 2: Rodar `npm test`.** Esperado: falhas por rota 404.

- [ ] **Step 3: Implementar** `lib/senha.ts`, `lib/jwt.ts` (expiresIn `8h`), middlewares, `auth.schemas.ts` (`registrarSchema`: nome min 2, email, senha min 6; `loginSchema`), `auth.service.ts` com `registrar(dados)` (conta usuários: 0 → ADMIN) e `login(dados)`, controller e routes, e montagem em `app.ts`. Tratar `PrismaClientKnownRequestError` código `P2002` como 409 no service de registrar.

- [ ] **Step 4: Rodar `npm test`.** Esperado: todos passam.

- [ ] **Step 5: Commit** `feat: autenticação com JWT e perfis`.

---

### Task 3: Veículos

**Files:**
- Create: `backend/src/modules/veiculos/veiculos.schemas.ts`, `veiculos.service.ts`, `veiculos.controller.ts`, `veiculos.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/tests/veiculos.test.ts`

**Interfaces:**
- Produces: `veiculosService.listar(filtro: { status?: StatusVeiculo })`, `buscar(id)`, `criar(dados)`, `atualizar(id, dados)`, `remover(id)`. Veículo serializado com `valorDiaria` como number.
- Schema `veiculoSchema`: placa com regex `^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$`, marca e modelo (min 1), ano inteiro entre 1950 e ano atual + 1, valorDiaria number positivo. `atualizarVeiculoSchema = veiculoSchema.partial()`.
- Rotas montadas em `/veiculos`, todas atrás de `autenticar`; POST/PUT/DELETE também atrás de `exigirAdmin`.

- [ ] **Step 1: Testes** em `tests/veiculos.test.ts`:
  - cliente `POST /veiculos` → 403; admin → 201 com `status === "DISPONIVEL"`.
  - placa duplicada → 409 `{ erro: "Placa já cadastrada" }`.
  - placa `abc` → 400.
  - `GET /veiculos` lista todos; `GET /veiculos?status=DISPONIVEL` filtra.
  - `GET /veiculos/999` → 404 `{ erro: "Veículo não encontrado" }`.
  - `PUT` altera `valorDiaria`; `DELETE` remove e `GET` posterior → 404.
  - `DELETE` de veículo com locação ativa → 409 `{ erro: "Veículo possui locação ativa" }` (criar locação direto via `prisma.locacao.create` no teste).

- [ ] **Step 2: Rodar `npm test`.** Esperado: falhas.
- [ ] **Step 3: Implementar** módulo e montar em `app.ts`.
- [ ] **Step 4: Rodar `npm test`.** Esperado: passa.
- [ ] **Step 5: Commit** `feat: CRUD de veículos`.

---

### Task 4: Locações e devoluções

**Files:**
- Create: `backend/src/modules/locacoes/calcular-valor.ts`, `locacoes.schemas.ts`, `locacoes.service.ts`, `locacoes.controller.ts`, `locacoes.routes.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/tests/calcular-valor.test.ts`, `backend/tests/locacoes.test.ts`

**Interfaces:**
- Produces: `calcularDias(inicio: Date, fim: Date): number` (ceil de dias corridos, mínimo 1) e `calcularValorTotal(inicio, fim, valorDiaria: number): number` em `calcular-valor.ts`.
- `locacoesService.listar(usuario: UsuarioAutenticado)` (admin: todas; cliente: só as suas), `criar(usuario, { veiculoId, dataPrevista })`, `devolver(usuario, id)`.
- `criarLocacaoSchema`: `veiculoId` inteiro positivo, `dataPrevista` string ISO que vira Date e deve ser ≥ hoje (início do dia).
- Locação serializada inclui `veiculo` (`id, placa, marca, modelo`) e `usuario` (`id, nome, email`), `valorDiaria` e `valorTotal` como number ou null.
- `criar` roda em `prisma.$transaction` com `updateMany({ where: { id, status: DISPONIVEL }, data: { status: ALUGADO } })`; se `count === 0` lança 409 `"Veículo indisponível"`. Veículo inexistente → 404 `"Veículo não encontrado"`.
- `devolver`: 404 se não existe; 403 se cliente não é dono; 409 `"Locação já devolvida"` se `dataDevolucao` preenchida; senão grava `dataDevolucao = new Date()`, `valorTotal`, e veículo volta a DISPONIVEL, em transação.

- [ ] **Step 1: Teste unitário** `calcular-valor.test.ts`: mesma data → 1 dia; 2 dias e 1 hora → 3 dias; `calcularValorTotal` com 3 dias × 100 → 300.
- [ ] **Step 2: Rodar.** Esperado: falha por módulo ausente.
- [ ] **Step 3: Implementar `calcular-valor.ts`.** Rodar. Esperado: passa.
- [ ] **Step 4: Testes de integração** `locacoes.test.ts`:
  - cliente aluga veículo disponível → 201, veículo fica ALUGADO.
  - alugar veículo ALUGADO → 409 `"Veículo indisponível"`.
  - dois `POST /locacoes` simultâneos (`Promise.all`) para o mesmo veículo por dois clientes → exatamente um 201 e um 409.
  - `dataPrevista` ontem → 400; `dataPrevista: "abc"` → 400; `veiculoId` inexistente → 404.
  - cliente A não vê locação do cliente B em `GET /locacoes`; admin vê ambas.
  - cliente B devolvendo locação de A → 403; A devolvendo → 200 com `valorTotal` number e veículo DISPONIVEL; devolver de novo → 409.
- [ ] **Step 5: Rodar.** Esperado: falhas.
- [ ] **Step 6: Implementar** módulo e montar em `app.ts`.
- [ ] **Step 7: Rodar `npm test`.** Esperado: tudo passa.
- [ ] **Step 8: Commit** `feat: locações e devoluções`.

---

### Task 5: Frontend — base e autenticação

**Files:**
- Create: `frontend/` via `npm create vite@latest frontend -- --template react-ts`
- Create: `frontend/src/api/cliente.ts`, `frontend/src/api/auth.ts`, `frontend/src/api/tipos.ts`
- Create: `frontend/src/contexto/AuthContext.tsx`, `frontend/src/paginas/Login.tsx`, `frontend/src/paginas/Cadastro.tsx`, `frontend/src/componentes/Layout.tsx`, `frontend/src/componentes/RotaProtegida.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/.env.example` (`VITE_API_URL=http://localhost:3333`)

**Interfaces:**
- `tipos.ts`: `Perfil`, `Usuario`, `Veiculo`, `Locacao` espelhando as respostas da API.
- `cliente.ts`: `api<T>(caminho: string, opcoes?: { method?, body?, token? }): Promise<T>`; lança `Error` com a mensagem de `erro` da resposta quando status ≥ 400; em 401 dispara `window.dispatchEvent(new Event("sessao-expirada"))`.
- `AuthContext`: `{ usuario, token, entrar(email, senha), cadastrar(nome, email, senha), sair() }`, token e usuário em `localStorage` chave `locadora.sessao`. Ouve `sessao-expirada` e faz `sair()`.
- Rotas: `/login`, `/cadastro`, e `/` (redireciona para `/veiculos`), todas as demais dentro de `RotaProtegida` + `Layout` (cabeçalho com nome, perfil, links Veículos / Locações, botão Sair).

- [ ] **Step 1: Criar projeto Vite**, instalar `react-router-dom`, remover arquivos de exemplo (`App.css`, assets).
- [ ] **Step 2: Implementar** arquivos acima. Estilo em `index.css`: fonte do sistema, largura máx 960px, cartões com borda suave, botões com cor primária `#1d4ed8`, mensagens de erro em `#b91c1c`, tabela zebrada. Sem biblioteca de componentes.
- [ ] **Step 3: Verificar** com `npm run build` (sem erros de tipo) e, com backend rodando, abrir `npm run dev`, cadastrar e logar pelo navegador; recarregar mantém sessão; Sair limpa.
- [ ] **Step 4: Commit** `feat: frontend com login e cadastro`.

---

### Task 6: Frontend — veículos e alugar

**Files:**
- Create: `frontend/src/api/veiculos.ts`, `frontend/src/api/locacoes.ts`
- Create: `frontend/src/paginas/Veiculos.tsx`, `frontend/src/paginas/FormularioVeiculo.tsx`, `frontend/src/componentes/DialogoAlugar.tsx`
- Modify: `frontend/src/App.tsx` (rotas `/veiculos`, `/veiculos/novo`, `/veiculos/:id/editar`)

**Interfaces:**
- `veiculos.ts`: `listarVeiculos(token, status?)`, `buscarVeiculo(token, id)`, `criarVeiculo(token, dados)`, `atualizarVeiculo(token, id, dados)`, `removerVeiculo(token, id)`.
- `locacoes.ts`: `listarLocacoes(token)`, `criarLocacao(token, { veiculoId, dataPrevista })`, `devolverLocacao(token, id)`.
- `Veiculos.tsx`: tabela (placa, marca/modelo, ano, diária formatada em BRL, status com cor), checkbox "Só disponíveis". Cliente vê botão "Alugar" nos DISPONIVEL; admin vê "Novo veículo", "Editar", "Excluir" (com `confirm`). "Alugar" abre `DialogoAlugar` (input `type="date"` com `min` hoje, confirma e navega para `/locacoes`).
- `FormularioVeiculo.tsx`: usado para criar e editar; placa com `toUpperCase()`; mostra `erro` da API.

- [ ] **Step 1: Implementar** arquivos e rotas.
- [ ] **Step 2: Verificar** `npm run build` e no navegador: admin cria, edita e exclui veículo; cliente aluga e é levado a `/locacoes`; erro de placa duplicada aparece no formulário.
- [ ] **Step 3: Commit** `feat: telas de veículos e locação`.

---

### Task 7: Frontend — locações e devolução

**Files:**
- Create: `frontend/src/paginas/Locacoes.tsx`, `frontend/src/lib/formatar.ts`
- Modify: `frontend/src/App.tsx` (rota `/locacoes`)

**Interfaces:**
- `formatar.ts`: `formatarMoeda(valor: number): string` (BRL) e `formatarData(iso: string): string` (`dd/mm/aaaa`).
- `Locacoes.tsx`: tabela com veículo, cliente (coluna só para admin), início, prevista, devolução (ou "Em andamento"), diária, total, botão "Devolver" nas abertas. Após devolver, recarrega a lista e mostra o total em uma mensagem de sucesso.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** no navegador: cliente devolve e vê total; admin vê locações de todos; devolver duas vezes não é possível (botão some).
- [ ] **Step 3: Commit** `feat: tela de locações e devolução`.

---

### Task 8: Documentação de entrega

**Files:**
- Create: `README.md`, `docs/requisicoes.http`, `docs/diagramas.md`

- [ ] **Step 1: `README.md`** com: título e descrição, integrantes (placeholder), tecnologias, estrutura de pastas, pré-requisitos (Node 22, Docker), passo a passo (`docker compose up -d`, `.env`, `npm install`, `prisma migrate deploy`, `prisma:seed`, `npm run dev` nos dois lados), credenciais do seed, tabela de rotas com método, caminho, acesso e corpo, regras de negócio em 5 linhas, como rodar os testes.
- [ ] **Step 2: `docs/requisicoes.http`** com variáveis `@base` e `@token`, uma requisição por rota na ordem da demonstração, e um bloco equivalente em `curl` ao final.
- [ ] **Step 3: `docs/diagramas.md`** com diagrama ER em Mermaid (`erDiagram`) e diagrama de sequência da locação + devolução, cada um seguido de instruções de como desenhar à mão.
- [ ] **Step 4: Verificar** seguindo o README do zero em uma pasta limpa (clonar, rodar). Esperado: sistema sobe e login do seed funciona.
- [ ] **Step 5: Commit** `docs: README, exemplos de requisições e diagramas`.

---

### Task 9: Publicação no GitHub

- [ ] **Step 1:** Buscar `//` e `/*` em `backend/src`, `frontend/src`, `backend/prisma` e `backend/tests`; só podem sobrar ocorrências dentro de URLs (`http://`). Remover qualquer comentário encontrado.
- [ ] **Step 2:** `gh repo create locacao-veiculos --public --source=. --remote=origin --push`.
- [ ] **Step 3:** Confirmar `gh repo view --web` abre com README renderizado.
