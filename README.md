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
| `/dashboard` | Stats, atividade recente e ranking de pilotos | Todos |
| `/pilots` | Roster em cards: foto, callsign, rank, score, status | Todos |
| `/pilots/[id]` | Perfil: histórico de voos, score, rank, edição | Todos / LEAD+SUPERVISOR p/ editar |
| `/flights` | Protocolos de voo — criar, editar (PENDING), aprovar | Todos / LEAD p/ aprovar |
| `/reports` | Relatórios de desempenho — criar, editar (PENDING), aprovar | Todos / LEAD+SUPERVISOR p/ aprovar |
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

---

## Keepalive (Render Free Tier)

O backend no Render Free hiberna após 15 min sem requisições. Duas estratégias estão ativas:

- **Client-side**: enquanto o usuário está logado, o frontend faz ping em `/me` a cada 4 minutos.
- **Server-side**: `vercel.json` configura um cron em `/api/keepalive` a cada 5 minutos (**requer Vercel Pro**).

Para o plano Hobby do Vercel, use [cron-job.org](https://cron-job.org) apontando `GET https://seu-app.vercel.app/api/keepalive` a cada 5 minutos.

---

## Hierarquia de Ranks

| Rank | Nível | Score |
|---|---|---|
| LEAD | 10 | Não rastreado |
| SUPERVISOR | 6 | Não rastreado |
| INSTRUCTOR | 5 | Não rastreado |
| PILOT_SENIOR | 4 | 1000+ pts |
| PILOT_PLENO | 3 | 600–999 pts |
| PILOT_STANDARD | 2 | 200–599 pts |
| TRAINEE | 1 | 0–199 pts |

**Fórmula de score:** `apreensões×5 + perseguições×3 + operações×3 − acidentes×5`

Ranks com nível ≥ 5 (INSTRUCTOR, SUPERVISOR, LEAD) são imunes à promoção/rebaixamento automático e não acumulam score.
