# Load Balancing & Resilience Lab starter

This directory contains the local application used in the load-balancing lab.
The application is intentionally small so you can focus on traffic distribution,
failure detection, and recovery rather than application development.

## Included assets

- `src/`: Express application and unit/integration tests
- `db/`: PostgreSQL schema and deterministic seed scripts
- `docker-compose.yml`: working baseline with one API instance and PostgreSQL
- `nginx/nginx.conf`: Nginx skeleton to complete when you add the load balancer
- `Dockerfile`: tested application image build
- `package.json` and `package-lock.json`: locked Node.js dependencies

The baseline Compose file is ready to run. During the project, you will replace
the single `app` service with three named instances and add Nginx as the only
host-facing entry point.

## Working rules

- Perform every project task from this directory.
- Do not modify the supplied application, SQL scripts, or Dockerfile.
- Modify only `docker-compose.yml` and `nginx/nginx.conf` as instructed.
- Use only fictitious local-development credentials.
- Keep `.env` local. `.gitignore` already excludes it while allowing a safe
  `.env.example`.

The project statement provides the required behavior and the self-validation
sequence.
