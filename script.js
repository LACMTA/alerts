let alertsByLine = {};
let alertsByStop = {};

fetch('https://pveqxgqnqpmamg2lfxgv4akoau0rabtm.lambda-url.us-west-1.on.aws/')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updateLastUpdated(data.header.timestamp);
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
        // Check if informed_entity exists
        if (!alert.alert.informed_entity) {
            console.log(`Alert ${alert.id} has no associated lines.`);
        } else if (alert.alert.informed_entity.length == 0) {
            console.log(`Alert ${alert.id} has no associated lines.`);
        } else {
            // At least one associated line exists for each alert
            // Loop through informed_entitys
            alert.alert.informed_entity.forEach((entity, i) => {
                // Check if route_id doesn't exist
                // Then check if stop_id exists
                if (!entity.route_id) {
                    console.log(`Alert ${alert.id}, index ${i}, has no route_id.`);
                    console.log(alert);

                    if (entity.stop_id) {
                        console.log(`Alert ${alert.id}, index ${i}, has a stop_id.`);

                        let stop = splitStop(entity.stop_id);

                        // Check if stop exists in alertsByStop
                        if (!alertsByStop[stop]) {
                            // If not, create it
                            alertsByStop[stop] = [];
                        }
                        // Check if alert was already added to stop
                        // If so, skip it
                        if (alertsByStop[stop].includes(alert)) {
                            console.log(`Alert ${alert.id} was already added to stop ${stop}.`);
                            return;
                        } else {
                            // Add alert to alertsByStop
                            alertsByStop[stop].push(alert);

                            console.log(alert);
                        }
                    } else {
                        console.log(`Alert ${alert.id}, index ${i}, has no route_id or stop_id`);
                        console.log(alert);
                    }
                } else {
                    // split line and convert to integer
                    let line = splitLine(entity.route_id);
                    line = parseInt(line);

                    // Check if line exists in alertsByLine                   
                    if (!alertsByLine[line]) {
                        // If not, create it
                        alertsByLine[line] = [];
                    }

                    // Check if alert was already added to line
                    // If so, skip it
                    if (alertsByLine[line].includes(alert)) {
                        console.log(`Alert ${alert.id} was already added to line ${line}.`);
                        return;
                    } else {
                        // Add alert to alertsByLine
                        alertsByLine[line].push(alert);
                    }
                }
            });
        }
    });
    console.log(alertsByLine);

    displayAlerts();
    displayAccess();
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


function displayAlerts() {
    // Loop through objects in alertsByLine
    for (const key in alertsByLine) {
        let alerts = alertsByLine[key];
        console.log(`line ${key} has ${alerts.length} alerts`);

        // Create div with id of line
        let lineDiv = document.createElement("div");
        lineDiv.id = key;
        lineDiv.innerHTML = `<h2>Line ${key}</h2> ${alerts.length} alerts`;
        lineDiv.classList.add("line");

        let upcomingDiv = document.createElement("div");
        upcomingDiv.innerHTML = `<h3>Upcoming</h3>`;

        alerts.forEach(alert => {
            let today = new Date();
            let startTime = convertDateTime(alert.alert.active_period[0].start);
            let endTime = convertDateTime(alert.alert.active_period[0].end);

            // Create div with id of alert
            let alertDiv = document.createElement("div");
            alertDiv.id = alert.id;
            alertDiv.classList.add("alert");
            alertDiv.innerHTML = `<h3>${alert.alert.header_text.translation[0].text}</h3> \
            <p>${alert.alert.description_text.translation[0].text}</p>`;

            if (alert.alert.active_period[0].start) {
                alertDiv.innerHTML += `<p>Starting on: ${startTime.toLocaleString()}</p>`;
            }

            if (alert.alert.active_period[0].end) {
                alertDiv.innerHTML += `<p>Ending on: ${endTime.toLocaleString()}</p>`;
            }

            // Add to page
            if (today < startTime) {
                upcomingDiv.appendChild(alertDiv);
                lineDiv.appendChild(upcomingDiv);
            } else {
                lineDiv.appendChild(alertDiv);
            }
        });

        // Add to page
        document.querySelector("#alerts").appendChild(lineDiv);
    }
}

function displayAccess() {
    // Loop through objects in alertsByStop
    for (const key in alertsByStop) {
        let alerts = alertsByStop[key];
        console.log(`stop ${key} has ${alerts.length} alerts`);

        // Create div with id of stop
        let stopDiv = document.createElement("div");
        stopDiv.id = key;
        stopDiv.innerHTML = `<h2>Stop ${key}</h2> ${alerts.length} alerts`;
        stopDiv.classList.add("stop");

        let upcomingDiv = document.createElement("div");
        upcomingDiv.innerHTML = `<h3>Upcoming</h3>`;

        alerts.forEach(alert => {
            let today = new Date();
            let startTime = convertDateTime(alert.alert.active_period[0].start);
            let endTime = convertDateTime(alert.alert.active_period[0].end);

            // Create div with id of alert
            let alertDiv = document.createElement("div");
            alertDiv.id = alert.id;
            alertDiv.classList.add("alert");
            alertDiv.innerHTML = `<h3>${alert.alert.header_text.translation[0].text}</h3> \
            <p>${alert.alert.description_text.translation[0].text}</p>`;

            if (alert.alert.active_period[0].start) {
                alertDiv.innerHTML += `<p>Starting on: ${startTime.toLocaleString()}</p>`;
            }

            if (alert.alert.active_period[0].end) {
                alertDiv.innerHTML += `<p>Ending on: ${endTime.toLocaleString()}</p>`;
            }

            // Add to page
            if (today < startTime) {
                upcomingDiv.appendChild(alertDiv);
                stopDiv.appendChild(upcomingDiv);
            } else {
                stopDiv.appendChild(alertDiv);
            }
        });

        // Add to page
        document.querySelector("#alerts").appendChild(stopDiv);
    }
}