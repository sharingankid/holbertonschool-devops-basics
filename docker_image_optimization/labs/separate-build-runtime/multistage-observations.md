# Multi-Stage Observations

- Single-stage output: `{"service":"greeter","status":"ok"}`
- Multi-stage output: `{"service":"greeter","status":"ok"}`
- Single-stage size in bytes: `79054831` (~79 MB)
- Multi-stage size in bytes: `1355385` (~1.3 MB)
- Configured runtime user: `65532:65532`
- `/bin/sh` override result: fails with `exec: "/bin/sh": stat /bin/sh: no such file or directory` (exit code 127)

## Explanation

The single-stage image ships the full `golang:1.25-alpine` toolchain, the module cache, and the source
tree alongside the compiled binary, which is why it weighs in at roughly 79 MB. The multi-stage build
compiles and tests the program in a throwaway `build` stage, then copies only the statically linked
binary (`CGO_ENABLED=0`) into a `scratch` final stage. `scratch` has no base OS, no package manager, no
shell, and no libc, so the final image only contains the ~1.3 MB binary — a ~98% size reduction that also
shrinks the attack surface, since there are no extra tools an attacker could use if they gained access to
the container.

The failed `/bin/sh` override is expected, not a bug: `scratch` never had a shell installed in the first
place, so there is nothing at `/bin/sh` to execute, and Docker correctly reports the missing binary. This
is actually a security property of the image — without a shell, package manager, or coreutils, an attacker
who compromises the running process has no built-in tooling to pivot with, and the container can only ever
run the single binary declared in `ENTRYPOINT`.

This does not replace functional testing of the application binary, however. The absence of a shell only
proves that no shell is present; it says nothing about whether `greeter` itself behaves correctly. That is
why the build stage still runs `go test ./...` before compiling, and why `docker run --rm
multistage-lab:optimized` is checked separately to confirm the binary starts and prints the expected
`{"service":"greeter","status":"ok"}` JSON output. Testing the program's behavior and verifying the
runtime image has no shell are two independent checks, and both are required to trust the final image.
