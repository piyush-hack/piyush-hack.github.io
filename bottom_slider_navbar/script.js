$(document).ready(function () {
  var $slider = $("nav .slider"),
    width = $("nav ul li").width;

  $slider.width(width);
});

var isactivated = get("x");
console.log(isactivated);

if (!isactivated) {
  isactivated = "ra";
}

$(`.${isactivated}`).addClass("isactive isactivated");

$(window)
  .resize(function () {
    var $slider = $("nav .slider"),
      width = $("nav ul li").width,
      $isActive = $("nav ul li.isactivated"),
      $isX = $isActive.position().left,
      $isW = $isActive.width();
    $slider.css({ left: $isX, width: $isW });

    $slider.width(width);

    $("nav ul li").each(function () {
      var x = $(this).position().left,
        w = $(this).width();
      $(this).on({
        mouseenter: function () {
          $slider.css({ left: x, width: w });
          $("nav ul li").removeClass("isactive");
          $(this).addClass("isactive");
        },
        mouseleave: function () {
          $slider.css({ left: $isX, width: $isW });
          $("nav ul li").removeClass("isactive");
        },
      });
    });
  })
  .resize();

function get(name) {
  if (
    (name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(
      location.search
    ))
  )
    return decodeURIComponent(name[1]);
}
