// imports

const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const {
  checkAuthentication,
  fetchAttendance,
  checkIn,
  checkOut,
  fetchAttendanceToday,
  AuthlockProfile,
  checkEmpEmail,
  addEmpDetails,
  fetchEmployeeDetails,
  fetchDuration,
  fetchBtnStatus,
  addAuthCode,
  removeFromAuthCode,
  // updateAuthCode,
  fetchAuthCode,
  insertTolockProfile,
  updateLockProfile,
  fetchCountlockProfile,
  deleteFromlockProfile,
} = require("./Public/Javascript/database");

const app = express();
const port = 3000;

app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: false }));
app.set("view-engine", "ejs");
const oneDay = 1000 * 60 * 60 * 24;
app.use(cookieParser());

var session = {
  secret: "secretKey",
  saveUninitialized: false,
  cookie: { maxAge: oneDay, secure: false },
  resave: false,
};

app.use(sessions(session));

app.post("/sendCode", (req, res) => {
  code = (Math.random() + 1).toString(36).substring(7);
  const nodemailer = require("nodemailer");
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "faizalsulthan88@gmail.com",
      pass: "asynkqhykimmgfky",
    },
  });

  var mailOptions = {
    from: "faizalsulthan88@gmail.com",
    to: `${req.body.emailId}`,
    subject: "your Auth code",
    text: `yout auth code is : ${code}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      // console.log("Email sent: " + info.response);
      let password = req.body.password;
      let fName = req.body.fName;
      let lName = req.body.lName;
      let email = req.body.emailId;
      let empId = req.body.empId;
      let dob = req.body.dob;
      let position = req.body.position;
      addAuthCode(email, code, (response) => {
        if (response) {
          res.render("Registration.ejs", {
            loginErr: "code sent to email !",
            f_Name: fName,
            l_Name: lName,
            emailId: email,
            empId: empId,
            password: password,
            dob: dob,
            position: position,
          });
        } else {
          removeFromAuthCode(email, (respons) => {
            if (respons) {
              res.render("Registration.ejs", {
                loginErr: "code already sent ! click getCode to update",
                f_Name: fName,
                l_Name: lName,
                emailId: email,
                empId: empId,
                password: password,
                dob: dob,
                position: position,
              });
            }
          });
        }
      });
    }
  });
});

// render pages
app.get("/login", (req, res) => {
  req.session.destroy();
  res.render("login.ejs", {
    loginErr: "",
    emailValue: "",
    passValue: "",
  });
});

app.get("/report", (req, res) => {
  session = req.session;
  if (session.email && session.password) {
    fetchDuration(session.email, (response) => {
      res.render("Report.ejs", { data: response });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/registration", (req, res) => {
  res.render("Registration.ejs", {
    loginErr: "",
    f_Name: "",
    l_Name: "",
    emailId: "",
    empId: "",
    password: "",
    dob: "",
    position: "",
  });
});
//attendance
app.get("/attendance", (req, res) => {
  session = req.session;
  if (session.email && session.password) {
    fetchAttendanceToday(session.email, (response) => {
      res.render("Attendance.ejs", { data: response });
    });
  } else {
    res.redirect("/login");
  }
});
//render dashboard
app.get("/dashboard", (req, res) => {
  session = req.session;

  // console.log(req.session);
  // console.log(req);
  try {
    if (session.email && session.password) {
      fetchEmployeeDetails(session.email, (response) => {
        res.render("Dashboard.ejs", {
          empId: `${response.empId}`,
          name: `${response.fName + " " + response.lName}`,
          empName: `${response.fName}`,
          email: `${response.emailAddress}`,
          dob: `${response.DOB.toString().slice(4, 16)}`,
          gender: `${
            response.gender === "M"
              ? "Male"
              : response.gender === "F"
              ? "Female"
              : "Other"
          }`,
          position: `${response.Position}`,
        });
      });
    } else {
      res.redirect("/login");
    }
  } catch {
    res.redirect("/login");
  }
});

//logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// login post
app.post("/login", async (req, res) => {
  session = req.session;
  let email = req.body.email;
  let password = req.body.password;
  // session.email = req.body.email;
  // session.password = req.body.password;
  // console.log(session);

  try {
    checkAuthentication(email, password, (response, msg) => {
      if (response) {
        session.email = req.body.email;
        session.password = req.body.password;
        deleteFromlockProfile(session.email, (lockResponse) => {});
        res.redirect("/dashboard");
      } else {
        if (msg != "profile locked ! Contact admin...") {
          fetchCountlockProfile(email, (count) => {
            if (count === 1) {
              AuthlockProfile(email, (respons) => {
                deleteFromlockProfile(email, (lockResponse) => {});
                if (respons) {
                  // res.render("login.ejs", {
                  //   loginErr: "profile is now locked...!",
                  //   emailValue: email,
                  //   passValue: password,
                  // });
                  req.session.destroy();
                }
              });
            } else if (count === null) {
              insertTolockProfile(email, 0, (resCount) => {});
            } else {
              updateLockProfile(email, (count += 1), (resCount) => {});
            }
          });
        }
        res.render("login.ejs", {
          loginErr: msg,
          emailValue: email,
          passValue: password,
        });
      }
    });
  } catch {
    res.redirect("/login");
  }
});

//post register
app.post("/registration", (req, res) => {
  try {
    let password = req.body.password;
    let cnfpassword = req.body.cnfpassword;
    let fName = req.body.fName;
    let lName = req.body.lName;
    let email = req.body.emailId;
    let empId = req.body.empId;
    let dob = req.body.dob;
    let gender = req.body.gender;
    let position = req.body.position;
    if (password === cnfpassword) {
      // console.log("saving emp details !");
      //new part

      fetchAuthCode(email, (response) => {
        if (req.body.emailCode === response) {
          removeFromAuthCode(email, (res1) => {});
          addEmpDetails(
            empId,
            fName,
            lName,
            email,
            dob,
            gender,
            position,
            password,
            0,
            (response, msg) => {
              if (response) {
                res.redirect("/login");
              } else {
                // console.log(msg);
                res.render("Registration.ejs", {
                  loginErr: msg,
                  f_Name: fName,
                  l_Name: lName,
                  emailId: email,
                  empId: empId,
                  password: password,
                  dob: dob,
                  position: position,
                });
              }
            }
          );
        } else {
          res.render("Registration.ejs", {
            loginErr: "Auth code does not match !",
            f_Name: fName,
            l_Name: lName,
            emailId: email,
            empId: empId,
            password: password,
            dob: dob,
            position: position,
          });
        }
      });

      //new part end
    } else {
      res.render("Registration.ejs", {
        loginErr: "passwords do not match !",
        f_Name: fName,
        l_Name: lName,
        emailId: email,
        empId: empId,
        password: password,
        dob: dob,
        position: position,
      });
    }
  } catch (err) {
    console.log("error occured");
    console.log(err);
    res.render("Registration.ejs", {
      loginErr: "account already exists",
      f_Name: fName,
      l_Name: lName,
      emailId: email,
      empId: empId,
      password: password,
      dob: dob,
      position: position,
    });
  }
});

// attendance post

app.post("/checkIn", (req, res) => {
  session = req.session;
  if (session.email && session.password) {
    let email = session.email;
    fetchEmployeeDetails(session.email, (response) => {
      checkIn(response.empId, email);
      res.redirect("/attendance");
    });
  }
});
app.post("/checkOut", (req, res) => {
  session = req.session;
  if (session.email && session.password) {
    let email = session.email;
    checkOut(email);
    res.redirect("/attendance");
  }
});

//use static files
app.use(express.static("Public"));
app.use("/Scss", express.static(__dirname + "Public/Scss"));
app.use("/Javascript", express.static(__dirname + "Public/Javascript"));

app.listen(port, () => {
  console.log(`Example app listening on port  http://localhost:${port}/login`);
});
