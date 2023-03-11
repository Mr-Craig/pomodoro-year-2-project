const States = {
    WORK_PERIOD: "WORK_PERIOD",
    SHORT_BREAK: "BREAK"
};

class Timer {
    constructor() {
        this.State = States.WORK_PERIOD;

        this.tickInterval = setInterval(function(timer) {
            timer.tick();
        }, 100, this);

        //this.WorkPeriod = 30000;
        //this.BreakPeriod = 10000;
        //this.LongBreakPeriod = 30000;
       
        this.Number = 1;
        this.isRunning = false;
    }
    tick() {
      this.renderTimer();
      
      if(this.State === States.WORK_PERIOD) {
        this.workState();
      } else if(this.State === States.SHORT_BREAK) {
        this.shortBreakState();
      }
    }
    renderTimer() {
      $('#State').html(this.State);
      
      if(this.isRunning) {
        $('#timerButton').html("Stop");
      } else {
        $('#timerButton').html("Start");
      }
      if(this.State === States.WORK_PERIOD) {
        $('#pomodoroButton').addClass('active-state');
        $('#breakButton').removeClass('active-state');
      } else {
        $('#pomodoroButton').removeClass('active-state');
        $('#breakButton').addClass('active-state');
      }
      if(this.isRunning) {
        let currentTime = new Date().getTime();
        let distance = this.endTime - currentTime;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if(seconds < 0 ) {
          $('#timerElement').html("00:00");
        } else {
          $('#timerElement').html(("0" +minutes).slice(-2)+":"+("0" +seconds).slice(-2));
        }
        
      } else {
        let distance = 0;
        if(this.State === States.WORK_PERIOD) {
          distance =window.Settings.options.pomodoro_work_period * 60 * 1000;
        } else {
          distance =window.Settings.options.pomodoro_break_period * 60 * 1000;
        }
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
         $('#timerElement').html(("0" +minutes).slice(-2)+":"+("0" +seconds).slice(-2));
      }
      
    }
    startTimer(newSession = true) {
      this.isRunning = true;
      this.startTime = new Date().getTime();
      this.endTime = this.startTime + ((this.State === States.WORK_PERIOD ? window.Settings.options.pomodoro_work_period : window.Settings.options.pomodoro_break_period) * 60 * 1000);
      if(newSession) {
        this.initalTime = new Date().getTime();
        this.session = new Session();
      }
    }
    stopTimer() {
      this.startTime = 0;
      this.Number = 0;
      this.isRunning = false;
    }
    workState() {
      if(new Date().getTime() > this.endTime && this.isRunning) {
        this.State = States.SHORT_BREAK;
        this.Number++;
        this.ring(true);
        this.session.updateSession((new Date().getTime() - this.initalTime)/1000, false);
        if(window.Settings.options.auto_start_breaks) {
          this.startTimer(false);
        } else {
          this.stopTimer();
        }
      }
    }

    shortBreakState() {
      if(new Date().getTime() > this.endTime && this.isRunning) {
        if(this.Number !== 4) {
          this.State = States.WORK_PERIOD;
          if(window.Settings.options.auto_start_pomodoros) {
            this.startTimer(false);
          } else {
            this.stopTimer();
          }
          this.ring(false);
          this.session.updateSession((new Date().getTime() - this.initalTime)/1000, false);
        } else if(this.isRunning) {
          this.stopTimer();
          this.session.updateSession((new Date().getTime() - this.initalTime)/1000, true);
        }
      }
    }

    ring(isBreak = true) {
      if(window.Settings.options.notification) {
        new Notification('Timer completed', {
          body: isBreak ? 'Time for a break!' : 'Time to get back to work!',
        });
      }
      if(window.Settings.options.alarm_sound) {
        this.audio = new Audio(window.alarmSound[window.Settings.options.alarm_sound_type]);
        this.audio.volume = window.Settings.options.alarm_volume / 100;
        this.audio.play();
      }
    }
}

window.TimerObject = new Timer();

$(document).ready(function() {
  // ask for notification permissions :)
  if (Notification.permission !== 'granted')
    Notification.requestPermission();
  $('#timerButton').click(function(e) {
    e.preventDefault();
    if(window.TimerObject.isRunning) {
      window.TimerObject.stopTimer();
    } else {
      window.TimerObject.startTimer();
    }
  });
  $('#pomodoroButton').click(function(e) {
    e.preventDefault();
    if(window.TimerObject.isRunning) {
      if(!confirm("The timer is still running, are you sure you want to change?")) {
        return;
      }
      window.TimerObject.stopTimer();
    }
    window.TimerObject.State = States.WORK_PERIOD;
  });
  $('#breakButton').click(function(e) {
    e.preventDefault();
    if(window.TimerObject.isRunning) {
      if(!confirm("The timer is still running, are you sure you want to change?")) {
        return;
      }
      window.TimerObject.stopTimer();
    }
    window.TimerObject.State = States.SHORT_BREAK;
    
  });
});