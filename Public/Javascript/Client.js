function disableCheckIn() {
  sessionStorage.setItem("checkIn", "true");
  sessionStorage.setItem("checkOut", "false");
}
function disableCheckOut() {
  sessionStorage.setItem("checkIn", "false");
  sessionStorage.setItem("checkOut", "true");
}

function removeValues() {
  sessionStorage.removeItem("checkIn");
  sessionStorage.removeItem("checkOut");
  sessionStorage.clear();
}

if (sessionStorage.getItem("checkIn") === "true") {
  document.getElementById("checkIn").disabled = true;
} else {
  document.getElementById("checkIn").disabled = false;
}
if (sessionStorage.getItem("checkOut") === "true") {
  document.getElementById("checkOut").disabled = true;
} else {
  document.getElementById("checkOut").disabled = false;
}
