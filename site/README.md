# Site Build Notes

This directory is the deployable static site for `ccstudy`.

## Build

English only:

```bash
bash build.sh
```

English + Chinese:

```bash
bash build-all.sh
```

`build-all.sh` also validates source references, `source-index.json`, and local
site asset links used by the generated pages.

Narrow validation:

```bash
bash validate-source-links.sh
```

## Output

- `index.html`
- `zh/index.html`
- `source/claude-code-source/**` (synced from `../source/claude-code-source`)

## Source sync

`build.sh` runs `build-sync-source.sh` first, then assembles HTML.

Use this if you only want to refresh in-browser source assets:

```bash
bash build-sync-source.sh
```

## Runtime assumptions

- Relative asset paths only
- `.nojekyll` included
- Pure static HTML/CSS/JS
- In-browser source viewer can fetch under `./source/claude-code-source/...`
- Bilingual shell with shared runtime
- Story/Audit reading modes are client-side only
