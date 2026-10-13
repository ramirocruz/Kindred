# Architecture documentation

- `index.html`: detailed HLD/LLD guide; expand component contracts.
- `hld.html`: Archify system-level diagram, runtime source `690b645`.
- `lld.html`: Archify module-level diagram, same source snapshot.
- `overview.html`: preserved previous compact diagram, source `b3e9e8b`.

HLD and LLD pass source-aware showcase validation, delivery, strict artifact checks and automated browser checks. HLD uses the single layout-review revision from `review-2`; LLD uses its first passing artifact. Source candidates are in `.archify/architecture-kindred-{hld,lld}-20261013-155600/`. Local machine receipts are deliberately not published.

Generated diagram HTML is copied unchanged; do not hand-edit it. Edit its candidate, rerun Archify, then copy the passing artifact here. Maintain the human-written guide when runtime responsibilities change. `scripts/prepare-pages.mjs` publishes only the four named HTML files; tracked Context is public repository documentation but excluded from the Pages artifact.

Diagram automation does not certify real media quality or a security audit. The guide explicitly identifies pending verification/features. Runtime source links are pinned; current documentation-publishing mechanics are defined by the workflow and packaging script in the current checkout.
