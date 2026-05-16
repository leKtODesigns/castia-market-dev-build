# Asset Licenses and Provenance

The MIT license in `LICENSE` applies to original site code only. Third-party assets are excluded from that code license and remain subject to their own ownership, licenses, permissions, or usage rules.

## Current policy

- Local item images remain hosted in this repository for reliability and auditability.
- New copied assets should not be added unless their provenance is recorded at import time.
- Minecraft Wiki-derived files must be reviewed file by file; do not assume every wiki-hosted file has the same license status.
- Castia-related server-specific assets remain tracked separately from Mojang assets; use the stated source license where clear, and otherwise keep a conservative review status until permission or reuse basis is confirmed.
- Sitewide footer terms are useful evidence, but file-level license notes or rights-holder statements should take precedence when they are available.
- Crafty avatar renders are external service responses, not bundled local assets.

## Asset manifest

`assets/asset-manifest.csv` is the source-of-truth inventory for local item images.

Required columns:

| Column | Meaning |
| --- | --- |
| `local_path` | Repository path of the local asset |
| `source_type` | Provenance bucket such as `minecraft-wiki`, `castiamc-origin`, `self-made`, or `pending-review` |
| `original_source_url` | Original source or file page URL |
| `author_or_uploader` | Original author/uploader if known |
| `license_or_permission_basis` | License name, ownership basis, or permission reference |
| `modified` | Whether the local copy was modified |
| `review_status` | `pending`, `cleared`, `replace`, or another explicit review result |

The manifest is a living review record. Source recovery and legal clearance are separate steps: a row can have a known source URL while still needing a final reuse-basis review.

## Future additions

Prefer:

1. Self-made artwork.
2. Files with clear compatible licensing.
3. Assets used with explicit written permission.

If the project is ever monetized, re-review the full asset library first and treat any `NC`-licensed or permission-pending dependency as a blocker until resolved.
