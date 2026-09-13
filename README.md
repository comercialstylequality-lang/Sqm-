# SQM Admin — Painel separado

Painel administrativo separado da loja pública.

## Login

O painel usa **Login com Google**. Não existe senha administrativa no HTML.

Configure no Vercel do projeto Admin:

- `GOOGLE_CLIENT_ID` — Client ID OAuth do Google.
- `ADMIN_GOOGLE_EMAIL` — único e-mail Google autorizado a acessar o painel.
- `ADMIN_SESSION_SECRET` — segredo longo e aleatório para assinar o cookie de sessão.

O servidor valida a credencial recebida do Google, confere o `aud`, o e-mail verificado e bloqueia qualquer conta diferente de `ADMIN_GOOGLE_EMAIL`. Depois cria uma sessão `HttpOnly` própria para o painel.

## Dados

O Admin e a Loja devem usar as mesmas variáveis do Upstash Redis para compartilhar produtos, pedidos e conteúdo.


## Correção de compatibilidade Vercel
As Functions da pasta `api/` usam agora entradas `.mjs` com `export default`, mantendo as bibliotecas legadas em CommonJS. Isso evita o problema de roteamento/empacotamento que estava causando `404: NOT_FOUND`.

Teste após o deploy: `/api/health` deve retornar JSON com `success: true`.
