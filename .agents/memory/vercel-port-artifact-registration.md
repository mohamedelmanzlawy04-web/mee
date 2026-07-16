---
name: Vercel port artifact registration
description: When listArtifacts() returns empty despite artifact.toml files existing, the platform hasn't registered them — fix is to delete dir, createArtifact, then restore source files.
---

## The rule
When porting a Vercel app where `listArtifacts()` returns `[]` but `artifacts/<slug>/.replit-artifact/artifact.toml` already exists, the platform hasn't registered those artifacts. `WorkflowsRestart` will fail with "doesn't exist in config".

**Why:** The artifact registration is platform-side, not just a file on disk. `artifact.toml` existing doesn't mean the platform knows about it.

**How to apply:**
1. Back up the fully-ported source: `cp -r artifacts/<slug> /tmp/<slug>-backup`
2. Remove the directory: `rm -rf artifacts/<slug>`
3. Call `createArtifact({ artifactType, slug, previewPath, title })` — this registers with the platform AND creates workflows
4. Restore the ported source files over the fresh scaffold: `cp -r /tmp/<slug>-backup/src/* artifacts/<slug>/src/`
5. Fix any scaffold placeholder CSS/files (new scaffold has "red" placeholder vars)
6. Run `pnpm install` and typechecks before starting workflows
