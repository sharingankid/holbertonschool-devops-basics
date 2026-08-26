# Cache Observations

- Unoptimized source-only rebuild result: after editing only a comment in `src/server.js` and rebuilding `Dockerfile.unoptimized`, the `RUN npm ci --omit=dev && node -e "setTimeout(() => {}, 3000)"` step did **not** report `CACHED` — it re-ran the full install (`added 1 package, and audited 3 packages in 603ms`) and took the full ~4.1s again, instead of returning instantly.
- Cached Dockerfile first build result: building `Dockerfile.cached` the first time ran every step fresh, including `[5/7] RUN npm ci --omit=dev && node -e "setTimeout(() => {}, 3000)"` (`added 1 package, and audited 3 packages in 650ms`, ~4.1s total) — expected, since no cache exists yet for this new Dockerfile.
- Cached Dockerfile source-only rebuild result: after editing only a comment in `src/server.js` again and rebuilding `Dockerfile.cached` (no `--no-cache`), the log shows:
  ```
  #8 [4/7] COPY packages/message-format/ packages/message-format/
  #8 CACHED
  #9 [2/7] WORKDIR /app
  #9 CACHED
  #10 [3/7] COPY package.json package-lock.json ./
  #10 CACHED
  #11 [5/7] RUN npm ci --omit=dev && node -e "setTimeout(() => {}, 3000)"
  #11 CACHED
  #12 [6/7] COPY src/ src/
  #12 DONE 0.0s
  #13 [7/7] COPY test/ test/
  #13 DONE 0.0s
  ```
  `RUN npm ci --omit=dev` reports `CACHED` and completes instantly, while `COPY src/ src/` and `COPY test/ test/` re-run because their content changed.

- Why the dependency layer remained cached: BuildKit invalidates a layer only when the layer's own instruction or the inputs it copies change. In `Dockerfile.cached`, the `RUN npm ci --omit=dev` step's cache key depends only on the preceding layers: `package.json`, `package-lock.json`, and `packages/message-format/`. Editing a comment in `src/server.js` does not touch any of those paths, so BuildKit reuses the exact same cached layer for `npm ci` and skips re-running it. Application source is only copied in later `COPY src/ src/` / `COPY test/ test/` steps, positioned *after* the dependency install, so a source change can only invalidate those trailing layers, never the expensive dependency step before them.
- Change that would invalidate the dependency layer: editing `package.json`, `package-lock.json`, or any file under `packages/message-format/` (e.g. bumping a version in `packages/message-format/package.json`, or adding a dependency to `package.json`) would change the input to `RUN npm ci --omit=dev`, forcing that layer — and every layer after it — to rebuild.

## Runtime Validation

`cache-lab:cached` was run on an isolated `cache-lab-net` network and queried via a temporary `busybox:1.37` container. The exact response was received:

```
{"service":"cache-lab","status":"ok"}
```

The container and network were removed after validation.
