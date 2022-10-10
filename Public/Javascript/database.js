const sql = require("mssql/msnodesqlv8");

const { passwordCompare, passwordHash } = require("./passwordHash");

//SQL query Functions

async function SqlQuery(server, database, port, query, callback) {
  const pool = new sql.ConnectionPool({
    server: `${server}`,
    port: port,
    database: `${database}`,
    options: {
      trustedConnection: true,
    },
  });
  await pool.connect();
  const request = new sql.Request(pool);
  try {
    const result = await request.query(query);
    // console.log(result.recordset[0]);
    callback(result);
  } catch (err) {
    // console.log("error");
    pool.close();
    callback(err);
  }
  pool.close();
}

// Query's

function addAuthenticationData(password, empId, profileLock, email) {
  const query = `insert into Authentication values ('${password}', '${empId}', '${profileLock}', '${email}');`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    // console.log(res);
  });
}

function addEmpDetails(
  empId,
  fName,
  lName,
  emailAddress,
  DOB,
  gender,
  position,
  password,
  profileLock,
  callback
) {
  const query = `insert into EmpDetails values ('${empId}', '${fName}', '${lName}', '${emailAddress}', '${DOB}', '${gender}', '${position}')`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false, "mail id already exists !");
    } else {
      if (res.rowsAffected[0] != 1) {
        callback(false, "cannot register");
      } else {
        callback(true, "registration sucess !");
      }
    }
  });
  passwordHash(password, (res) => {
    addAuthenticationData(
      `${res}`,
      `${empId}`,
      `${profileLock}`,
      `${emailAddress}`
    );
  });
}

// checking validity of login credentials

function checkAuthentication(email, passWord, callback) {
  const query = `select * from Authentication where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (result) => {
    if (result.recordset[0] === undefined) {
      callback(false, "no user data found");
    } else {
      if (result.recordset[0].profileLock === true) {
        callback(false, "profile locked ! Contact admin...");
      } else {
        passwordCompare(passWord, result.recordset[0].passWord, (res) => {
          if (res) {
            callback(true, "sucess");
          } else {
            callback(false, "login credentials are incorrect !");
          }
        });
      }
    }
  });
}
//register Employee

function AuthlockProfile(email, callback) {
  const query = `UPDATE Authentication
  SET profileLock = 1
  WHERE email = '${email}';`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (result) => {
    if (result instanceof Error) {
      // console.log("profile locked");
      callback(false);
    } else {
      callback(true);
    }
  });
}

// check EmpId present or not
function checkEmpEmail(email, callback) {
  const query = `SELECT emailAddress FROM EmpDetails WHERE emailAddress = '${email}';`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    callback(res.recordset.length > 0);
  });
}

function fetchEmployeeDetails(email, callback) {
  const query = `SELECT * FROM EmpDetails WHERE emailAddress = '${email}';`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    callback(res.recordset[0]);
  });
}

function checkIn(empId, email) {
  //day
  let todayDate = new Date().toISOString().slice(0, 10);
  // checkIn time

  let checkIn = new Date().toISOString();

  // checkOut time
  const query = `insert into Attendance values ('${empId}', '${todayDate}', '${checkIn}', '${checkIn}', '${email}', '1') `;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {});
}

function checkOut(email) {
  // checkOut time
  let checkOut = new Date().toISOString();
  // let checkOut = new Date().toString().slice(16, 24);
  const query = `update Attendance set checkOut = '${checkOut}', checked = '0' where email = '${email}' AND checked='1' AND workingDay = '${new Date()
    .toISOString()
    .slice(0, 10)}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {});
}

function fetchBtnStatus(email, callback) {
  const query = `select checked from Attendance where email = '${email}' AND checked = '1' AND workingDay = '${new Date()
    .toISOString()
    .slice(0, 10)}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    callback(res.recordset);
  });
}

function fetchAttendance(email, callback) {
  const query = `select * from Attendance where email = '${email}' ORDER BY checkIn ASC`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback([]);
    }
    callback(res.recordset);
  });
}
function fetchAttendanceToday(email, callback) {
  const query = `select * from Attendance where email = '${email}' AND workingDay = '${new Date()
    .toISOString()
    .slice(0, 10)}' ORDER BY checkIn ASC`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback([]);
    }
    callback(res.recordset);
  });
}

function fetchDuration(email, callback) {
  const query = `select distinct workingDay, sum(DATEDIFF(MILLISECOND, checkIn, checkOut)) as duration from Attendance where email = '${email}' group by workingDay order by workingDay ASC`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (!res instanceof Error) {
      callback([]);
    } else {
      callback(res.recordset);
    }
  });
}

function addAuthCode(email, code, callback) {
  const query = `insert into AuthCode values('${email}', '${code}')`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

function fetchAuthCode(email, callback) {
  const query = `select authCode from AuthCode where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(null);
    } else {
      callback(res.recordset[0].authCode);
    }
  });
}

// function updateAuthCode(email, code, callback) {
//   const query = `update AuthCode set authCode = '${code}' where email = '${email}'`;
//   SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
//     if (res instanceof Error) {
//       callback(false);
//     } else {
//       callback(true);
//     }
//   });
// }
function removeFromAuthCode(email, callback) {
  const query = `delete from AuthCode where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

function insertTolockProfile(email, count, callback) {
  const query = `insert into lockProfile values ('${email}', ${count})`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}
function updateLockProfile(email, count, callback) {
  const query = `update lockProfile set lockCount = ${count} where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}
function fetchCountlockProfile(email, callback) {
  const query = `select lockCount from lockProfile where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(null);
    } else {
      callback(res.recordset[0].lockCount);
    }
  });
}

function deleteFromlockProfile(email, callback) {
  const query = `delete from lockProfile where email = '${email}'`;
  SqlQuery("5C\\SQLEXPRESS", "kovenantz", 5000, query, (res) => {
    if (res instanceof Error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// exports
module.exports = {
  checkAuthentication,
  fetchAttendance,
  fetchAttendanceToday,
  checkIn,
  checkOut,
  fetchEmployeeDetails,
  AuthlockProfile,
  checkEmpEmail,
  addEmpDetails,
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
};
