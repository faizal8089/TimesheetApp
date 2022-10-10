const bcrypt = require("bcrypt");

const passwordHash = (password, callback) => {
  let passHash;
  const saltRounds = 10;
  bcrypt
    .genSalt(saltRounds)
    .then(async (salt) => {
      return bcrypt.hash(password, salt);
    })
    .then((hash) => {
      passHash = hash;
      callback(hash);
    })
    .catch((err) => console.error(err.message));
};

//password compare

async function passwordCompare(EnteredPassword, fromDB, callback) {
  const auth = await bcrypt.compare(EnteredPassword, fromDB);
  callback(auth);
}

// export default passwordHash;
module.exports = { passwordCompare, passwordHash };
