@AGENTS.md

# Lint — regras que quebram CI

O CI roda `npm run lint` (ESLint). Erros bloqueiam o merge; warnings não.

## Regras que viram erro

### `@typescript-eslint/no-require-imports`
`require()` é proibido em qualquer arquivo `.ts/.tsx`. Use sempre `import`.

**Em testes com `jest.mock`:** o factory de `jest.mock()` é içado (hoisted) antes de `const`, então não dá pra declarar `const mockFn = jest.fn()` fora e referenciar dentro do factory. O padrão correto:

```ts
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
}));

describe("...", () => {
  const mockGet = jest.mocked(api.get); // referencia o mock com tipagem correta

  beforeEach(() => {
    mockGet.mockResolvedValue(data);
  });
});
```

**Nunca fazer:**
```ts
// ❌ require() no beforeEach
const { api } = require("@/lib/api");

// ❌ variável fora do mock referenciada dentro do factory (undefined em runtime)
const mockGet = jest.fn();
jest.mock("@/lib/api", () => ({ api: { get: mockGet } })); // mockGet é undefined aqui
```

## Scripts Node puros (`scripts/`)

Arquivos em `scripts/` são Node.js puro e usam `require()` legitimamente. Estão no `globalIgnores` do `eslint.config.mjs` — não adicionar imports ESM neles.

## Arquivo de config

`eslint.config.mjs` — flat config (ESLint 9+). Ignorados: `.next/`, `out/`, `build/`, `next-env.d.ts`, `scripts/`.
