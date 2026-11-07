# Changelog

## 0.1.4

### Fixed

- Logging out now revokes the refresh token instead of issuing a new one
- Missing React `key` on the timesheet rows

## 0.1.3

- JWT authentication with rotating, hashed refresh tokens
- Register, login, refresh and revoke endpoints with validation and rate limiting
- Clock in and clock out, with a list of recent time entries
- React front end with protected routes
