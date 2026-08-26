# Layer Observations

- Unoptimized checksum: `a0e8bdd8a312de8e45d2cea454dee228ede781730bfc321d96a6fced1b634090` (`docker run --rm layer-lab:unoptimized`)
- Optimized checksum: `a0e8bdd8a312de8e45d2cea454dee228ede781730bfc321d96a6fced1b634090` (`docker run --rm layer-lab:optimized`) — identical to the unoptimized image.
- Unoptimized size in bytes: `10084890` (`docker image inspect layer-lab:unoptimized --format '{{.Size}}'`)
- Optimized size in bytes: `3790446` (`docker image inspect layer-lab:optimized --format '{{.Size}}'`)
- Size reduction in bytes: `6294444` (10084890 − 3790446), which exceeds the required 5,242,880-byte (5 MiB) minimum.
- Relevant history entries:
  - Unoptimized (`docker image history layer-lab:unoptimized`):
    ```
    CREATED BY                                      SIZE
    RUN rm -f /tmp/build-payload.bin                8.19kB
    RUN sha256sum /tmp/build-payload.bin | ...       8.19kB
    RUN cp /mnt/build-payload.bin /tmp/build-...     6.3MB
    ```
  - Optimized (`docker image history layer-lab:optimized`):
    ```
    CREATED BY                                                      SIZE
    RUN cp ... && sha256sum ... > /artifact.sha256 && rm -f ...     8.19kB
    ```

## Explanation

Each `RUN` instruction in `Dockerfile.unoptimized` commits a brand-new, immutable layer that is a diff against the layer before it. The `cp` step's layer records that `/tmp/build-payload.bin` was *added*, and that diff — all 6.3MB of the synthetic payload — is written to that layer permanently once the layer is committed. The later `RUN rm -f /tmp/build-payload.bin` step runs in a *new* layer built on top of the previous one; deleting a file that exists only in an earlier, already-committed layer cannot rewrite that earlier layer's contents. Instead, the union filesystem records a "whiteout" marker in the new layer that tells the runtime to hide the file when presenting the merged view. That is why `docker run` on the unoptimized image shows no `/tmp/build-payload.bin` (the merged, final filesystem correctly hides it) while `docker image history` still shows a 6.3MB layer (the underlying immutable layer storage still contains those bytes, unpacked and shipped with the image, transferred on every pull, and never reclaimed by that later `rm`). The `cp` layer in `docker image history layer-lab:unoptimized` is the one retaining the payload.

`Dockerfile.optimized` avoids the problem at its source rather than trying to clean up after it: the `cp`, `sha256sum`, and `rm -f` all run as one shell pipeline inside a single `RUN` instruction, so only *one* layer is ever committed, and that layer's diff is computed after the temporary file has already been removed from the build container's filesystem. The payload bytes exist transiently inside that one `RUN` step's writable container layer but are never captured in any committed image layer — there is no earlier layer for them to hide in, because creation and deletion happen before BuildKit takes the layer's diff. This is why the optimized image's single `RUN` layer is only 8.19kB (just `/artifact.sha256`) instead of 6.3MB, and why `docker image history` shows no residual payload layer at all.
