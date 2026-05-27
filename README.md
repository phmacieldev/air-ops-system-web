# Air Ops System — ASD Frontend

Interface web de gestão interna da **Air Support Division (ASD)**, unidade aérea do LSPD em servidor FiveM GTA RP.

---

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Lucide React (ícones)

---

## Módulos

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/login` | Autenticação JWT | Público |
| `/dashboard` | Visão geral: atividade recente e top pilotos | Todos |
| `/pilots` | Roster completo da unidade | Todos |
| `/pilots/[id]` | Perfil: histórico de voos, score, rank, edição | Todos / LEAD+SUPERVISOR p/ editar |
| `/flights` | Protocolo de voo: registro e histórico com filtros | Todos |
| `/reports` | Relatórios de desempenho e score bar | Todos |
| `/documents` | Biblioteca: SOPs, manuais, protocolos | Todos |
| `/register` | Cadastro de novo membro | LEAD, SUPERVISOR |

---

## Variáveis de Ambiente

Crie `.env.local` na raiz (use `.env.example` como base):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Rodar Localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).  
O backend precisa estar rodando em `http://localhost:8080`.

---

## Build de Produção

```bash
npm run build
npm start
```

---

## Deploy — Vercel

1. Conecte o repositório no [Vercel](https://vercel.com)
2. Configure a variável de ambiente:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL do backend no Render (ex: `https://asd-api.onrender.com`) |

3. Deploy automático a cada push na branch `main`

> O Vercel detecta Next.js automaticamente — nenhuma configuração adicional necessária.
