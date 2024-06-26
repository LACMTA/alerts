const BUS_AGENCY_ID = 'LACMTA';
const RAIL_AGENCY_ID = 'LACMTA_Rail';
const DATA_SOURCE = 'https://pveqxgqnqpmamg2lfxgv4akoau0rabtm.lambda-url.us-west-1.on.aws/';

const DEV_DATA_SOURCE = 'alerts_enhanced.json';

const SERVICE = {
    'RAIL': 'rail',
    'BUS': 'bus',
    'ACCESS': 'access'
};

const STATUS = {
    'ALL': 'all',
    'CURRENT': 'current',
    'UPCOMING': 'upcoming'
};

const RAIL_ICONS = {
    '801': 'https://lacmta.github.io/metro-iconography/Service_ALine.svg',
    '802': 'https://lacmta.github.io/metro-iconography/Service_BLine.svg',
    '803': 'https://lacmta.github.io/metro-iconography/Service_CLine.svg',
    '804': 'https://lacmta.github.io/metro-iconography/Service_ELine.svg',
    '805': 'https://lacmta.github.io/metro-iconography/Service_DLine.svg',
    '807': 'https://lacmta.github.io/metro-iconography/Service_KLine.svg'
};

const BUS_ICONS = {
    '901': 'https://lacmta.github.io/metro-iconography/Service_GLine.svg',
    '910': 'https://lacmta.github.io/metro-iconography/Service_JLine.svg',
    '950': 'https://lacmta.github.io/metro-iconography/Service_JLine.svg'
};

const ACCESS_ICON = 'img/elevator-white.svg';

let serviceSelected = SERVICE.RAIL;
let statusSelected = STATUS.ALL;

let alertsByLine = {};
// let alertsByStop = {};

let railAlerts = {
    'all': [],
    'current': {},
    'upcoming': {}
};
let busAlerts = {
    'all': [],
    'current': {},
    'upcoming': {}
};
let accessAlerts = {
    'all': [],
    'current': [],
    'upcoming': []
};

fetch(DATA_SOURCE)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // updateLastUpdated(data.header.timestamp);
        processAlerts(data.entity);
    });

function updateLastUpdated(time) {
    // result = convertDateTime(time).toLocaleString();
    result = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(time);
    document.querySelector("#lastUpdated span").innerHTML = result;
}

function convertDateTime(time) {
    // result = new Date(time * 1000);

    result = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(time * 1000);

    return result;
}

function createAlertObjectArray(alert) {
    let result = [];

    alert.alert.informed_entity.forEach(entity => {
        let alertObj = {
            'id': alert.id,
            'route_id': entity.route_id,
            'stop_id': entity.stop_id,
            'start': alert.alert.active_period[0].start,
            'end': alert.alert.active_period[0].end,
            'header_text': alert.alert.header_text.translation[0].text,
            'description_text': alert.alert.description_text.translation[0].text
        };

        result.push(alertObj);
    });

    return result;
}

function categorizeAndStoreAlert(route_id, alert, alertsArray) {
    let alertStatus = isUpcoming(alert) ? 'upcoming' : 'current';

    if (alertsArray[alertStatus][route_id] == undefined) {
        alertsArray[alertStatus][route_id] = [];
    }

    alertsArray[alertStatus][route_id].push(alert);
}

function sortAlertsByEffectiveDate(alerts) {
    alerts.sort((a, b) => {
        let aStartTime = convertDateTime(a.alert.active_period[0].start);
        let bStartTime = convertDateTime(b.alert.active_period[0].start);

        // check if end time exists
        if (a.alert.active_period[0].end) {
            if (b.alert.active_period[0].end) {
                if (aStartTime < bStartTime) {
                    return -1;
                } else if (aStartTime > bStartTime) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                return -1;
            }
        } else {
            if (b.alert.active_period[0].end) {
                return 1;
            } else {
                if (aStartTime < bStartTime) {
                    return -1;
                } else if (aStartTime > bStartTime) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    });
}

function combineAlerts(alerts) {
    let target = alerts['all'];

    for (let route in alerts['current']) {
        if (target[route] == undefined) {
            target[route] = [];
        }

        target[route] = target[route].concat(alerts['current'][route]);
    }

    for (let route in alerts['upcoming']) {
        if (target[route] == undefined) {
            target[route] = [];
        }

        target[route] = target[route].concat(alerts['upcoming'][route]);
    }
}

function combineAccessAlerts(alerts) {
    let target = alerts['all'];

    for (let item in alerts['current']) {
        target = target.concat(alerts['current'][item]);
    }

    for (let item in alerts['upcoming']) {
        target = target.concat(alerts['upcoming'][item]);
    }
}

function processAlerts(data) {
    // Add Current and Upcoming Alerts
    data.forEach(alert => {
        // Check if informed_entity exists and is not empty
        if (!alert.alert.informed_entity) {
            console.log(`Alert ${alert.id} has no associated lines. Informed_entity doesn't exist.`);
        } else if (alert.alert.informed_entity.length == 0) {
            console.log(`Alert ${alert.id} has no associated lines. Informed_entity length is 0`);
        } else  {// At least one object exists in informed_entity
            // Loop through each object inside informed_entity
            // to determine what kind of alert this is (bus, rail, or accessibility)
            // Return after the first entity which determines this.
            alert.alert.informed_entity.some((entity, i) => {
                // ACCESS ALERT
                // Check if facility_id exists
                if (entity.facility_id) {
                    accessAlerts.all.push(alert);

                    if (isUpcoming(alert)) {
                        accessAlerts.upcoming.push(alert);
                    } else {
                        accessAlerts.current.push(alert);
                    }
                    return true;
                } else { // BUS/RAIL ALERT - route_id exists
                    // Check if this is bus or rail
                    if (!entity.agency_id) {

                        console.log(`ERROR - Alert ${alert.id}, entity index ${i}, has no agency_id`);

                    } else if (entity.agency_id == BUS_AGENCY_ID) {

                        categorizeAndStoreAlert(splitLine(entity.route_id), alert, busAlerts);
                        return true;

                    } else if (entity.agency_id == RAIL_AGENCY_ID) {

                        categorizeAndStoreAlert(splitLine(entity.route_id), alert, railAlerts);
                        return true;

                    } else {

                        console.log(`ERROR - Alert ${alert.id}, entity index ${i}, has an agency_id that is not Metro bus or rail`);
                        console.log(alert);
                        return true;

                    }
                }
            });
        }
    });

    // Combine Current and Upcoming Alerts, grouped by route_id
    combineAlerts(railAlerts);
    combineAlerts(busAlerts);
    combineAccessAlerts(accessAlerts);

    console.log(alertsByLine);

    console.log('----- accessAlerts -----');
    console.log(accessAlerts);

    console.log('----- busAlerts -----');
    console.log(busAlerts);

    console.log('----- railAlerts -----');
    console.log(railAlerts);

    // If DOM is loaded, updateView(). Otherwise, wait for DOM to load.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateView);
    } else {
        updateView();
    }
}

function splitLine(line) {
    // Remove hyphen and version number    
    let i = line.indexOf("-");
    if (i == -1) {
        return line;
    }
    return line.substring(0, i);
}

function splitStop(stop) {
    // Remove alpha characters
    return stop.replace(/\D/g, '');
}

function isUpcoming(alert) {
    let today = new Date();
    let startTime = new Date(convertDateTime(alert.alert.active_period[0].start));
    let status = today < startTime
    return status;
}

document.addEventListener("DOMContentLoaded", () => {
    // Add event listeners to service navigation buttons

    // check if #service-nav--rail element exists
    if (document.querySelector('#service-nav--rail')) {
        document.querySelector('#service-nav--rail').addEventListener('click', handleServiceClick.bind(SERVICE.RAIL));
    }
    
    if (document.querySelector('#service-nav--bus')) {
        document.querySelector('#service-nav--bus').addEventListener('click', handleServiceClick.bind(SERVICE.BUS));
    }

    if (document.querySelector('#service-nav--access')) {
        document.querySelector('#service-nav--access').addEventListener('click', handleServiceClick.bind(SERVICE.ACCESS));
    }
    

    // Add event listeners to status navigation buttons
    if (document.querySelector('#status-nav--all')) {
        document.querySelector('#status-nav--all').addEventListener('click', handleStatusClick.bind(STATUS.ALL));
    }
    
    if (document.querySelector('#status-nav--current')) {
        document.querySelector('#status-nav--current').addEventListener('click', handleStatusClick.bind(STATUS.CURRENT));
    }
    
    if (document.querySelector('#status-nav--upcoming')) {
        document.querySelector('#status-nav--upcoming').addEventListener('click', handleStatusClick.bind(STATUS.UPCOMING));
    }
    

    // updateView();
});

function handleServiceClick(e) {
    document.querySelectorAll('.nav-buttons__button').forEach(
        nav => nav.classList.remove('nav-buttons__button--selected')
    );

    switch (this.toString()) {
        case SERVICE.RAIL:
            serviceSelected = SERVICE.RAIL;
            document.querySelector('#service-nav--rail').classList.add('nav-buttons__button--selected');
            break;
        case SERVICE.BUS:
            serviceSelected = SERVICE.BUS;
            document.querySelector('#service-nav--bus').classList.add('nav-buttons__button--selected');
            break;
        case SERVICE.ACCESS:
            serviceSelected = SERVICE.ACCESS;
            document.querySelector('#service-nav--access').classList.add('nav-buttons__button--selected');
            break;
    }

    updateView();
}

function handleStatusClick(e) {
    document.querySelectorAll('.nav-tabs__button').forEach(
        nav => nav.classList.remove('nav-tabs__button--selected')
    );

    switch (this.toString()) {
        case STATUS.ALL:
            statusSelected = STATUS.ALL;
            document.querySelector('#status-nav--all').classList.add('nav-tabs__button--selected');

            console.log('all clicked');
            break;
        case STATUS.CURRENT:
            statusSelected = STATUS.CURRENT;
            document.querySelector('#status-nav--current').classList.add('nav-tabs__button--selected');

            console.log('current clicked');
            break;
        case STATUS.UPCOMING:
            statusSelected = STATUS.UPCOMING;
            document.querySelector('#status-nav--upcoming').classList.add('nav-tabs__button--selected');

            console.log('upcoming clicked');
            break;
    }

    updateView();
}

function updateAccessView() {
    let filteredAlerts = accessAlerts[statusSelected];
    let alertList = document.querySelector("#alert-list__content");
    alertList.innerHTML = '';

    if (Object.keys(filteredAlerts).length == 0) {
        let noAlerts = document.createElement("div");
        noAlerts.classList.add("alert-item");
        noAlerts.innerHTML = "No alerts found.";
        alertList.appendChild(noAlerts);
    } else {
        for (let item in filteredAlerts) {
            console.log(item);
            let alert = filteredAlerts[item];

            // Create alert-item element
            let newAlert = document.createElement("div");
            newAlert.classList.add("alert-item");
            newAlert.id = "alert_id_" + alert.id;

            // Create icon element
            let icon = document.createElement("div");
            icon.classList.add("alert-item__icon");
            icon.classList.add("alert-item__icon--access");

            let accessIconDiv = document.createElement("div");
            let accessIcon = document.createElement("img");

            accessIcon.src = 'img/elevator-white.svg';
            accessIcon.alt = 'elevator icon';

            accessIconDiv.appendChild(accessIcon);
            icon.appendChild(accessIconDiv);

            let content = document.createElement("div");
            content.classList.add("alert-item__content");

            let content_title = document.createElement('div');
            content_title.classList.add("alert-item__title");
            content_title.innerHTML = alert.alert.header_text.translation[0].text;

            let content_description = document.createElement('div');
            content_description.classList.add("alert-item__description");
            content_description.innerHTML = alert.alert.description_text.translation[0].text;

            content_description.innerHTML += '<br><br>Starting on: ' + convertDateTime(alert.alert.active_period[0].start);
            if (alert.alert.active_period[0].end) {
                content_description.innerHTML += '<br>Ending on: ' + convertDateTime(alert.alert.active_period[0].end);
            } else {
                content_description.innerHTML += '<br>No end date scheduled yet.';
            }

            content.appendChild(content_title);
            content.appendChild(content_description);

            // Create status
            let status = document.createElement('div');
            status.classList.add("alert-item__status");

            let status_badge = document.createElement('div');

            if (isUpcoming(alert)) {
                status_badge.classList.add("alert-item__status--upcoming");
                status_badge.innerHTML = 'Upcoming';
            } else {
                status_badge.classList.add("alert-item__status--current");
                status_badge.innerHTML = 'Current';
            }

            status.appendChild(status_badge);

            // Add to page
            newAlert.appendChild(icon);
            newAlert.appendChild(content);
            newAlert.appendChild(status);

            alertList.appendChild(newAlert);
        }
    }
}


function updateView() {
    let filteredAlerts = [];

    switch (serviceSelected) {
        case SERVICE.RAIL:
            filteredAlerts = railAlerts[statusSelected];
            break;
        case SERVICE.BUS:
            filteredAlerts = busAlerts[statusSelected];
            break;
        case SERVICE.ACCESS:
            updateAccessView();
            return;
    }

    let alertList = document.querySelector("#alert-list__content");
    alertList.innerHTML = '';

    if (Object.keys(filteredAlerts).length == 0) {
        let noAlerts = document.createElement("div");
        noAlerts.classList.add("alert-item");
        noAlerts.innerHTML = "No alerts found.";
        alertList.appendChild(noAlerts);
    } else {
        // Loop through each key in the filteredAlerts object
        for (let item in filteredAlerts) {
            // Sort the alerts for this route.
            sortAlertsByEffectiveDate(filteredAlerts[item]);

            // Display the alerts for this route.
            filteredAlerts[item].forEach(alert => {
                let isAccessAlert = false;

                // Create alert-item element
                let newAlert = document.createElement("div");
                newAlert.classList.add("alert-item");
                newAlert.id = "alert_id_" + alert.id;

                // Create icon element
                let icon = document.createElement("div");
                icon.classList.add("alert-item__icon");

                // Determine which service to generate a display for
                switch (serviceSelected) {
                    case SERVICE.RAIL:
                        icon.classList.add("alert-item__icon--rail");

                        let railRoute = splitLine(item);
                        let railIcon = document.createElement("img");

                        switch (railRoute) {
                            case '801':
                                railIcon.src = RAIL_ICONS['801'];
                                railIcon.alt = 'A Line';
                                break;
                            case '802':
                                railIcon.src = RAIL_ICONS['802'];
                                railIcon.alt = 'B Line';
                                break;
                            case '803':
                                railIcon.src = RAIL_ICONS['803'];
                                railIcon.alt = 'C Line';
                                break;
                            case '804':
                                railIcon.src = RAIL_ICONS['804'];
                                railIcon.alt = 'D Line';
                                break;
                            case '805':
                                railIcon.src = RAIL_ICONS['805'];
                                railIcon.alt = 'E Line';
                                break;
                            case '807':
                                railIcon.src = RAIL_ICONS['807'];
                                railIcon.alt = 'K Line';
                                break;
                        }

                        railIcon.setAttribute('width', '32');

                        icon.appendChild(railIcon);

                        break;
                    case SERVICE.BUS:
                        let busRoute = splitLine(item);
                        let busIcon = document.createElement("img");

                        switch (busRoute) {
                            case '901':
                                busIcon.src = BUS_ICONS['901'];
                                busIcon.alt = 'G Line';
                                icon.classList.add("alert-item__icon--bus-icon");
                                icon.appendChild(busIcon);
                                break;
                            case '910':
                                busIcon.src = BUS_ICONS['910'];
                                busIcon.alt = 'J Line';
                                icon.classList.add("alert-item__icon--bus-icon");
                                icon.appendChild(busIcon);
                                break;
                            case '950':
                                busIcon.src = BUS_ICONS['950'];
                                busIcon.alt = 'J Line';
                                icon.classList.add("alert-item__icon--bus-icon");
                                icon.appendChild(busIcon);
                                break;
                            default:
                                icon.classList.add("alert-item__icon--bus");
                        }

                        icon.innerHTML = `<div>${item}</div>`;

                        break;
                    case SERVICE.ACCESS:
                        isAccessAlert = true;
                        icon.classList.add("alert-item__icon--access");

                        let accessIconDiv = document.createElement("div");
                        let accessIcon = document.createElement("img");

                        accessIcon.src = 'img/elevator-white.svg';
                        accessIcon.alt = 'elevator icon';
                        accessIcon.setAttribute('width', '32');

                        accessIconDiv.appendChild(accessIcon);
                        icon.appendChild(accessIconDiv);

                        break;
                }

                // Create description content
                let content = document.createElement("div");
                content.classList.add("alert-item__content");

                let content_title = document.createElement('div');
                content_title.classList.add("alert-item__title");
                content_title.innerHTML = alert.alert.header_text.translation[0].text;

                let content_description = document.createElement('div');
                content_description.classList.add("alert-item__description");
                content_description.innerHTML = alert.alert.description_text.translation[0].text;

                content_description.innerHTML += '<br><br>Starting on: ' + convertDateTime(alert.alert.active_period[0].start);
                if (alert.alert.active_period[0].end) {
                    content_description.innerHTML += '<br>Ending on: ' + convertDateTime(alert.alert.active_period[0].end);
                } else {
                    content_description.innerHTML += '<br>No end date scheduled yet.';
                }

                content.appendChild(content_title);
                content.appendChild(content_description);

                // Create status
                let status = document.createElement('div');
                status.classList.add("alert-item__status");

                let status_badge = document.createElement('div');

                if (isUpcoming(alert)) {
                    status_badge.classList.add("alert-item__status--upcoming");
                    status_badge.innerHTML = 'Upcoming';
                } else {
                    status_badge.classList.add("alert-item__status--current");
                    status_badge.innerHTML = 'Current';
                }

                status.appendChild(status_badge);

                // Add to page
                newAlert.appendChild(icon);
                newAlert.appendChild(content);
                newAlert.appendChild(status);

                alertList.appendChild(newAlert);
                
                if (isAccessAlert) {
                    return false;
                } else {
                    return true;
                }
            });

        }
    }

}