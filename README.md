# alerts-page-prototype
This is a prototype for a redesign of the Alerts page on Metro.net

The `dev` branch is deployed to the staging environment through the `alerts-dev` repository.

To set up the project locally to deploy to the `alerts-dev` repository, set up a remote URL and push:

```
$ git remote add dev https://github.com/LACMTA/alerts-dev.git
```

Verify your remote to dev exists along side the remote origin:
```
$ git remote -v
dev     https://github.com/LACMTA/alerts-dev.git (fetch)
dev     https://github.com/LACMTA/alerts-dev.git (push)
origin  git@github.com:LACMTA/alerts.git (fetch)
origin  git@github.com:LACMTA/alerts.git (push)
```

Push the `dev` branch to the `alerts-dev` repository:
```
$ git switch dev
$ git push dev
```

