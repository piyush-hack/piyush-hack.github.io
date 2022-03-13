

document.querySelector("#setdata").addEventListener("click", () => {
  var t = editorInt();
  t.data.set("casdcasc");
});


document.querySelector("#preview-data-action").addEventListener("click", () => {
  var t = editorInt();
  const e = [...document.querySelectorAll("link")].find((t) =>
    t.href.endsWith("assets/styles.css")
  ),
    n = [...document.querySelectorAll("link")].find((t) =>
      t.href.endsWith("snippet.css")
    ),
    i = document.querySelector("#preview-data-container"),
    s = `
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="../static/css/blog.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="../static/css/front_page.css" />
    <link rel="stylesheet" href="../static/css/code.css">
    <link rel="stylesheet" href="../static/css/loader.css">
    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.6/styles/monokai-sublime.min.css" />

    <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.6/highlight.min.js"></script>
    

    <title>Campus Mentor Blog</title>
    <style>\n\t\t\t\t\t\tbody {\n\t\t\t\t\t\t\tpadding: 20px;\n\t\t\t\t\t\t}\n\t\t\t\t\t\t.formatted p img {\n\t\t\t\t\t\t\tdisplay: inline;\n\t\t\t\t\t\t\tmargin: 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t</style>

</head>

<body>


    <div class="mt-5" id="body">
    ${t.getData()}</div>

</body>

</html>`;
  i.contentWindow.document.open(),
    i.contentWindow.document.write(s),
    i.contentWindow.document.close();
});

