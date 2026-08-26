# Build Context Observations

- Unfiltered context size: `2.10MB` (from `before-build.log`, step `[internal] load build context` → `transferring context: 2.10MB`), driven mainly by `local-only/context-noise.bin` (2,097,152 bytes).
- Filtered context size: `175B` (from `after-build.log`, step `[internal] load build context` → `transferring context: 175B`), after excluding `.git`, `.env`, `local-only/`, `*.log`, and `reports/` via `.dockerignore`.
- Runtime result before `.dockerignore`: `context-contains-local-only-data` (`docker run --rm context-lab:before`) — `app.sh` found `/app/local-only/context-noise.bin` inside the image.
- Runtime result after `.dockerignore`: `context-clean` (`docker run --rm context-lab:after`) — the file no longer exists in the image.

## Explanation

`.dockerignore` is applied before the build context is even sent to the builder: Docker reads it first (`[internal] load .dockerignore`) and strips matching paths out of the context that gets transferred (`[internal] load build context`), which is why the transferred size dropped from 2.10MB to 175B. But that filtering happens at the source, not at the `COPY` instruction — excluded files are never part of the context tarball the builder receives at all. So `COPY . .` has nothing to copy for `.git`, `.env`, `local-only/`, `*.log`, or `reports/`: those paths simply do not exist in the build context, the same way they wouldn't exist if they had been deleted from disk before running `docker build`. This is why `.dockerignore` is not just a transfer-speed optimization — it is the mechanism that determines which files `COPY`/`ADD` can even see, which is what let `app.sh` prove the local-only file is absent from the resulting image rather than merely faster to upload.
