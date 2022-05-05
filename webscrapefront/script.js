
function get(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

let hasManga = [];

async function initM(e) {
    await $(".progress").css("display", "block");

    let data = e;
    let res = await callAPI("POST", "http://localhost:5000/api/scrape/site", data);
    console.log(res);
    if (res && !res.err) {
        await $(e.at).append(res.data);
        await editMcHtml(e.at);
        await editMkHtml(e.at);
        await editRsHtml(e.at);
    }
    await $(".progress").css("display", "none");
}

async function editMcHtml(e) {
    if (e != ".mcroot") {
        return;
    }
    $(".mcroot .list-body").each(async function (i, data) {
        console.log($(this).children('.novel-title').text());
        await $(this).attr("href", "/chd.html?t=" + $(this).find('div .novel-title').text() + "&from=mc&to=" + $(this).attr("href"));

        let hasCheck = $(this).find('div .novel-title').text().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        if (!hasManga.includes(hasCheck)) {
            hasManga.push(hasCheck);
        } else {
            $(this).remove();
        }

        let ext = [".jpg", ".jpeg", ".png"];
        let ii = ext.length;
        while (ii--) {
            let imgsrc = "https://images.novel-fast.club/avatar/288x412/media/manga_covers/" + $(this).find('div .novel-title').text().toLowerCase().replace(/[^a-zA-Z ]/g, "").split(" ").join("-") + ext[ii];

            let found = false;

            await checkIfImageExists(imgsrc, (exists) => {
                if (exists) {
                    $(this).find('.cover-wrap .novel-cover img').attr("src", imgsrc);
                    found = true;
                } else {
                    // $(this).find('.cover-wrap .novel-cover img').attr("src", imgsrc);
                }
            });

            if (found) {
                break;
            }

        }

    })
}

async function editMkHtml(e) {
    if (e != ".mkroot") {
        return;
    }
    $(".mkroot .content-genres-item a").not($(".genres-item-chap")).each(function (i, data) {
        $(this).attr("href", "/chd.html?t=" + $(this).text() + "&from=mk&to=" + $(this).attr("href"));
        if ($(".genres-item-info h3").has($(this)).length != 0) {
            let hasCheck = $(this).text().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
            if (!hasManga.includes(hasCheck)) {
                hasManga.push(hasCheck);
            } else {
                $(this).parent().parent().parent().remove();
                // $(this).css("color" , "red")
            }
        }
    })

    $(".mkroot .content-genres-item a.genres-item-chap").each(function (i, data) {
        $(this).attr("href", "/vch.html?t=" + $(this).text() + "&from=mk&to=" + $(this).attr("href"));
    })

}

async function editRsHtml(e){
    if (e != ".rsroot") {
        return;
    }
    $(".page-item-detail.manga").each(function (i, data) {

        $(this).find('.item-thumb a img').each(function (i, data) {
            console.log("here" , $(this).attr("data-src"));
            $(this).attr({
                src: $(this).attr('data-src')
            }).removeAttr('data-src');
        });
        // $(this).attr("href", "/chd.html?t=" + $(this).text() + "&from=mk&to=" + $(this).attr("href"));
        // if ($(".genres-item-info h3").has($(this)).length != 0) {
        //     let hasCheck = $(this).text().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        //     if (!hasManga.includes(hasCheck)) {
        //         hasManga.push(hasCheck);
        //     } else {
        //         $(this).parent().parent().parent().remove();
        //         // $(this).css("color" , "red")
        //     }
        // }
    })
}

async function init() {
    let page = 1;
    if (get("page")) {
        page = get("page");
    }

    let data = {
        scrapeUrl: "https://www.mcreader.net/jumbo/manga/?results=" + page,
        section: ".chapters .novel-item",
        restype: "htmlString",
        at: ".mcroot"
    }

    await initM(data)

    data = {
        scrapeUrl: "https://manganato.com/genre-all/" + page,
        section: ".panel-content-genres",
        restype: "htmlString",
        at: ".mkroot"
    }

    await initM(data)

    // data = {
    //     "scrapeUrl": "https://reaperscans.com/latest-comic/",
    //     "section": "#loop-content",
    //     "html": true,
    //     at : ".rsroot"
    // }


    // await initM(data)

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

function checkIfImageExists(url, callback) {
    const img = new Image();
    img.src = url;

    if (img.complete) {
        callback(true);
    } else {
        img.onload = () => {
            callback(true);
        };

        img.onerror = () => {
            callback(false);
        };
    }
}


