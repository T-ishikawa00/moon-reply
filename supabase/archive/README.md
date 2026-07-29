# Supabase Migration Archive

`0001_stage3_data_foundation.sql` was never applied to `moon-reply-dev`.
It is preserved only as historical design evidence and is not an active
migration. It must not be copied into a live database.

The active initial runtime migrations are:

- `0002_m2_p3_runtime_vertical_slice.sql`;
- `0003_m2_p3_atomic_finalization.sql`.

Archiving `0001_stage3_data_foundation.sql` does not mark it as applied.
`supabase migration repair` was not used.
