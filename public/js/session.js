class Session
{
    constructor() {
        $.post({
            url: '/analytics/createSession',
            data: {},
            contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            if(!data.err) {
                window.TimerObject.session.sessionId = data.sessionId;
            } else {
                console.log("Error creating session.");
            }
        })
    }
    updateSession(time, completed) {
        $.post({
          url: '/analytics/updateSession',
          data: JSON.stringify({
              time: time,
              completed: completed,
              sessionId: this.sessionId
          }),
          contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            console.log(data);
        });
    }
}