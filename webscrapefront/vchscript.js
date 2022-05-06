function get(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

async function initVc(e) {

    let data = e;
    let res = await callAPI("POST", "https://apiwebscraper.herokuapp.com/api/scrape/site", data);
    if (res && !res.err) {
        await $(".chhead").append(get("t"));
        await $(".chapters").append(res.data);
        // await editMcVch();
    }
    $(".progress").css("display" , "none");

}

// async function editMcChd() {
//     $(".chapter-list li a").each(function (){
//         $(this).attr("href" , "vch.html?t=" +get("t")+"&from=mc&to=" +  $(this).attr("href"));
//     })

// }

async function init(){
    if (!get("from") || !get("to") || !get("t")) {
        return;
    }
    let data = {};
    if (get("from") == "mc") {
        data = {
            scrapeUrl: "https://www.mcreader.net/" + get("to"),
            section: "#chapter-reader",
            restype: "htmlString",
        }
    } else if (get("from") == "mk") {
        data = {
            scrapeUrl: get("to"),
            section: ".container-chapter-reader",
            restype: "htmlString",
        }
    }

    await initVc(data)

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
