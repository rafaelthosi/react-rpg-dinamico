# RPG Dinâmico

Aplicativo realizado para aprender React integrado com Node.js.

## Como funciona?

O aplicativo deve possuir dois perfis:
- [x] Game Master
- [x] Player

Se estiver na visão GM:
- [x] Deve conseguir criar Campanhas
- [x] Deve conseguir criar Players
- [x] Deve conseguir vincular Players em Campanhas
- [x] Deve conseguir criar grupos de informações que aparecerão para todos os Players

As Campanhas devem possuir:
- [x] Nome
- [x] Descrição
- [x] Senha de acesso
- [x] Lista de Players vinculados

Os grupos de informações devem possuir:
- [x] Nome
- [x] Descrição
- [x] Campos de diferentes tipos

Os campos devem permitir:
- [x] Texto
- [x] Número
- [x] Área de texto
- [x] Lista de opções
- [x] Caixa de seleção
- [x] Valor verdadeiro ou falso
- [x] Data
- [x] Definir se o campo é obrigatório
- [x] Definir quem pode editar o campo
- [x] Definir quem pode visualizar o campo

Se estiver na visão Player:
- [x] Deve conseguir entrar em uma campanha vinculada à sua conta
- [x] Deve conseguir criar personagens
- [x] Deve conseguir visualizar os grupos e campos permitidos
- [x] Deve conseguir preencher os campos que pode editar
- [x] Deve conseguir alterar o próprio personagem

## Começar

Na pasta `frontend`, instale as dependências e execute o projeto:

```bash
npm install
npm run dev
```

O Vite mostra no terminal o endereço local para abrir no navegador. Durante o
desenvolvimento, as requisições `/api` são encaminhadas para o backend em
`http://localhost:3000`.

Para gerar os arquivos de produção:

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`. Consulte
[`../backend/README.md`](../backend/README.md) para configurar e iniciar a API.

## Páginas

- `/login`: autenticação por perfil. O Jogador escolhe uma campanha vinculada
  e confirma a senha de acesso antes de abrir a ficha.
- `/home`: lista de campanhas do GM ou personagens do Jogador, de acordo com o
  perfil autenticado.
- `/campaigns/:campaignId`: administração da campanha pelo GM, incluindo
  informações da campanha, jogadores, personagens e estrutura da ficha.
- `/`: encaminha para `/login`.

## Organização

```text
src/
├── components/       # Componentes de ficha e administração
├── pages/            # Login, painel do jogador e páginas do GM
├── services/         # Autenticação e chamadas à API
├── styles/
│   └── global.css
├── App.jsx           # Rotas e sessão em memória
└── main.jsx          # Inicializa o React e o roteador
index.html            # Página HTML carregada pelo navegador
vite.config.js        # Configuração do Vite
```
