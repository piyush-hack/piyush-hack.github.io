$(function () {
  $("#projects").load("myprojects.html");
});

$(function () {
  $("#internships").load("myinternships.html");
});

$(function () {
  $("#skills").load("myskills.html");
});

$(function () {
    $(".part").hide();
  });

var show = get("show");
console.log("get show is :" , show);
var display = "#projects";
if(show != undefined){
    display = "#" + show;
}

console.log(display)
// document.getElementById(show).style.display = "block";
$(function () {
    $(display).toggle();
});

function get(name) {
  if (
    (name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(
      location.search
    ))
  )
    return decodeURIComponent(name[1]);
}
