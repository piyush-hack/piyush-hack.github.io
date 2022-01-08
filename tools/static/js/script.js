var nodown = 0;
var totalimgs = 0;
imgInp.onchange = async (evt) => {
  var files = imgInp.files;
  document.getElementById("loader").style.display = "block";

  setTimeout(async () => {
    if (files) {
      var k,
        j,
        temporary,
        chunk = parseInt($("#chunks").val());

      if ($("#chunks").val() == undefined) {
        chunk = 70;
      }

      totalimgs += files.length;
      for (k = 0, j = files.length; k < j; k += chunk) {
        // temporary = files.slice(k, k + chunk);
        temporary = Object.keys(files)
          .slice(k, k + chunk)
          .reduce((result, key) => {
            result[key] = files[key];

            return result;
          }, {});
        // do whatever
        let capdiv = document.createElement("div");
        capdiv.setAttribute("id", "capdiv" + nodown);
        capdiv.setAttribute(
          "class",
          document.getElementById("vercol").value + " vh"
        );


        for (var i = 0; i <= Object.keys(temporary).length; i++) {
          if (i == Object.keys(temporary).length) {
            break;
          }
          for (let w = 0; w < parseInt($("#timer").val()); w++) {
            document.getElementById("loader").style.display = "block";
            console.log("waiting");
          }
          var FR = new FileReader();
          await FR.addEventListener("load", async (e) => {
            async function setsrc(e) {
              let img = document.createElement("img");
              img.setAttribute("class", "tempimg listitemClass");
              img.setAttribute("id", "imageNo" + i + k);
              img.src = e.target.result;
              await capdiv.appendChild(img);
              return true;
            }
            await setsrc(e);
          });
          await FR.readAsDataURL(temporary[i + k]);
        }

        document.getElementById("capture").appendChild(capdiv);

        console.log(capdiv);
        nodown++;
      }
      sortimgs();
    }

    var allbtns = "";
    for (let x = 0; x < nodown; x++) {
      allbtns += `<button id="foo${x}" class="btn btn-primary" onclick="downloaddiv(this.id)">Image ${
        x + 1
      }</button> &nbsp;`;
    }
    document.getElementById("download").innerHTML = allbtns;
    document.getElementById("loader").style.display = "none";

    console.log(totalimgs);
    if (totalimgs <= 50) {
      document.getElementById("dr").style.display = "block";
    }else{
      document.getElementById("dr").style.display = "none";

    }

  }, 2000);
};

function downloaddiv(divid) {
  domtoimage
    .toBlob(document.getElementById(`capdiv${divid.slice(3)}`))
    .then(function (blob) {
      window.saveAs(blob, `${$("#filename").val() + divid.slice(3)}.png`);
    });
}

const numInputs = document.querySelectorAll("input[type=number]");

numInputs.forEach(function (input) {
  input.addEventListener("change", function (e) {
    if (e.target.value == "") {
      e.target.value = 70;
    }
  });
});

const required = document.querySelectorAll(".required");

required.forEach(function (input) {
  input.addEventListener("change", function (e) {
    if (e.target.value == "") {
      e.target.value = "mydownload";
    }
  });
});

const orien = document.getElementById("vercol");

orien.addEventListener("change", function (e) {
  if (e.target.value == "") {
    e.target.value = "vertically";
  }

  $(".vh").each((vhd) => {
    if (e.target.value == "horizontally") {
      if (vhd.hasClass("vertically")) {
        vhd.removeClass("vertically");
        vhd.addClass("horizontally");
      }
    }

    if (e.target.value == "vertically") {
      if (vhd.hasClass("horizontally")) {
        vhd.removeClass("horizontally");
        vhd.addClass("vertically");
      }
    }
  });
});

function sortimgs() {
  $(function () {
    $(".vh").sortable({
      update: function (event, ui) {
        getIdsOfImages();
      }, //end update
    });
  });

  function getIdsOfImages() {
    var values = [];
    $(".listitemClass").each(function (index) {
      // values.push($(this).attr("id").replace("imageNo", ""));
    });

    $("#outputvalues").val(values);
  }
}

$("#download-image").on("click", function () {
  // For IE 10 & 11
  try {
    if (typeof window.navigator.msSaveBlob === "function")
      window.navigator.msSaveBlob(
        new Blob([__CANVAS.msToBlob()], { type: "image/png" }),
        $("#pdf").prop("files")
      );
    else
      $(this).attr("href", __CANVAS.toDataURL()).attr("download", "page.png");
  } catch (error) {
    alert(error);
  }
});

var stickySidebar = $(".stickybar").offset().top;

$(window).scroll(function () {
  if ($(window).scrollTop() > stickySidebar) {
    $(".stickybar").addClass("affix");
  } else {
    $(".stickybar").removeClass("affix");
  }
});

var intervalId; // keep the ret val from setTimeout()

function zoom(param) {
  if (param == "+") {
    intervalId = setInterval(zoomin, 100);
  } else {
    intervalId = setInterval(zoomout, 100);
  }
}

function stopzoom() {
  clearInterval(intervalId);
}

function zoomin() {
  var prevWidth = $("#capture").width();
  $("#capture").width($("#capture").width() + 10);

  if ($("#capture").width() == prevWidth) {
    return;
  }
  $("#zoomcount").html(parseInt($("#zoomcount").html()) + 1);
}

function zoomout() {
  var prevWidth = $("#capture").width();

  $("#capture").width($("#capture").width() - 10);
  if ($("#capture").width() == prevWidth) {
    return;
  }
  $("#zoomcount").html(parseInt($("#zoomcount").html()) - 1);
}

function tobottom() {
  $("html,body").animate(
    { scrollTop: $("html").height() - $(window).height() },
    3000,
    "easeInOutQuad"
  );
}

function totop() {
  $("html,body").animate({ scrollTop: 0 }, 1000, "easeInOutQuad");
}

document.getElementById("dr").onclick = async function () {
  var options = {
    margin: 0,
    filename: `${$("#filename").val()}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  var oldwidth = $("#capture").width(600);
  $("#capture").css("max-width", "100vw");

  $("#capture").css("width", "100%");

  var pdf_content = document.getElementById("capture");
  document.getElementById("loader").style.display = "block";

  setInterval(async () => {
    try {
      await html2pdf(pdf_content, options);
      setTimeout(() => {
        $("#capture").css("max-width", "90vw");

        $("#capture").width(oldwidth);
        document.getElementById("loader").style.display = "none";

        window.location.href = window.location.href;
      }, totalimgs * 100);
    } catch (error) {
      alert(error);
      console.log(error);
    }
  }, 2000);
};
