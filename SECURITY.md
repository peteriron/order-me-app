# Security policy

OrderMe is a static, offline web app: no server, no accounts, no analytics, and everything the Operator enters stays on the phone. The full threat model and the controls in place are in [docs/security.md](docs/security.md).

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. That starts a private discussion with the maintainers.

Do not open a public issue for a vulnerability.

Please include what you did, what happened, and what you expected. A minimal reproduction (a share link, a saved-state snippet, a browser and version) helps a lot.

## What is in scope

- The app's own code: link handling, saved-state handling, the Content-Security-Policy, the service worker and the update flow.
- The GitHub Actions workflows in `.github/workflows/`.

## What is not

- The GitHub Pages hosting platform itself.
- Social engineering or physical access to an unlocked phone.
- The accepted limitations listed in [docs/security.md](docs/security.md) (for example, a `<meta>` policy cannot set `frame-ancestors`).

There is no bug bounty.
