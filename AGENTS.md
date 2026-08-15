# CalendarForge agent notes

## Publishing terminology

- In this repository, **publish**, **ship**, and **go live** mean deploy the application to the production droplet with `npm run deploy:droplet`.
- A direct user request to publish or deploy authorizes that production deployment after the intended changes are committed and verified.
- Do not reinterpret publishing as opening a GitHub pull request, and do not require `gh` unless the user explicitly asks for GitHub or PR work.
- For “commit and publish,” commit the intended work first so the versioned production image is reproducible, then run the droplet deployment pipeline and report its health checks.

## Deployment host

- Reach the current DigitalOcean WordPress droplet with `ssh calendarforge-droplet`.
- The SSH alias owns the hostname, user, and identity configuration; do not duplicate the raw IP in project commands or documentation.
- Treat the droplet as a production server. Default to read-only inspection unless the user authorizes a change.
- Deploy with `npm run deploy:droplet`; roll back with `npm run rollback:droplet`. Do not deploy by retagging a mutable `latest` image.
