# alerts-dev

This is the `dev` branch from [the alerts repo](https://github.com/LACMTA/alerts).  Updates are pushed here so the page can be tested live.

## Development

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

## Content

The three alert service categories are labeled as:
* Rail
* Bus
* Elevator & Escalator

The three alert status filters are labeled as:
* Current
* Upcoming
* All

If there are no alerts for a particular service or status, the alert list area displays:
* There are no `status` alerts for `service`. Last updated: `timestamp`.

If a service disruption has no end date provided, this displays:
* No end date scheduled yet.

If there is a URL provided in the data, this message displays as a link to that URL:
* More info on service impact to `route`.

Each alert displays in the list based on the data:
* The line icon is based on `route_id`.
* The bold heading displays the `headerText` value, which is auto-generated for elevator/escalator alerts.
* The alert content displays the `descriptionText` value and generates a message based on the `active_period[0].start` and `active_period[0].end`.

