# Aurora GPUI Provenance

Aurora GPUI uses Zed and its GPUI framework as upstream sources and behavioral
references. Every component adapted from upstream code must add a TOML record to
this directory before it is merged.

Required fields are:

- `component`: Aurora's public component name.
- `upstream_repository`: the canonical upstream repository.
- `upstream_revision`: the exact source commit.
- `upstream_paths`: every upstream source path used.
- `upstream_license`: the license governing the upstream source.
- `strategy`: `dependency`, `adapted`, or `behavioral-reference`.
- `notes`: a concise description of what was retained or reimplemented.

The GPUI framework is consumed as an Apache-2.0 dependency. Zed application UI
code is GPL-3.0-or-later. Adapted code must retain its copyright and license
notices; Aurora's AGPL license does not erase upstream provenance.
