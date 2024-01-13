const BUS_AGENCY_ID = 'LACMTA';
const RAIL_AGENCY_ID = 'LACMTA_Rail';

const SERVICE = {
    'RAIL': 'rail',
    'BUS': 'bus',
    'ACCESS': 'access'
};

const STATUS = {
    'ALL': 'all',
    'ONGOING': 'ongoing',
    'UPCOMING': 'upcoming'
};

const RAIL_ICONS = {
    '801': 'https://lacmta.github.io/metro-iconography/Service_ALine.svg',
    '802': 'https://lacmta.github.io/metro-iconography/Service_BLine.svg',
    '803': 'https://lacmta.github.io/metro-iconography/Service_CLine.svg',
    '804': 'https://lacmta.github.io/metro-iconography/Service_ELine.svg',
    '805': 'https://lacmta.github.io/metro-iconography/Service_DLine.svg',
    '807': 'https://lacmta.github.io/metro-iconography/Service_KLine.svg'
}

let serviceSelected = SERVICE.RAIL;
let statusSelected = STATUS.ALL;

let alertsByLine = {};
// let alertsByStop = {};

let railAlerts = {
    'all': [],
    'ongoing': [],
    'upcoming': []
};
let busAlerts = {
    'all': [],
    'ongoing': [],
    'upcoming': []
};
let accessAlerts = {
    'all': [],
    'ongoing': [],
    'upcoming': []
};

fetch('https://pveqxgqnqpmamg2lfxgv4akoau0rabtm.lambda-url.us-west-1.on.aws/')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // updateLastUpdated(data.header.timestamp);
        processAlerts(data.entity);
    });

function updateLastUpdated(time) {
    result = convertDateTime(time).toLocaleString();
    document.querySelector("#lastUpdated span").innerHTML = result;
}

function convertDateTime(time) {
    result = new Date(time * 1000);
    return result;
}

function processAlerts(data) {
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
                // Check if route_id doesn't exist
                if (!entity.route_id) {
                    // Check if stop_id exists - this is an ACCESS ALERT
                    if (entity.stop_id) {
                        accessAlerts.all.push(alert);

                        if (isUpcoming(alert)) {
                            accessAlerts.upcoming.push(alert);
                        } else {
                            accessAlerts.ongoing.push(alert);
                        }
                        return true;
                    } else {
                        console.log(`ERROR - Alert ${alert.id}, entity index ${i}, has no route_id or stop_id`);
                        console.log(alert);
                        return true;
                    }
                } else { // route_id exists so this is a bus or rail alert
                    // Check if this is bus or rail
                    if (!entity.agency_id) {
                        console.log(`ERROR - Alert ${alert.id}, entity index ${i}, has no agency_id`);
                    } else if (entity.agency_id == BUS_AGENCY_ID) {
                        busAlerts.all.push(alert);

                        if (isUpcoming(alert)) {
                            busAlerts.upcoming.push(alert);
                        } else {
                            busAlerts.ongoing.push(alert);
                        }
                        return true;
                    } else if (entity.agency_id == RAIL_AGENCY_ID) {
                        railAlerts.all.push(alert);

                        if (isUpcoming(alert)) {
                            railAlerts.upcoming.push(alert);
                        } else {
                            railAlerts.ongoing.push(alert);
                        }
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
    let startTime = convertDateTime(alert.alert.active_period[0].start);
    return today < startTime;
}

document.addEventListener("DOMContentLoaded", () => {
    // Add event listeners to service navigation buttons
    document.querySelector('#service-nav--rail').addEventListener('click', handleServiceClick.bind(SERVICE.RAIL));
    document.querySelector('#service-nav--bus').addEventListener('click', handleServiceClick.bind(SERVICE.BUS));
    document.querySelector('#service-nav--access').addEventListener('click', handleServiceClick.bind(SERVICE.ACCESS));

    // Add event listeners to status navigation buttons
    document.querySelector('#status-nav--all').addEventListener('click', handleStatusClick.bind(STATUS.ALL));
    document.querySelector('#status-nav--ongoing').addEventListener('click', handleStatusClick.bind(STATUS.ONGOING));
    document.querySelector('#status-nav--upcoming').addEventListener('click', handleStatusClick.bind(STATUS.UPCOMING));

    // updateView();
});

function handleServiceClick(e) {
    document.querySelectorAll('.service-nav__button').forEach(
        nav => nav.classList.remove('service-nav__button--selected')
    );

    switch (this.toString()) {
        case SERVICE.RAIL:
            serviceSelected = SERVICE.RAIL;
            document.querySelector('#service-nav--rail').classList.add('service-nav__button--selected');

            console.log('rail clicked');
            break;
        case SERVICE.BUS:
            serviceSelected = SERVICE.BUS;
            document.querySelector('#service-nav--bus').classList.add('service-nav__button--selected');

            console.log('bus clicked');
            break;
        case SERVICE.ACCESS:
            serviceSelected = SERVICE.ACCESS;
            document.querySelector('#service-nav--access').classList.add('service-nav__button--selected');

            console.log('access clicked');
            break;
    }

    updateView();
}

function handleStatusClick(e) {
    document.querySelectorAll('.status-nav__button').forEach(
        nav => nav.classList.remove('status-nav__button--selected')
    );

    switch (this.toString()) {
        case STATUS.ALL:
            statusSelected = STATUS.ALL;
            document.querySelector('#status-nav--all').classList.add('status-nav__button--selected');

            console.log('all clicked');
            break;
        case STATUS.ONGOING:
            statusSelected = STATUS.ONGOING;
            document.querySelector('#status-nav--ongoing').classList.add('status-nav__button--selected');

            console.log('ongoing clicked');
            break;
        case STATUS.UPCOMING:
            statusSelected = STATUS.UPCOMING;
            document.querySelector('#status-nav--upcoming').classList.add('status-nav__button--selected');

            console.log('upcoming clicked');
            break;
    }

    updateView();
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
            filteredAlerts = accessAlerts[statusSelected];
            break;
    }

    let alertList = document.querySelector("#alert-list__content");
    alertList.innerHTML = '';

    // Loop through alerts in list
    filteredAlerts.forEach(alert => {
        // Loop through informed_entity for this alert
        alert.alert.informed_entity.every(entity => {
            let isAccessAlert = false;

            // Create alert-item element
            let newAlert = document.createElement("div");
            newAlert.classList.add("alert-item");

            // Create icon element
            let icon = document.createElement("div");
            icon.classList.add("alert-item__icon");

            // Determine which service to generate a display for
            switch (serviceSelected) {
                case SERVICE.RAIL:
                    icon.classList.add("alert-item__icon--rail");

                    let railRoute = splitLine(entity.route_id);
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

                    icon.appendChild(railIcon);

                    break;
                case SERVICE.BUS:
                    icon.classList.add("alert-item__icon--bus");

                    let busRoute = splitLine(entity.route_id);
                    icon.innerHTML = `<div>${busRoute}</div>`;

                    break;
                case SERVICE.ACCESS:
                    isAccessAlert = true;
                    icon.classList.add("alert-item__icon--access");

                    let accessIconDiv = document.createElement("div");
                    let accessIcon = document.createElement("img");

                    accessIcon.src = 'img/elevator.svg';
                    accessIcon.alt = 'elevator icon';

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
                status_badge.classList.add("alert-item__status--ongoing");
                status_badge.innerHTML = 'Ongoing';
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
    });
}