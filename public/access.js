const DATA_SOURCE_TEST = 'alerts_access.json';
let localData = {
    "id": "",
    "alert": {
        "effect": "", /* EFFECT - ACCESSIBILITY_ISSUE*/
        "effect_detail": {
            "translation": [
                {
                    "text": "ACCESS_ISSUE",
                    "language": "en"
                }
            ]
        },
        "cause": "", /* CAUSE - TECHNICAL_PROBLEM, MAINTENANCE, etc. */
        "cause_detail": {
            "translation": [
                {
                    "text": "[CAUSE DETAIL]", /* CAUSE DETAIL */
                    "language": "en"
                }
            ]
        },
        "header_text": {
            "translation": [
                {
                    "text": "[HEADER TEXT]", /* HEADER TEXT */
                    "language": "en"
                }
            ]
        },
        "description_text": {
            "translation": [
                {
                    "text": "[DESCRIPTION TEXT]", /* DESCRIPTION TEXT */
                    "language": "en"
                }
            ]
        },
        "severity_level": "[SEVERITY LEVEL]",
        "active_period": [
            {
                "start": 1723050000, /* START TIME */
                "end": 1723057200 /* END TIME */
            }
        ],
        "informed_entity": [
            {
                "route_id": "801", /* ROUTE ID */
                "stop_id": "80114" /* STOP ID */
            }
        ]
    }
};

fetch(DATA_SOURCE_TEST)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        processAlerts(data.entity);
    });

function processAlerts(alerts) {
    document.getElementById('data').innerHTML = JSON.stringify(alerts, null, 2);
}