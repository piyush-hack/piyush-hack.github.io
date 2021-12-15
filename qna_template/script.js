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
console.log("here");

$(window)
  .resize(function () {
    var $slider = $("nav .slider"),
      width = $("nav ul li").width,
      $isActive = $("nav ul li.isactivated"),
      isX = $isActive.position().left,
      isW = $isActive.width();
    $slider.css({ left: isX, width: isW });

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
          $slider.css({ left: isX, width: isW });
          $("nav ul li").removeClass("isactive");
        },
      });
    });
  })
  .resize();

$("nav ul li").on("click", function () {
  $("nav ul li").removeClass("isactivated");
  $(this).addClass("isactivated");
});



$(".counter").each(function () {
  var $this = $(this),
    countTo = $this.attr("data-count");

  $({ countNum: $this.text() }).animate(
    {
      countNum: countTo,
    },

    {
      duration: countTo*100,
      easing: "linear",
      step: function () {
        $this.text(Math.floor(this.countNum));
      },
      complete: function () {
        $this.text(this.countNum);
        //alert('finished');
      },
    }
  );
});


$('.trigger').on('click' , function () { 

  if($(this).hasClass('show')){
    $('.leftmc .pageinfo').css("transform" , 'translateX(300px)');
    $(this).removeClass("show");
    $(this).addClass("hide");
    $(this).children('i').removeClass("fa-bars");
    $(this).children('i').addClass("fa-times");

  }else{
    $('.leftmc .pageinfo').css("transform" , 'translateX(-300px)');
    $(this).removeClass("hide");
    $(this).addClass("show");
    $(this).children('i').removeClass("fa-times");
    $(this).children('i').addClass("fa-bars");
  }

 })


function get(name) {
  if (
    (name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(
      location.search
    ))
  )
    return decodeURIComponent(name[1]);
}
