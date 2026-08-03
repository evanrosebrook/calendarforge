# CalendarForge agent notes

## Deployment host

- Reach the current DigitalOcean WordPress droplet with `ssh calendarforge-droplet`.
- The SSH alias owns the hostname, user, and identity configuration; do not duplicate the raw IP in project commands or documentation.
- Treat the droplet as a production server. Default to read-only inspection unless the user authorizes a change.
- Deploy with `npm run deploy:droplet`; roll back with `npm run rollback:droplet`. Do not deploy by retagging a mutable `latest` image.
