---
name: Orval zod/v4 codegen fix
description: orval 8.21 generates Zod v4 API (z.email, z.looseObject) but workspace catalog has zod ^3.25.76; fixed by patching import in codegen script
---

# Orval v8.21 generates Zod v4 API

## The rule
After running orval codegen, the generated `lib/api-zod/src/generated/api.ts` must have its `from 'zod'` import replaced with `from 'zod/v4'`.

**Why:** orval 8.21 outputs Zod v4 method calls (`zod.email()`, `zod.looseObject()`) but the workspace catalog pins `zod: ^3.25.76` (v3). Zod v3.25+ ships a `zod/v4` subpath export that exposes the v4 API, so changing the import path resolves the mismatch without upgrading the whole package.

**How to apply:** The fix is already baked into `lib/api-spec/package.json` codegen script:
```
"codegen": "orval --config ./orval.config.ts && sed -i \"s|from 'zod'|from 'zod/v4'|g\" ../../lib/api-zod/src/generated/api.ts && pnpm -w run typecheck:libs"
```
This runs automatically. If you regenerate manually with `orval` directly (not via the script), you must apply the sed patch before typechecking.
