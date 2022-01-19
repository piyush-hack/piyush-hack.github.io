// Switch to full page view so the Dark Mode toggle will be in the frame ^_^

// Fork it on Github: https://github.com/theHocineSaad/Neumorphism-JavaScript-Calculator-with-Dark-Mode

var brcount = 0;
for (var item of document.querySelectorAll(".style")) {
  item.addEventListener(
    "mousedown",
    function (evt) {
      evt.target.classList.add("styleOnClick");
    },
    false
  );
}

document.getElementById("clear").addEventListener("mousedown", function () {
  document.querySelector(".style").classList.add("styleOnClick");
  document.getElementsByTagName("svg")[0].setAttribute("width", "13px");
  document.getElementsByTagName("svg")[0].setAttribute("height", "13px");
});

document.addEventListener("mouseup", function () {
  for (var item of document.querySelectorAll(".style")) {
    item.classList.remove("styleOnClick");
  }
  document.getElementsByTagName("svg")[0].classList.remove("styleOnClick");
  document.querySelector(".style").classList.remove("styleOnClick");
  document.getElementsByTagName("svg")[0].setAttribute("width", "15px");
  document.getElementsByTagName("svg")[0].setAttribute("height", "15px");
});

const toolTip = document.querySelector(".tooltip");
window.addEventListener("mousemove", toolTipXY);
function toolTipXY(e) {
  let x = e.clientX,
    y = e.clientY;
  toolTip.style.top = y + 20 + "px";
  toolTip.style.left = x + 20 + "px";
}

document
  .getElementById("resultText")
  .addEventListener("mouseenter", function () {
    toolTip.setAttribute("style", "display: block");
  });

document
  .getElementById("resultText")
  .addEventListener("mouseleave", function () {
    toolTip.removeAttribute("style", "display: block");
  });

const result = document.getElementById("resultText");
const calculation = document.getElementById("calculationText");

function formula() {
  var calMath = "";
  calculation.textContent.split("").map((element) => {
    if (element === "x") {
      calMath += "*";
    } else {
      calMath += element;
    }
  });
  return calMath;
}

function calc(formula) {
  if (["+", "-", "x", "/"].includes(formula[formula.length - 1])) {
    formula = formula.slice(0, formula.length - 1);
  }

  return math.evaluate(formula);
}

function wrightNum(num) {
  calculation.textContent += num;
}

function op(btn) {
  if (calculation.textContent.length !== 0) {
    if (
      !["+", "-", "x", "/", "^"].includes(
        calculation.textContent[calculation.textContent.length - 1]
      )
    ) {
      if (brcount == 0) {
        result.textContent = calc(formula());
      }
      calculation.textContent += btn;
    }
  } else {
    // result.textContent =  calc(formula());
    calculation.textContent = calculation.textContent.slice(
      0,
      formula.length - 1
    );
    calculation.textContent += btn;
  }
}

document.getElementById("num0").addEventListener("click", function () {
  wrightNum(0);
});
document.getElementById("num1").addEventListener("click", function () {
  wrightNum(1);
});
document.getElementById("num2").addEventListener("click", function () {
  wrightNum(2);
});
document.getElementById("num3").addEventListener("click", function () {
  wrightNum(3);
});
document.getElementById("num4").addEventListener("click", function () {
  wrightNum(4);
});
document.getElementById("num5").addEventListener("click", function () {
  wrightNum(5);
});
document.getElementById("num6").addEventListener("click", function () {
  wrightNum(6);
});
document.getElementById("num7").addEventListener("click", function () {
  wrightNum(7);
});
document.getElementById("num8").addEventListener("click", function () {
  wrightNum(8);
});
document.getElementById("num9").addEventListener("click", function () {
  wrightNum(9);
});

document.getElementById("addition").addEventListener("click", function () {
  op("+");
});
document.getElementById("subtraction").addEventListener("click", function () {
  op("-");
});
document.getElementById("division").addEventListener("click", function () {
  op("/");
});

document.getElementById("fact").addEventListener("click", function () {
  op("!");
});

document.getElementById("pow").addEventListener("click", function () {
  op("^");
});
document.getElementById("sin").addEventListener("click", function () {
    calculation.textContent += "sin";
});
document.getElementById("cos").addEventListener("click", function () {
    calculation.textContent += "cos";
});
document.getElementById("tan").addEventListener("click", function () {
    calculation.textContent += "tan";
});
document.getElementById("openbr").addEventListener("click", function () {
  brcount++;
  calculation.textContent += "(";
});

document.getElementById("closebr").addEventListener("click", function () {
  brcount--;
  calculation.textContent += ")";
});
document.getElementById("complex").addEventListener("click", function () {
  calculation.textContent += "i";
});

document.getElementById("cot").addEventListener("click", function () {
    calculation.textContent += "cot";
});

document.getElementById("sec").addEventListener("click", function () {
    calculation.textContent += "sec";
  });
document
  .getElementById("multiplication")
  .addEventListener("click", function () {
    op("x");
  });

document.getElementById("clear").addEventListener("click", function () {
  calculation.textContent = "";
  result.textContent = 0;
});

document.getElementById("dot").addEventListener("click", function () {
  op(".");
});

document.getElementById("equal").addEventListener("click", function () {
  result.textContent =
    calc(formula()).length !== 0 ? calc(formula()) : result.textContent;
  calculation.textContent = result.textContent;
});

const tooltip = document.getElementsByClassName("tooltip")[0];
function restoreText() {
  tooltip.textContent = "Click To Copy ❤";
}

function copy() {
  document.execCommand("copy");
  tooltip.textContent = "Copied!";
}

document
  .getElementsByClassName("nightModeToggle")[0]
  .addEventListener("click", function () {
    document.getElementsByClassName("switch")[0].classList.toggle("switchNM");
    document
      .getElementsByClassName("nightModeToggle")[0]
      .classList.toggle("nightModeToggleNM");
    document
      .getElementsByClassName("calculator")[0]
      .classList.toggle("styleNM");
    document.getElementsByClassName("screen")[0].classList.toggle("screenNM");
    document.querySelectorAll(".style").forEach(function (button) {
      button.classList.toggle("styleNM");
    });
    result.classList.toggle("resultTextNM");
    calculation.classList.toggle("calculationNM");
  });

document.getElementById("open").addEventListener("click", function () {
  document.getElementById("pad").classList.toggle("expNumPad");
  document.getElementById("open").classList.toggle("rotate");
  document.querySelector(".screen").classList.toggle("newscreen");
});

function backspc() {
  calculation.innerHTML = calculation.innerHTML.substr(
    0,
    calculation.innerHTML.length - 1
  );
}

function terop(btn) {
  if (calculation.textContent.length !== 0) {
    if (
      !["+", "-", "x", "/"].includes(
        calculation.textContent[calculation.textContent.length - 1]
      )
    ) {
      result.textContent = calc(formula());
      calculation.textContent += btn;
    } else {
      // result.textContent =  calc(formula());
      calculation.textContent = calculation.textContent.slice(
        0,
        formula.length - 1
      );
      calculation.textContent += btn;
    }
  }
}

function terformula() {
  var calMath = "";
  calculation.textContent.split("").map((element) => {
    if (element === "x") {
      calMath += "*";
    } else {
      calMath += element;
    }
  });
  return calMath;
}

// function sin() {
//   calculation.innerHTML = Math.sin(calc(formula()));
// }

// function cos() {
//   terop(calculation.innerHTML);
//   calculation.innerHTML = Math.cos(calc(formula()));
// }

// function tan() {
//   terop(calculation.innerHTML);
//   calculation.innerHTML = Math.tan(calc(formula()));
// }

// function pow() {
//   calculation.innerHTML = calc(formula()) + "^";
//   //   calculation.innerHTML = Math.pow(calc(formula()), 2);
// }

function sqrt() {
  calculation.innerHTML = Math.sqrt(calc(formula()), 2);
}

function log() {
  calculation.innerHTML = Math.log(calc(formula()));
}

function pi() {
  calculation.innerHTML += 3.14159265359;
}
function e() {
  calculation.innerHTML += 2.71828182846;
}

function fact() {
  var i, num, f;
  f = 1;
  num = screen.value;
  for (i = 1; i <= num; i++) {
    f = f * 1;
  }
  i = i - 1;

  screen.value = f;
}
