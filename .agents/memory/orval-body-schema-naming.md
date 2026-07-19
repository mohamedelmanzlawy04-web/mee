---
name: Orval body schema naming vs component names
description: Orval derives body type names from operationId, not from the component schema name — renaming the component doesn't rename the generated type.
---

## Rule
When Orval generates a Zod body schema, it names it `<OperationIdPascal>Body` based on the `operationId` in the OpenAPI spec — NOT based on the `$ref` component schema name.

## Example
- OperationId: `requestUploadUrl`
- Component schema named: `UploadUrlRequest` (in spec)
- Generated type in `api.ts`: `RequestUploadUrlBody` (from operationId)
- What to import: `import { RequestUploadUrlBody } from '@workspace/api-zod'`

**Why:** The generated type name is derived from the operationId, so if you rename the component schema to avoid a conflict with `generated/types`, the `generated/api` export name stays the same. Always grep `lib/api-zod/src/generated/api.ts` for the actual export name before importing.

## How to apply
After any codegen run, grep `lib/api-zod/src/generated/api.ts` for the expected name before writing import statements in backend routes. Never assume the schema component name = the generated type name.
