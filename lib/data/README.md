# Stage 3 Data Access Boundary

Stage 3 creates the Supabase data foundation only.

It does not persist request form data yet.

Future stages may add server actions or API routes after explicit approval.

Rules:

- Do not wire `/request` to database persistence in Stage 3.
- Do not create public client-side table writes in Stage 3.
- Do not create API routes in Stage 3.
- Service role access must only be used server-side.
- Service role keys must never be exposed to browser code.
