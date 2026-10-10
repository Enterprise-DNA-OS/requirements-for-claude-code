# Customise

Read CLAUDE.md and the current migration. Agree the requested field, status, rule or evidence change. Write a new migration under supabase/migrations; never edit an applied migration. Apply with npm run migrate to a backed-up local database first. Update the CLI validation, views and documents that consume it. Add a test of the changed business behavior and run npm test. Show the operator the changed record and migration. Shared database writes require the operator's instruction for that database. Never weaken evidence checks silently.
