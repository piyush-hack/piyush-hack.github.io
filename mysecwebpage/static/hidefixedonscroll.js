window.onscroll = function (e) {
//     console.log(window.scrollY); // Value of scroll Y in px
    if(window.scrollY > 500){
        
        // document.getElementsByClassName("fd_content")[0].style.display="none";
        // document.getElementsByClassName("fd_content")[1].style.display="none";

        $(".fd_content").hide(500);

    }else{
        // document.getElementsByClassName("fd_content")[0].style.display="block";
        // document.getElementsByClassName("fd_content")[1].style.display="block";

        $(".fd_content").show(500);

    }


    if(window.scrollY > 400){
        $(".con2").css('z-index', 0);
    }else{
        $(".con2").css('z-index', 1030);
    }
};


// $("#toogle_nav").click(function () {
//   $(".alloptions").toggle(1000);
// });
