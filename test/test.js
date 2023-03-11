var assert = require('assert');

const request = require('supertest');
const { app, db } = require('../main');

describe('Database', () => {
    it('should return amount of users', (done) => {
        db.execute('SELECT COUNT(*) AS user_count FROM users').then((rows) => {
            assert.notStrictEqual(typeof(rows[0][0].user_count), "undefined");
            done();
        }).catch((err) => {
            done(err);
        });
    });
});

describe('REST API (Unauthenticated)', function() {
    this.timeout(1000);
    describe('POST /register', () => {
        it('return a JSON Object containing "success" and it should equal true', (done) => {
            request(app)
                .post('/register')
                .send({
                    email: "test@test.com"
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.success, true);
                    done();
                });
        });

        it('return a JSON object with "success" equal to false and "reason" equal to "E-mail already exists."', (done) => {
            request(app)
                .post('/register')
                .send({
                    email: "test@test.com"
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.success, false);
                    assert.strictEqual(res.body.reason, "E-mail already exists.");
                    done();
                });            
        });
        describe('POST /register/finishRegister', () => {
            it('return a JSON Object containing "success" and it should equal true and set cookie', (done) => {
                db.execute('SELECT register_token FROM users WHERE email = "test@test.com"').then((rows) => {
                    const register_token = rows[0][0].register_token;
                    request(app)
                    .post('/register/finishRegister')
                    .send({
                        register_token: register_token,
                        password:"testpass1",
                        username:"testuser2"
                    })
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect('set-cookie', /token/)
                    .end(function(err, res) {
                        if(err) {
                            return done(err);
                        }
                        assert.strictEqual(res.body.success, true);
                        done();
                    });
                }).catch((err) => {
                    done(err);  
                });
            });
        });
    });

    describe('POST /login', () => {
        it('return a JSON Object containing "success" and it should equal true and sets user cookie', (done) => {
            request(app)
                .post('/login')
                .send({
                    email: "test@test.com",
                    password:"testpass1"
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect('set-cookie', /token/)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.success, true);
                    done();
                });
        });
    });

    describe('POST /reset-password', () => {
        it('return a JSON Object containing "success" and it should equal true', (done) => {
            request(app)
                .post('/reset-password')
                .send({
                    email: "test@test.com"
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.success, true);
                    done();
                });
        });
        
    describe('POST /reset-password/finish', () => {
        it('return a JSON Object containing "success" and it should equal true', (done) => {
                db.execute('SELECT reset_token FROM users WHERE email = "test@test.com"').then((rows) => {
                    const reset_token = rows[0][0].reset_token;
                    request(app)
                    .post('/reset-password/finish')
                    .send({
                        reset_token: reset_token,
                        password:"testpass123"
                    })
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if(err) {
                            return done(err);
                        }
                        assert.strictEqual(res.body.success, true);
                        done();
                    });
                }).catch((err) => {
                    done(err);  
                });
            });
        });
    });
    after((done) => {
        db.execute('DELETE FROM users WHERE email = "test@test.com"').then((rows) => {
            done();
        }).catch((err) => {
            console.log(err);
        })
    });
});

describe('REST API (Authenticated)', function() {
    this.timeout(1000);
    let cookie = "";
    beforeEach((done) => {
        // Grab a JWT token in order to do authenticated requests.
        request(app)
        .post('/login')
        .send({email: "test@example.com", password: "testing"})
        .end(function(err ,res) {
            if(err) {
                return done(err);
            }

            if(res.body.success) {
                if(typeof(res.headers['set-cookie'][0]) !== "undefined") {
                    cookie = res.headers['set-cookie'][0];
                    done();
                } else {
                    done(new Error("Unable to parse cookie"));
                }
            } else {
                done(new Error("Server returned an error when getting JWT"));
            }
        })
    });
    // save these unique values to be edited later
    let sessionId = "";
    let taskId = "";
    describe('POST /analytics/createSession', () => {
        it('returns the session id', (done) => {
            request(app)
                .post('/analytics/createSession')
                .send()
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    sessionId = res.body.sessionId;
                    assert.strictEqual(res.body.err, false);
                    done();
                });
        })
    });
    describe('POST /analytics/updateSession', () => {
        it('should return err: false', (done) => {
            request(app)
                .post('/analytics/updateSession')
                .send({
                    sessionId: sessionId,
                    time: 100,
                    completed: true
                })
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    done();
                });
        })
    });
    describe('GET /settings/get', () => {
        it('should return err: false and with the users settings', (done) => {
            request(app)
                .get('/settings/get')
                .send()
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    assert.notStrictEqual(typeof(res.body.settings), "undefined");
                    done();
                });
        })
    });
    describe('POST /settings/update', () => {
        it('should return err: false', (done) => {
            request(app)
                .post('/settings/update')
                .send({
                    pomodoro_work_period: 10,
                    pomodoro_break_period: 5,
                    auto_start_breaks: true,
                    auto_start_pomodoros: false,
                    alarm_sound: true,
                    alarm_volume: 50,
                    alarm_sound_type: 2,
                    notification: true
                })
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    done();
                });
        })
    });
    describe('GET /tasks/get', () => {
        it('should return err: false and todo list', (done) => {
            request(app)
                .get('/tasks/get')
                .send()
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    assert.notStrictEqual(typeof(res.body.todo), "undefined");
                    done();
                });
        })
    });
    describe('POST /tasks/create', () => {
        it('should return err: false and task ID', (done) => {
            request(app)
                .post('/tasks/create')
                .send({
                    task_name: "Test Task!"
                })
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    assert.notStrictEqual(typeof(res.body.taskId), "undefined");
                    taskId = res.body.taskId;
                    done();
                });
        })
    });
    describe('POST /tasks/update', () => {
        it('should return err: false', (done) => {
            request(app)
                .post('/tasks/update')
                .send({
                    task_id: taskId,
                    completed: true
                })
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    done();
                });
        })
    });
    describe('DELETE /tasks/:id', () => {
        it('should return err: false', (done) => {
            request(app)
                .delete(`/tasks/${taskId}`)
                .send()
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.err, false);
                    done();
                });
        })
    });
    describe('GET /api/analytics', () => {
        it('should return success: true and all the users analytics', (done) => {
            request(app)
                .get(`/api/analytics`)
                .send()
                .set('Accept', 'application/json')
                .set('cookie', cookie)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if(err) {
                        return done(err);
                    }
                    assert.strictEqual(res.body.success, true);
                    assert.notStrictEqual(typeof(res.body.user), "undefined");
                    assert.notStrictEqual(typeof(res.body.sessions), "undefined");
                    assert.notStrictEqual(typeof(res.body.leaderboard), "undefined");
                    done();
                });
        })
    });
});

after((done) => {
    done();
});