const http = require("http");
const fs = require("fs");
const url = require("url");
const tsapi = require("@n0rmancodes/torrent-search-api");
const port = process.env.PORT || 8250;

start();
async function start () {
    tsapi.enablePublicProviders();
    tsapi.disableProvider("Torrent9");
    if (!fs.existsSync("./speed.json") | !fs.existsSync("./speed-individual.json")) {
        console.log("[i] completing tests (since 1 or both do not exist yet)...")
        await test1();
        await test2();
    } else {
        var json = JSON.parse(fs.readFileSync("./speed.json"));
        var since = (Date.now() - json.lastTest);
        if (since >= 10800000) {
            console.log("[i] redoing tests since they are out of date...");
            await test1();
            await test2();
        }
    }
    http.createServer(renderServer).listen(port);
    console.log("gomez - running on port " + port);
}
 
async function renderServer(req, res) {
    var url_parsed = url.parse(req.url, true);
    var lPath = "./web" + url_parsed.pathname;
    if (fs.existsSync(lPath)) {
        var ft = lPath.split(".")[lPath.split(".").length - 1];
        fs.readFile(lPath, function(err, resp) {
            if (err) {
                if (err.code == "ENOENT") {
                    fs.readFile("./errors/404.html", function (err, resp) {
                        if (err) {
                            res.end(err.code + " - server error");
                            res.writeHead(500,  {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/plain",
                                "Server": "gomez"
                            })
                        } else {
                            res.writeHead(404,  {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html",
                                "Server": "gomez"
                            })
                            res.end(resp);
                        }
                    })
                } else if (err.code == "EISDIR") {
                    fs.readFile(lPath + "index.html", function(err, resp) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                fs.readFile("./errors/404.html", function (err, resp) {
                                    if (err) {
                                        res.writeHead(404,  {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/plain",
                                            "Server": "gomez"
                                        })
                                    } else {
                                        res.writeHead(500,  {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/html",
                                            "Server": "gomez"
                                        })
                                        res.end(resp);
                                    }
                                })
                            } else {
                                fs.readFile("./errors/500.html", function (err, resp) {
                                    if (err) {
                                        res.end(err.code + " - server error");
                                        res.writeHead(500,  {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/plain",
                                            "Server": "gomez"
                                        })
                                    } else {
                                        res.writeHead(500,  {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/html",
                                            "Server": "gomez"
                                        })
                                        res.end(resp);
                                    }
                                })
                            }
                        } else {
                            res.writeHead(200,  {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html",
                                "Server": "gomez"
                            })
                            res.end(resp);
                        }
                    })
                } else {
                    fs.readFile("./errors/500.html", function (err, resp) {
                        if (err) {
                            res.end(err.code + " - server error");
                            res.writeHead(500,  {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/plain",
                                "Server": "gomez"
                            })
                        } else {
                            res.writeHead(500,  {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html",
                                "Server": "gomez"
                            })
                            res.end(resp);
                        }
                    })
                }
            } else {
                if (ft == "html") {
                    res.writeHead(200,  {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html",
                        "Server": "gomez"
                    });
                } else if (ft == "css") {
                    res.writeHead(200,  {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/css",
                        "Server": "gomez"
                    });
                } else if (ft == "js") {
                    res.writeHead(200,  {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/javascript",
                        "Server": "gomez"
                    });
                } else if (ft == "png"){
                    res.writeHead(200,  {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "image/png",
                        "Server": "gomez"
                    });
                } else {
                    res.writeHead(200,  {
                        "Access-Control-Allow-Origin": "*",
                        "Server": "gomez"
                    });
                }
                res.end(resp);
            }
        })
    } else if (url_parsed.pathname.substring(0,5) == "/api/") {
        var path = url_parsed.pathname.toString().split("/").slice(2);
        if (path[0] == "search") {
            if (url_parsed.query.q) {
                var t = await tsapi.search(url_parsed.query.q);
                var json = JSON.stringify(t);
                res.writeHead(200,  {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    "Server": "gomez"
                });
                res.end(json);
            } else {
                var json = JSON.stringify({
                    "err": {
                        "code": "noQuery",
                        "message": "No query was entered."
                    }
                });
                res.writeHead(400,  {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    "Server": "gomez"
                });
                res.end(json);
            }
        } else if (path[0] == "speed") {
            if (fs.existsSync("./speed.json") && fs.existsSync("./speed-individual.json")) {
                var data = JSON.parse(fs.readFileSync("./speed.json"));
                var iData = JSON.parse(fs.readFileSync("./speed-individual.json"));
                var since = (Date.now() - data.lastTest);
                if (since >= 10800000) {
                    await test1();
                    await test2();
                    var data = JSON.parse(fs.readFileSync("./speed.json"));
                    var iData = JSON.parse(fs.readFileSync("./speed-individual.json"));
                    var final = {
                        "individual": iData,
                        "joined": data
                    }
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json",
                        "Server": "gomez"
                    });
                    res.end(JSON.stringify(final));
                } else {
                    var final = {
                        "individual": iData,
                        "joined": data
                    }
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json",
                        "Server": "gomez"
                    });
                    res.end(JSON.stringify(final));
                }
            } else {
                var data = JSON.parse(fs.readFileSync("./speed.json"));
                var iData = JSON.parse(fs.readFileSync("./speed-individual.json"));
                var final = {
                    "individual": iData,
                    "joined": data
                }
                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    "Server": "gomez"
                });
                res.end(JSON.stringify(final));
            }
        } else {
            var json = JSON.stringify({
                "err": {
                    "code": "invalidEndpoint",
                    "message": "Endpoint is invalid."
                }
            });
        }
    } else {
        fs.readFile("./errors/404.html", function (err, resp) {
            if (err) {
                res.writeHead(404,  {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain",
                    "Server": "gomez"
                })
            } else {
                res.writeHead(500,  {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/html",
                    "Server": "gomez"
                })
                res.end(resp);
            }
        })
    }
}

async function test1() {
    var x = [];
    for (var c in tsapi.getActiveProviders()) {
        var a = { "provider": tsapi.getActiveProviders()[c].name }
        var b = Date.now();
        var c = await tsapi.search([ tsapi.getActiveProviders()[c].name ], "test").catch(function(e) {
            console.log(tsapi.getActiveProviders()[c].name)
        });
        var d = Date.now();
        a.duration = (d - b);
        x.push(a);
    }
    fs.writeFileSync("./speed-individual.json", JSON.stringify(x));
}

async function test2() {
    var start = Date.now();
    var t = await tsapi.search("test");
    if (t.length !== 0) {
        var end = Date.now();
        var timeTook = end - start;
        var data = JSON.stringify({
            "requestStart": start,
            "requestEnd": end,
            "duration": timeTook,
            "lastTest": Date.now()
        })
        fs.writeFileSync("./speed.json", data);
    } else {
        console.log("[!] error doing test, caching the error, delete './speed.json' to try again");
        var data = JSON.stringify({
            "err": {
                "message": "The speed test failed, please try again later",
                "code": "speedFail"
            }
        })
        fs.writeFileSync("./speed.json", data);
    }
}