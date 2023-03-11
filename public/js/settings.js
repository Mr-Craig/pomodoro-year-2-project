class Settings {
    constructor() {
        $.get({
            url: '/settings/get',
            contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            if(!data.err) {
                window.Settings.options = data.settings;

                $('#pomodoroTime').val(window.Settings.options.pomodoro_work_period);
                $('#breakTime').val(window.Settings.options.pomodoro_break_period);

                if(window.Settings.options.auto_start_breaks) {
                    $('#autoStartBreak').prop('checked', true);
                }
                if(window.Settings.options.auto_start_pomodoros) {
                    $('#autoStartPomodoros').prop('checked', true);
                }

                if(window.Settings.options.notification) {
                    $('#notification').prop('checked', true);
                }
                if(window.Settings.options.alarm_sound) {
                    $('#alarmSound').prop('checked', true);
                }
                
                $('#volume').val(window.Settings.options.alarm_volume);

                $('#alarmSoundType').val(window.Settings.options.alarm_sound_type);
            } else {
                console.log("Error creating session.");
            }
        })
    }
    getSettings() {
        return this.options;
    }
    setAlarm(newAlarm) {
        this.options.alarm_sound = newAlarm;
        this.updateSettings();
    }
    setAlarmSound(newSound) {
        this.options.alarm_sound_type = newSound;
        let tempAudio = new Audio(window.alarmSound[newSound]);
        tempAudio.volume = this.options.alarm_volume/100;
        tempAudio.play();
        this.updateSettings();
    }
    setNotification(newNotif) {
        this.options.notification = newNotif;
        this.updateSettings();
    }
    setAutoStartBreaks(newAutoBreaks) {
        this.options.auto_start_breaks = newAutoBreaks;
        this.updateSettings();
    }
    setAutoStartPomodoros(newAutoPomodoros) {
        this.options.auto_start_pomodoros = newAutoPomodoros;
        this.updateSettings();
    }
    setPomodoroBreakPeriod(newBreak) {
        this.options.pomodoro_break_period = newBreak;
        this.updateSettings();
    }
    setPomodoroWorkPeriod(newWork) {
        this.options.pomodoro_work_period = newWork;
        this.updateSettings();
    }
    setAlarmVolume(newVolume) {
        this.options.alarm_volume = newVolume;
        this.updateSettings();
    }
    updateSettings() {
        $.post({
            url: '/settings/update',
            data: JSON.stringify(this.options),
            contentType: 'application/json; charset=utf-8'
        },  function(data, status) {
            console.log(data);
        });
    }
}

window.Settings = new Settings();

$(document).ready(function() {
    $('#pomodoroTime').change(function() {
        window.Settings.setPomodoroWorkPeriod(parseFloat($(this).val()));
    });
    $('#breakTime').change(function() {
        window.Settings.setPomodoroBreakPeriod(parseFloat($(this).val()));
    });
    $('#autoStartBreak').change(function() {
        window.Settings.setAutoStartBreaks(this.checked);
    })
    $('#autoStartPomodoros').change(function() {
        window.Settings.setAutoStartPomodoros(this.checked);
    })
    $('#alarmSound').change(function() {
        window.Settings.setAlarm(this.checked);
    })
    $('#notification').change(function() {
        window.Settings.setNotification(this.checked);
    })
    $('#volume').change(function() {
        window.Settings.setAlarmVolume(parseInt($(this).val()));
    });
    $('#alarmSoundType').change(function() {
        window.Settings.setAlarmSound(parseInt($(this).val()));
    })
});