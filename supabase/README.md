# Supabase layer

PostgreSQL schema, Row Level Security, storage buckets and realtime for
Neulens. Supabase provides the database, auth, storage and realtime channel;
the FastAPI service in `ai-service/` performs AI processing; the React client
talks to both with the signed-in user's access token.

## Apply the schema

```bash
# linked project
supabase link --project-ref <your-ref>
supabase db push

# or directly
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

The migration is idempotent (`create ... if not exists`, `drop policy if
exists`), so it can be re-applied safely in development.

## Tables

| Table | Rows are visible to |
| --- | --- |
| `profiles` | the account owner, assigned clinicians, institution admins |
| `institutions` | members of that institution |
| `care_relationships` | the clinician and patient in the pair |
| `assessments` + `eye/voice/face_metrics` | the patient, and clinicians with access |
| `baselines`, `change_detections` | same as assessments |
| `reports`, `documents` | same as assessments |
| `notifications` | the recipient only |
| `consent_records` | patient, assigned clinicians |

Writes follow the product rules: patients can create their own assessment and
consent rows, clinicians and institution admins can write reviews, reports,
documents, baselines and change detections for patients they can access. No
client can promote its own role.

## Two things worth knowing

1. **Roles are assigned server-side.** The sign-up trigger always creates a
   `PATIENT`. A trigger blocks the account owner from changing `role` or
   `status`; `promote_role(target, new_role)` is admin-only. Client-supplied
   metadata never grants clinical access.
2. **Storage paths are `<patient_uuid>/<filename>`.** The storage policies
   derive access from that folder. Objects are in private buckets, so the UI
   must request a signed URL instead of building a public link.

## Realtime

`notifications` is added to the `supabase_realtime` publication. Subscribe to
your own rows only:

```ts
supabase
  .channel('notifications')
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
      (payload) => onNotification(payload.new))
  .subscribe();
```

## Keys

* Browser: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public; RLS protects
  the data).
* Server only: `SUPABASE_SERVICE_ROLE_KEY`, JWT secret/JWKS, model API keys.
  These belong in the FastAPI environment and never in a `VITE_` variable.
