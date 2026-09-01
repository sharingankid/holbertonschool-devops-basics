# TaskFlow API starter

This directory contains the application used by **Docker Compose Foundations**.
The application is intentionally small so the project can focus on service
orchestration rather than application development.

## Included assets

- `src/`: Express application and unit/integration tests
- `db/`: PostgreSQL schema and deterministic seed scripts
- `nginx/default.conf`: completed single-upstream proxy configuration
- `Dockerfile`: tested application image build
- `package.json` and `package-lock.json`: locked Node.js dependencies

No Compose file is supplied. Creating and evolving `docker-compose.yml` is the
learner's work.

## Working rules

- Perform every project task from this directory.
- Do not modify the supplied application, SQL scripts, Dockerfile, or Nginx
  configuration.
- Use only fictitious local-development credentials.
- Keep `.env` local. `.gitignore` already excludes it while allowing a safe
  `.env.example`.

The project statement provides the commands, required behavior, and
self-validation sequence.
