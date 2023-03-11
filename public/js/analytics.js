//https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

window.getAnalytics = function() {
    $.get({
        url: '/api/analytics',
        contentType: 'application/json; charset=utf-8'
    }, function(data, status) {
        if(data.success) {
           // $('#hoursFocused').html(data.user.)
           // user stats
           $('#daysAccessed').html(data.user.unique_logins);
           $('#daysStreak').html(data.user.streak);

           const sessionsIntoDays = [];
           let timeTotal = 0;

            for(let sessionKey in data.sessions) {
                let session = data.sessions[sessionKey];
                let sessionDate = new Date(session.date);
                if(typeof(sessionsIntoDays[`${sessionDate.getDate()}/${sessionDate.getDay()}`]) !== "undefined") {
                    sessionsIntoDays[`${sessionDate.getDate()}/${sessionDate.getDay()}`].time += session.time;
                } else {
                    sessionsIntoDays[`${sessionDate.getDate()}/${sessionDate.getDay()}`] = {
                        date: sessionDate,
                        time: session.time
                    };
                }

                timeTotal += session.time;
            }
            $('#hoursFocused').html(((timeTotal/60)/60).toFixed(2));

            const chartData = [];

            for(let sessionsKey in sessionsIntoDays) {
                chartData.push({
                    x: sessionsIntoDays[sessionsKey].date,
                    y: ((sessionsIntoDays[sessionsKey].time/60)/60).toFixed(2)
                })
            }

            chartData.sort(function(a,b){
                return new Date(b.x) - new Date(a.x);
            });

            // Destroy old chart if exists.
            if(typeof( window.analyticsChart ) !== "undefined") {
                window.analyticsChart.destroy();
            }
            const ctx = document.getElementById('analyticsCanvas');
            const chart = new Chart(ctx, {
                type: "line",
                data: {
                    datasets: [{
                        label: 'Hours',
                        data: chartData,
                        fill: false,
                        borderColor: 'rgb(255, 169, 1)',
                        tension: 0.25
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            }
                        }
                    }
                }
            });

            window.analyticsChart = chart;

            // leaderboard

            $('#leaderboardEntries').empty();
            let leaderboardEntries = 0;
            data.leaderboard.sort(function(a,b){
                return b.time - a.time;
            });
            for(let entryIndex in data.leaderboard) {
                let entry = data.leaderboard[entryIndex];

                $('#leaderboardEntries').append(`<tr class="text-s">
                        <td class="py-1 w-fit"><strong>#${parseInt(entryIndex)+1}</strong>    <img
                        class="inline" src="https://flagcdn.com/w20/${entry.location.toLowerCase()}.png"
                        srcset="https://flagcdn.com/w40/za.png 2x"
                        width="20"
                        alt="${entry.location}" title="${entry.location}"> ${entry.username}</td>
                        <td class="w-fit">${`${entry.total_time}`.toHHMMSS()}</td>
                    </tr>`);

                    leaderboardEntries++;
            }

            // Individual Sessions

            data.sessions.sort(function(a,b){
                return new Date(b.date) - new Date(a.date);
            });
            $('#detailedSessions').empty();
            let sessionCount = 0;
            for(let sessionIndex in data.sessions) {
                let session = data.sessions[sessionIndex];

                if((session.time/60).toFixed(2) <= 0)
                    continue;

                if(sessionCount > 20)
                    break;
                $('#detailedSessions').append(`<tr class="text-s">
                    <td class="py-1 font-bold">${new Date(session.date).toISOString().substr(0,10)}</td>
                    <td>${(session.time/60).toFixed(2)}</td>
                    <td>${session.completed ? '<i class="fa-solid fa-check"></i>' : ''}</td>
                </tr>`)

                sessionCount++;
            }
        } else {
            alert("Error getting stats!");
        }
    });
};

$(document).ready(function() {
    window.getAnalytics();
})
