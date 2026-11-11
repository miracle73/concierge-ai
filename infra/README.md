# Deploy ($0)

1. **Oracle VM** (Always Free, Ampere A1, Ubuntu): install Docker, clone repo, create `.env`
   (from `.env.example`, set `POSTGRES_PASSWORD` and `API_URL=<lambda url>`), then
   `docker compose -f infra/compose.oracle.yml up -d`.
   Open port 5432 in the VCN security list (strong password!).
2. **Lambda**: in `.env` set `DATABASE_URL=postgres://postgres:<pw>@<oracle-ip>:5432/concierge`,
   run `bash infra/deploy-lambda.sh`. Prints the API URL.
3. **Vercel**: import repo, root dir `web`, set `NEXT_PUBLIC_API_URL=<lambda url>`.

Note: Mock PMS is in-memory, so bookings reset on Lambda cold starts (fine for demo).
