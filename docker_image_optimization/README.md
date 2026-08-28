# docker_image_optimization

Seven hands-on labs on shrinking, securing, and speeding up Docker builds. Each lab pairs a baseline (unoptimized) Dockerfile with an optimized one on a small real app (Python, Node, or Go), plus a written `*-observations.md` or `decision.md` measuring the actual before/after difference — image size, layer count, cache hits, or runtime behavior. Together they cover build-context control, layer caching, multi-stage builds, base image selection, and non-root runtime users.

## Labs

| Lab | What it tests |
|---|---|
| `labs/measure-before-optimizing/` | Baselines an unoptimized Python image with `docker image history`/`inspect` to find the real size and security offenders before changing anything. |
| `labs/select-compatible-base/` | Compares Alpine, Debian slim, and Ubuntu as base images and picks the smallest one that still meets stated runtime requirements. |
| `labs/control-build-context/` | Uses `.dockerignore` to strip local-only files out of the build context before Docker ever sees them. *(tracked as its own separate git repository)* |
| `labs/preserve-dependency-cache/` | Orders Dockerfile instructions so an app-source edit doesn't bust the cached dependency-install layer. |
| `labs/remove-layer-bloat/` | Shows how collapsing create/delete steps into a single `RUN` keeps a deleted file's bytes out of the final image entirely. |
| `labs/separate-build-runtime/` | Multi-stage build that compiles a Go binary in one stage and ships only the binary in a minimal final stage. |
| `labs/optimize-inventory-api/` | Applies every optimization above to a small Go inventory API, verified end-to-end. *(tracked as its own separate git repository)* |

📚 See the root [CHEATSHEET.md](../CHEATSHEET.md) for the concepts used here.
