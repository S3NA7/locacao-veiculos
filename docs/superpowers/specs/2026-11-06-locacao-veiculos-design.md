# Sistema de Locação de Veículos — Design

Data: 2026-11-06

## Intenção

Projeto da disciplina Programação com Frameworks Web. Um sistema completo de locação de veículos com API REST (Node.js, Express, TypeScript, Prisma, MySQL, JWT) e interface web em React. Será entregue como repositório no GitHub com README e apresentado em sala com demonstração do sistema e execução das rotas da API.

## Objetivos

- Cadastro e login de usuários com JWT.
- Cadastro, edição e consulta de veículos.
- Registro de locações e devoluções com cálculo de valor.
- Interface React que exercita todas as rotas.
- README que permita a qualquer pessoa rodar o projeto do zero.
- Código limpo o bastante para cada rota ser explicada em uma pergunta oral.

## Não-objetivos

- Pagamento, multas, manutenção de frota, relatórios.
- Deploy em nuvem.
- Recuperação de senha, e-mail, upload de imagens.

## Anti-objetivos

- Comentários no código: proibidos pela disciplina. Nomes de funções e arquivos devem explicar o código sozinhos.
- Dependências que escondam o Express ou o Prisma (NestJS, ORMs extras).

## Restrições

- Máquina de desenvolvimento: Windows 11, Node 22, Git, Docker Desktop (MySQL roda em container), sem MySQL nativo.
- Stack obrigatória: Node.js, Express, TypeScript, Prisma, MySQL, JWT, React.

## Decisões de construção

### Estrutura do repositório

```
/backend    Express + Prisma + JWT (TypeScript)
/frontend   React + Vite (TypeScript)
/docs       design, diagramas de apoio, exemplos de requisições
docker-compose.yml   MySQL 8
README.md
```

### Modelo de dados (Prisma)

- **Usuario**: id, nome, email (único), senhaHash, perfil (ADMIN | CLIENTE), criadoEm.
- **Veiculo**: id, placa (única), marca, modelo, ano, valorDiaria (Decimal), status (DISPONIVEL | ALUGADO), criadoEm.
- **Locacao**: id, usuarioId, veiculoId, dataInicio, dataPrevista, dataDevolucao (nulo até devolver), valorDiaria (copiado do veículo no momento da locação), valorTotal (nulo até devolver), criadoEm.

Relações: Usuario 1-N Locacao; Veiculo 1-N Locacao.

### Regras de negócio

- Cadastro cria CLIENTE por padrão. O primeiro usuário cadastrado vira ADMIN para facilitar a demonstração. Admin também pode ser criado por seed.
- Só ADMIN cria e edita veículos. Qualquer usuário logado consulta.
- Só é possível alugar veículo DISPONIVEL; ao alugar, o status vira ALUGADO.
- Devolução só pelo dono da locação ou por ADMIN. Registra dataDevolucao = agora, calcula dias = máx(1, dias corridos entre início e devolução, arredondado para cima), valorTotal = dias × valorDiaria, e volta o veículo para DISPONIVEL.
- Locação já devolvida não pode ser devolvida de novo.

### Rotas da API

```
POST /auth/registrar          nome, email, senha
POST /auth/login              email, senha -> token
GET  /usuarios/eu             (auth) dados do usuário logado

GET  /veiculos                (auth) ?status=DISPONIVEL opcional
GET  /veiculos/:id            (auth)
POST /veiculos                (admin)
PUT  /veiculos/:id            (admin)
DELETE /veiculos/:id          (admin, só se nunca alugado ou sem locação ativa)

GET  /locacoes                (auth) cliente vê as suas, admin vê todas
POST /locacoes                (auth) veiculoId, dataPrevista
POST /locacoes/:id/devolucao  (auth)
```

Erros em JSON `{ "erro": "mensagem" }` com códigos 400, 401, 403, 404, 409.

### Backend

- Express com `express.json()` e `cors`.
- Camadas: `routes` → `controllers` → `services` → Prisma. Middlewares `autenticar` e `exigirAdmin`.
- Validação de entrada com `zod`.
- Senha com `bcryptjs`. Token com `jsonwebtoken`, expiração 8h, segredo em `.env`.
- Scripts: `dev` (tsx watch), `build`, `start`, `prisma:migrate`, `prisma:seed`.
- Seed cria um admin (admin@locadora.com / admin123) e três veículos.

### Frontend

- Vite + React + TypeScript + React Router. Estilo próprio com CSS simples, sem biblioteca de componentes.
- Token guardado em `localStorage`; contexto de autenticação; cliente HTTP com `fetch` que injeta o header Authorization.
- Telas: Login, Cadastro, Veículos (lista com filtro de disponíveis; admin vê botões novo/editar/excluir), Formulário de Veículo, Minhas Locações (ou todas, se admin) com botão Devolver, e modal/ação Alugar na lista de veículos.

### Entrega

- README: descrição, tecnologias, pré-requisitos, como subir o MySQL com Docker, configurar `.env`, migrar, rodar seed, rodar backend e frontend, tabela de rotas, credenciais de demonstração.
- `docs/requisicoes.http`: exemplos de todas as rotas para a demonstração (compatível com extensão REST Client do VS Code) e equivalentes em `curl`.
- `docs/diagramas.md`: modelo entidade-relacionamento e diagrama de sequência de locação/devolução em texto (Mermaid), para servir de base aos diagramas manuscritos.

## Fica a cargo do construtor

- Organização interna de pastas dentro de `src`.
- Mensagens exatas de erro e textos da interface (em português).
- Paleta e layout do frontend, desde que limpo e legível em projetor.
