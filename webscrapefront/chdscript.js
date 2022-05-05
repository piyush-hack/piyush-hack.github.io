function get(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function initCh(e) {
    let data = e;
    let res = await callAPI(
        "POST",
        "https://apiwebscraper.herokuapp.com/api/scrape/site",
        data
    );
    if (res && !res.err) {
        // console.log(res);

        await $(".chdroot").append(get("t"));
        await $(".chdroot").append(res.data);
        await editMcChd();
    }
    $(".progress").css("display", "none");
}

async function editMcChd() {
    $(".chapter-list li a").each(function () {
        $(this).attr(
            "href",
            "/vch.html?t=" + get("t") + "&from=mc&to=" + $(this).attr("href")
        );
    });

    // $(".row-content-chapter li a").each(function () {
    //     $(this).attr(
    //         "href",
    //         "/vch.html?t=" + get("t") + "&from=mk&to=" + $(this).attr("href")
    //     );
    // });

    // $("#library-push").attr("href" , "/chd.html?t=" +get("t")+"&from=mc&to=" +  $("#library-push").attr("href"));
    $("a").each(function () {
        if (
            $(".chapter-list li").has($(this)).length == 0 &&
            $(".row-content-chapter li").has($(this)).length == 0
        ) {
            $(this).attr(
                "href",
                "/chd.html?t=" + get("t") + "&from=mc&to=" + $(this).attr("href")
            );
        }
    });
}

async function init() {
    if (!get("from") || !get("to") || !get("t")) {
        return;
    }

    let data = {};
    if (get("from") == "mc") {
        data = {
            scrapeUrl: "https://www.mcreader.net/" + get("to"),
            section: "#chapters",
            restype: "htmlString",
        };
    } else if (get("from") == "mk") {
        data = {
            scrapeUrl: get("to"),
            section: ".panel-story-chapter-list",
            restype: "htmlString",
        };
    }

    await initCh(data);
}
init();

async function callAPI(method = "POST", url = "", data = {}) {
    try {
        if (method !== "GET") {
            const response = await fetch(url, {
                method: method, // *GET, POST, PUT, DELETE, etc.
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            return response.json();
        } else {
            const response = await fetch(url, {
                method: method, // *GET, POST, PUT, DELETE, etc.
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.json();
        }
    } catch (error) {
        console.log(error);
    }
}
