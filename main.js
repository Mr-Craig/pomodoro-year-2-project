const express = require('express');
const bodyParser = require('body-parser');
const db = require('mysql2-promise')();
const uniqid = require('uniqid');
const sha256 = require('sha256');
const requestCountry = require('request-country');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
        user: "",
        pass: ""
    }
});

db.configure({
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
});

const jwtSecret = "lY4uVhrSW6wVlm4sm62wMlG9aqNvGtnl3Fpv23y86AHxsesMPQTJYaX55pzs8pQyjNxpbQ5etJae5REwbWZ8vjGmQFV7gsDLxNx";

const app = express()

app.use(bodyParser.json());
app.use(requestCountry.middleware({
    attributeName: 'requestCountryCode',
    privateIpCountry: 'GB'
}));

app.use(cookieParser());

const authenticated = (req, res, next) => {
    if (typeof (req.cookies.token) !== "undefined") {
        jwt.verify(req.cookies.token, jwtSecret, function (err, decoded) {
            if (err) {
                console.log(err);
                res.redirect('/');
                return;
            } else {
                req.userId = decoded.userId;
                next();
            }
        });
    } else {
        res.redirect('/');
    }
};

app.use(express.static('public'));

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/Login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/CreateAccount.html'));
});

app.get('/forgotpassword', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/ForgotPassword.html'));
});

app.get('/activate', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/ActivationLink.html'));
});
// Alex
/*
app.get('/register/:token', (req, res) => {
    let token = req.params.token;

    db.execute("SELECT * FROM users WHERE register_token = ?", [token]).then((res_) => {
        res.send(res_);
    }).catch((err) => {
        res.send("err");
    })
});
*/

app.get('/register/:token', async (req, res) => {
    let token = req.params.token;


    let dbResponse = await db.execute("SELECT * FROM users WHERE register_token = ?", [token]).catch((err) => {
        res.send("err");
    })

    if (typeof (dbResponse[0][0]) === "undefined") {
        res.redirect("/");
    } else {
        res.sendFile(path.join(__dirname, '/public/CreateUsername.html'));
    }
});

app.get('/reset-password/:token', async (req, res) => {
    let token = req.params.token;

    let dbResponse = await db.execute("SELECT * FROM users WHERE reset_token = ?", [token]).catch((err) => {
        res.send("err");
    });

    if (typeof (dbResponse[0][0]) === "undefined") {
        res.redirect("/");
    } else {
        res.sendFile(path.join(__dirname, '/public/SetNewPassword.html'));
    }
});

app.post('/register', (req, res) => {
    if (typeof (req.body.email) === "undefined") {
        res.send({
            success: false,
            reason: "No e-mail sent in body."
        })
    }
    if (!req.requestCountryCode) {
        req.requestCountryCode = 'GB';
    }

    let email = req.body.email;


    db.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]).then((result) => {
        if (result[0][0].count === 0) {
            const register_token = sha256(uniqid());

            db.query("INSERT INTO users(email, id, location, register_token) VALUES(?,?,?,?)", [email, uniqid(), req.requestCountryCode, register_token]).then((result) => {
                transporter.sendMail({
                    from: 'no-reply@pomothink.com',
                    to: email,
                    subject: 'Welcome to Pomothink!',
                    text: `Hello\r\n\r\n Before you can continue, you must verify your e-mail. Please click <a href='http://localhost:8080/register/${register_token}'>here.</a> \r\n\r\n Copy and paste this link if you can't access the page http://localhost:8080/register/${register_token} \r\n\r\n Thanks, \r\nPomothink`
                }, (err, info) => {
                    res.json({
                        success: true
                    });
                });

            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            })
        } else {
            res.json({
                success: false,
                reason: "E-mail already exists."
            });
            return;
        }
    }).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "DB Request Error"
        });
    });
});

// Miguel
app.post('/register/finishRegister', async (req, res) => {
    let register_token = req.body.register_token;
    let password_unhashed = req.body.password;
    let username = req.body.username;

    let password = await bcrypt.hash(password_unhashed, 10).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "Hash failed."
        });
        return;
    });

    db.query('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username]).then((result) => {
        if (result[0][0].count === 0) {
            db.query("UPDATE users SET username = ?, password = ?, register_token = NULL WHERE register_token = ?", [username, password, register_token]).then((result) => {
                db.query("SELECT id FROM users WHERE username = ?", [username]).then((res_) => {
                    jwt.sign({
                        userId: res_[0][0].id
                    }, jwtSecret, function (err, token) {
                        if (err) {
                            res.json({
                                success: false
                            });
                            console.log(err);
                            return;
                        }

                        res.cookie('token', token);
                        res.json({
                            success: true
                        });
                    });

                }).catch((err) => {
                    console.log(err);
                    res.json({
                        success: false,
                        reason: "DB Request Error"
                    });
                });
            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            })
        } else {
            res.json({
                success: false,
                reason: "Username already exists."
            });
            return;
        }
    }).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "DB Request Error"
        });
    });
});

//Dilan
app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    db.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]).then((result) => {
        if (result[0][0].count === 0) {
            res.json({
                success: false,
                reason: "Invalid username/password"
            });
        } else {
            db.query('SELECT password, id, last_logged_in FROM users WHERE email = ?', [email]).then((result_) => {
                bcrypt.compare(password, result_[0][0].password).then(function (result) {
                    if (result) {
                        jwt.sign({
                            userId: result_[0][0].id
                        }, jwtSecret, function (err, token) {
                            if (err) {
                                console.log(err);
                                res.send({
                                    success: false
                                });
                            } else {
                                res.cookie('token', token);
                                res.send({
                                    success: true
                                });
                            }
                        })

                        let lastLogin = new Date(result_[0][0].last_logged_in);

                        let currentDate = new Date();
                        if (lastLogin.getDate() != currentDate.getDate()) {
                            if ((lastLogin.getDate() + 1) === currentDate.getDate()) {
                                // streak
                                db.query("UPDATE users SET streak=streak+1, last_logged_in = ?, unique_logins=unique_logins+1 WHERE id = ?", [currentDate, result_[0][0].id]).catch((e) => {
                                    console.log(e);
                                });
                            } else {
                                // reset streak
                                db.query("UPDATE users SET streak=1, last_logged_in = ?, unique_logins=unique_logins+1 WHERE id = ?", [currentDate, result_[0][0].id]).catch((e) => {
                                    console.log(e);
                                });
                            }
                        }
                    } else {
                        res.json({
                            success: false,
                            reason: "Invalid username/password"
                        });
                    }
                });
            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            });
        }
    }).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "DB Request Error"
        });
    });
});

app.post('/reset-password', (req, res) => {
    let email = req.body.email;

    db.query('SELECT COUNT(*) AS count, username FROM users WHERE email = ?', [email]).then((result) => {
        if (result[0][0].count === 0) {
            res.json({
                success: false,
                reason: "Invalid email"
            });
        } else {
            const reset_token = sha256(uniqid());

            db.query("UPDATE users SET reset_token = ? WHERE email = ?", [reset_token, email]).then((result_) => {
                transporter.sendMail({
                    from: 'no-reply@pomothink.com',
                    to: email,
                    subject: 'Pomothink password reset',
                    text: `Hello ${result[0][0].username},\r\n\r\n To reset your password please click <a href='http://localhost:8080/reset-password/${reset_token}'>here.</a> \r\n\r\n Copy and paste this link if you can't access the page http://localhost:8080/reset-password/${reset_token} \r\n\r\n Thanks, \r\nPomothink`
                }, (err, info) => {
                    res.json({
                        success: true
                    });
                });
            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            });
        }
    }).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "DB Request Error"
        });
    });
});

app.post('/reset-password/finish', async (req, res) => {
    let reset_token = req.body.reset_token;
    let password_unhashed = req.body.password;

    let password = await bcrypt.hash(password_unhashed, 10).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "Hash failed."
        });
        return;
    });

    db.query('SELECT COUNT(*) AS count FROM users WHERE reset_token = ?', [reset_token]).then((result) => {
        if (result[0][0].count === 0) {
            res.json({
                success: false,
                reason: "reset token error"
            });
        } else {
            db.query('UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?', [password, reset_token]).then((result) => {
                res.json({
                    success: true
                });
            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            });
        }
    }).catch((err) => {
        console.log(err);
        res.json({
            success: false,
            reason: "DB Request Error"
        });
    });
});

app.post('/analytics/createSession', authenticated, (req, res) => {
    const sessionId = uniqid();
    db.query('INSERT INTO sessions(id, user_id) VALUES(?,?)', [sessionId, req.userId]).then((result) => {
        res.send({
            err: false,
            sessionId: sessionId
        });
    }).catch((e) => {
        console.log(e);

        res.send({
            err: true
        });
    })
});

app.post('/analytics/updateSession', authenticated, (req, res) => {
    let sessionId = req.body.sessionId;
    let time = req.body.time;
    let completed = req.body.completed;

    db.query('UPDATE sessions SET time = ?, completed = ? WHERE id = ?', [time, completed, sessionId]).then((result) => {
        res.send({
            err: false
        });
    }).catch((e) => {
        console.log(e);

        res.send({
            err: true
        });
    });
});

// SELECT * FROM settings WHERE user_id = ?
// INSERT INTO settings(user_id) VALUES(?)

app.get('/settings/get', authenticated, (req, res) => {
    db.query("SELECT * FROM settings WHERE user_id = ?", [req.userId]).then((result) => {
        if (typeof (result[0][0]) === "undefined") {
            // theres no settings in database
            db.query('INSERT INTO settings(user_id) VALUES(?)', [req.userId]).then(() => {
                res.send({
                    err: false,
                    settings: {
                        pomodoro_work_period: 25,
                        pomodoro_break_period: 10,
                        auto_start_breaks: false,
                        auto_start_pomodoros: false,
                        alarm_sound: true,
                        notification: true,
                        alarm_sound_type: 0
                    }
                });
            }).catch((e) => {
                console.log(e);
                res.send({
                    err: true
                });
            });
        } else {
            res.send({
                err: false,
                settings: result[0][0]
            });
        }

    }).catch((e) => {
        console.log(e);

        res.send({
            err: true
        });
    });
});

//  

app.post('/settings/update', authenticated, (req, res) => {
    let userId = req.userId;
    let pomodoro_work_period = req.body.pomodoro_work_period
    let pomodoro_break_period = req.body.pomodoro_break_period
    let auto_start_breaks = req.body.auto_start_breaks
    let auto_start_pomodoros = req.body.auto_start_pomodoros
    let alarm_sound = req.body.alarm_sound
    let alarm_volume = req.body.alarm_volume;
    let alarm_sound_type = req.body.alarm_sound_type;
    let notification = req.body.notification;

    db.query('UPDATE settings SET pomodoro_work_period = ?, pomodoro_break_period = ?, auto_start_breaks = ?, auto_start_pomodoros = ?, alarm_sound = ?, notification = ?, alarm_sound_type = ?, alarm_volume = ? WHERE user_id = ?', [pomodoro_work_period, pomodoro_break_period, auto_start_breaks, auto_start_pomodoros, alarm_sound, notification, alarm_sound_type, alarm_volume, userId]).then((result) => {
        res.send({
            err: false,
        });
    }).catch((e) => {
        console.log(e);

        res.send({
            err: true,
        });
    });
});

//Miguel
app.get('/tasks/get', authenticated, (req, res) => {
    db.query('SELECT * FROM todo WHERE user_id = ?', [req.userId]).then((result) => {
        if (typeof (result[0][0]) === "undefined") {
            res.send({
                err: false,
                todo: []
            });
        }else {
            res.send({
                err: false,
                todo: result[0]
            });
        }
    }).catch((e) => {
        res.send({
            err: true,
        });
    });
})

//BODS
app.post('/tasks/create', authenticated, (req, res) => {
    let userId = req.userId;
    let task_name = req.body.task_name;
    let completed = false;
    let taskId = uniqid('task-');

    db.query('INSERT INTO todo(user_id, task_name, completed, task_id) VALUES(?,?,?,?)', [userId, task_name, completed, taskId]).then((result) => {
        res.send({
            err: false,
            taskId: taskId,
            taskName: task_name
        });
    }).catch((e) => {
        console.log(e);
    
        res.send({
            err: true
        });
    });
});

//Dilan

app.post('/tasks/update', authenticated, (req,res) => {
    let completed = req.body.completed;
    let taskId = req.body.task_id;

    db.query('UPDATE todo SET completed = ? WHERE task_id = ?', [completed, taskId]).then((result) => {
        res.send({
            err: false
        });
    }).catch((e) => {
        console.log(e);
        res.send({
            err: true
        });
    });
});

//MIGUEL 2
app.delete('/tasks/:id', authenticated, (req, res) => {
    let taskId = req.params.id;
    
    db.query('DELETE FROM todo WHERE task_id = ?', [taskId]).then((result) => {
        res.send({
            err: false
        });
    }).catch((e) => {
        res.send({
            err: true
        });
    });
});

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("743986243727-2gli5fqucoe4cpj7p7h1sh87injnerc1.apps.googleusercontent.com");

app.post('/api/login/google', async (req,res) => {
    const ticket = await client.verifyIdToken( {
        idToken: req.body.token,
        audience: "743986243727-2gli5fqucoe4cpj7p7h1sh87injnerc1.apps.googleusercontent.com"
    }).catch((e) => {
        console.log(e);
        res.send({
            success: false
        });
    });

    if (!req.requestCountryCode) {
        req.requestCountryCode = 'GB';
    }

    if(ticket.getPayload()) {
        let dbResponse = await db.query("SELECT * FROM users WHERE email = ?", [ticket.getPayload().email]).catch((e) => {
            console.log(e);
        });

        if(typeof(dbResponse[0][0]) !== "undefined") {
            jwt.sign({
                userId: dbResponse[0][0].id
            }, jwtSecret, function (err, token) {
                if (err) {
                    res.json({
                        success: false
                    });
                    console.log(err);
                    return;
                }

                res.cookie('token', token);
                res.json({
                    success: true
                });
            });

            let lastLogin = new Date(dbResponse[0][0].last_logged_in);

            let currentDate = new Date();
            if (lastLogin.getDate() != currentDate.getDate()) {
                if ((lastLogin.getDate() + 1) === currentDate.getDate()) {
                    // streak
                    db.query("UPDATE users SET streak=streak+1, last_logged_in = ?, unique_logins=unique_logins+1 WHERE id = ?", [currentDate, dbResponse[0][0].id]).catch((e) => {
                        console.log(e);
                    });
                } else {
                    // reset streak
                    db.query("UPDATE users SET streak=1, last_logged_in = ?, unique_logins=unique_logins+1 WHERE id = ?", [currentDate, dbResponse[0][0].id]).catch((e) => {
                        console.log(e);
                    });
                }
            }
        } else {
            const userId =  uniqid();
            db.query("INSERT INTO users(email, username, id, location) VALUES(?,?,?,?)", [ticket.getPayload().email, ticket.getPayload().name, userId, req.requestCountryCode]).then((result) => {
                jwt.sign({
                    userId: userId
                }, jwtSecret, function (err, token) {
                    if (err) {
                        res.json({
                            success: false
                        });
                        console.log(err);
                        return;
                    }

                    res.cookie('token', token);
                    res.json({
                        success: true
                    });
                });
            }).catch((err) => {
                console.log(err);
                res.json({
                    success: false,
                    reason: "DB Request Error"
                });
            })
        }
    } else {
        res.send({
            success: false
        });
    }
});

app.get('/api/generateTestData', async (req,res) => {
    let allUsers = await db.query('SELECT * from users');

    for(let userIndex in allUsers[0]) {
        let user = allUsers[0][userIndex];
        

        // generate random sessions
        let randomSessionsCount = Math.floor(Math.random() * 10);
        for(let i = 0; i < randomSessionsCount; i++) {
            await db.query('INSERT INTO sessions(id, user_id, time, completed) VALUES(?,?,?,?)', [uniqid('session-'), user.id, Math.floor(Math.random() * 36000) + 360, Math.random() < 0.5]).then((result) => {
                console.log("added test data");
            }).catch((e) => {
                console.log(e);
            });
        }
    }

    console.log("done");
    res.send("done");
});

app.get('/api/analytics', authenticated, async (req,res) => {
    
    let userStats = await db.query('SELECT streak, unique_logins FROM users WHERE id = ?', [req.userId]).catch((e) => {
        console.log(e);
    });

    if(typeof(userStats) === "undefined") {
        res.json({
            success: false
        });
        return;
    }

    // leaderboard
    let leaderboardData = await db.query('SELECT users.username, users.location, SUM(sessions.time) AS total_time FROM sessions INNER JOIN users ON users.id = sessions.user_id GROUP BY sessions.user_id ORDER BY total_time DESC LIMIT 0,25').catch((e) => {
        console.log(e);
    });

    
    if(typeof(leaderboardData) === "undefined") {
        res.json({
            success: false
        });
        return;
    }

    let sessionsData = await db.query('SELECT * FROM sessions WHERE user_id = ?', [req.userId]).catch((e) => {
        console.log(e);
    });

    if(typeof(sessionsData) === "undefined") {
        res.json({
            success: false
        });
        return;
    }

    res.json({
        success: true,
        user: userStats[0][0],
        sessions: sessionsData[0],
        leaderboard: leaderboardData[0]
    })
});

const fs = require('fs');

app.get('/app', authenticated, (req, res) => {
    let timerPage = fs.readFileSync(path.join(__dirname, '/public/Timer.html'));

    db.execute('SELECT username FROM users WHERE id = ?', [req.userId]).spread((rows) => {
        res.send(timerPage.toString().replace('{{ username }}', rows[0].username));
    }).catch((err) => {
        // assume invalid token, clear jwt
        res.clearCookie('token');
        res.redirect('/');
    })
   
})

app.server = app.listen(80, () => {
    console.log("Listening on port *:80");
})

module.exports = {
    db: db,
    app: app
}