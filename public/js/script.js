$(document).ready(function() {
    $('#loginForm').submit((e) => {
        e.preventDefault();
        $.post({
            url: "/login",
            data: JSON.stringify({
                "email": $('#loginEmail').val(),
                "password": $('#loginPassword').val()
            }),
            contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            try{
                if(!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: data.reason,
                      })
                } else {
                    location.href="/app";
                }
            } catch(e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Unknown Error has occured.',
                  })
                console.log(e);
            }
        })
    });

    $('#registerForm').submit((e) => {
        e.preventDefault();
        $.post({
            url: "/register",
            data: JSON.stringify({
                email: $('#registerEmail').val()
            }),
            contentType: 'application/json; charset=utf-8'    
        }, function(data, status) {
            try{
                if(!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: data.reason,
                      })
                } else {
                    location.href="/activate";
                }
            } catch(e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Unknown Error has occured.',
                  })
            }
        });
    });

    $('#finishRegisterForm').submit((e) => {
        e.preventDefault();

        let username = $('#finishRegisterUsername').val();
        let password = $('#finishRegisterPassword').val();
        let conf_password = $('#finishRegisterConfPassword').val();
        // hack
        let register_token = window.location.href.split('/')[4];
        if(password != conf_password) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Passwords must match!',
              });
            return;
        }

        if(username.length < 4) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Username must be more than 4 characters.',
              });
            return;
        }
        $.post({
            url: "/register/finishRegister",
            data: JSON.stringify({
                username: username,
                password: password,
                register_token: register_token
            }),
            contentType: 'application/json; charset=utf-8'    
        }, function(data, status) {
            try{
                if(!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: data.reason,
                      })
                } else {
                    location.href="/app";
                }
            } catch(e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Unknown Error has occured.',
                  })
            }
        });
        return;
    })

    $('#forgotPasswordForm').submit((e) => {
        e.preventDefault();
        $.post({
            url: "/reset-password",
            data: JSON.stringify({
                email: $('#forgotPasswordEmail').val()
            }),
            contentType: 'application/json; charset=utf-8'    
        }, function(data, status) {
            try{
                if(!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: data.reason,
                      })
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: "Please check your e-mail for a link to reset your password!",
                      })
                }
            } catch(e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Unknown Error has occured.',
                  })
            }
        });
        return;
    });

    $('#finishPasswordForm').submit((e) => {
        e.preventDefault();
        let password = $('#finishPasswordPass').val();
        let password_conf = $('#finishPasswordConfPass').val();
        let reset_token = window.location.href.split('/')[4];
        if(password.length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Password must be more than 8 characters!',
              });
              return;
        }
        if(password !== password_conf) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Passwords must match!',
              })
              return;
        }
        $.post({
            url: "/reset-password/finish",
            data: JSON.stringify({
                password: password,
                reset_token: reset_token
            }),
            contentType: 'application/json; charset=utf-8'    
        }, function(data, status) {
            try{
                if(!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: data.reason,
                      })
                } else {
                    location.href = "/login";
                }
            } catch(e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Unknown Error has occured.',
                  })
            }
        });
        return;
    });
});


function onSignIn(googleUser) {
    $.post({
        url: "/api/login/google",
        data: JSON.stringify({
            token: googleUser.getAuthResponse().id_token
        }),
        contentType: 'application/json; charset=utf-8'
    }, function (data, status) {
        if(data.success) {
            location.href="/app"
        } else {
            Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: data.reason,
            })
        }
    })
}