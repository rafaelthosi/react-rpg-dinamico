# Meu projeto React

Uma estrutura inicial simples usando React, Vite e React Router.

## Começar

```bash
npm install
npm run dev
```

O Vite mostra no terminal o endereço local para abrir no navegador. Para gerar
os arquivos de produção, use `npm run build`.

## Páginas e login

- `/login`: formulário de entrada.
- `/home`: página inicial, acessível depois de enviar um formulário válido.
- `/`: encaminha para `/login`.

O formulário verifica campos obrigatórios, o formato do e-mail e o tamanho
mínimo da senha usando validação do navegador. **Isso não autentica usuários**:
o projeto ainda não tem backend. A sessão de demonstração fica apenas na memória
e é perdida ao atualizar a página. Para autenticação real, conecte o formulário
a um serviço de backend.

## Organização

```text
src/
├── components/       # Componentes que podem ser reutilizados
│   ├── Header.jsx
│   ├── ProfileSelector.jsx
├── pages/            # Páginas acessadas pelas rotas
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
├── styles/           # Estilos da aplicação em um único arquivo
│   └── global.css
├── App.jsx           # Rotas e estado temporário de acesso
└── main.jsx          # Inicializa o React e o roteador
index.html            # Página HTML carregada pelo navegador
vite.config.js        # Configuração do Vite
```
