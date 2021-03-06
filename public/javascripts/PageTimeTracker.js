//Written by Alex Amin Zamani on Nov 16, 2020

function updatePageViewTime (timeSpent) {
    return $.ajax({
        url: '/api/timing',
        data: null,
        headers: {
            'timeSpent': timeSpent
        },
        type: "POST",
        success: function (responseData) {
            //Do nothing
        }, error: console.error
    })
}

TimeMe.initialize({
    currentPageName: "homePage",
    idleTimeoutInSeconds: -1,
});
console.log("initialized");
var isOnIOS = navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) ||navigator.userAgent.match(/iPod/i);
var eventName = isOnIOS ? "pagehide" : "beforeunload";

window.addEventListener(eventName, function (event) {
    var message = 'Are you sure you want to leave or refresh?';
    if (typeof event == undefined)
        event = window.event;
    if (event) event.returnValue = message;
    var timeSpentOnPage = TimeMe.getTimeOnCurrentPageInSeconds();
    updatePageViewTime(timeSpentOnPage);
    TimeMe.resetAllRecordedPageTimes();
    return message;
});