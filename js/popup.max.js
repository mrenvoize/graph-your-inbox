Graph = {};
Graph.drawLineGraph = function (c, a, b) {};
Graph.createDataTableHelper = function (k, e, c, a) {
    var d = new google.visualization.DataTable();
    d.addColumn("string", "Date");
    for (var f = 0; f < c.length; f++) {
        d.addColumn("number", c[f])
    }
    for (var f = 0; f < k.length; f++) {
        var g = k[f];
        var h = typeof a == "undefined" ? g : a(g);
        var l = [h];
        for (var b = 0; b < e.length; b++) {
            if (g in e[b]) {
                l.push(e[b][g].length)
            } else {
                l.push(0)
            }
        }
        d.addRow(l)
    }
    return d
};
Graph.createDataTable = function (h, j, g, a) {
    var c = h.getQueryMessageList();
    var e = [];
    for (var f = 0; f < c.length; f++) {
        e.push(j(c[f]))
    }
    var k = g(e);
    var d = h.getQueryList();
    var b = [];
    for (var f = 0; f < d.length; f++) {
        b.push(d[f].query)
    }
    return this.createDataTableHelper(k, e, b, a)
};
Graph.getOptions = function (b) {
    var a = {
        curveType: "none",
        pointSize: 5,
        width: 800,
        height: 150,
        legend: "none",
        vAxis: {
            minValue: 0
        },
        fontName: "Trebuchet MS"
    };
    if (typeof b != "undefined") {
        a = Util.mergeObjects(a, b)
    }
    return a
};
var GOOGLE_COLORS = [{
    color: "#3366CC",
    lighter: "#45AFE2"
}, {
    color: "#DC3912",
    lighter: "#FF3300"
}, {
    color: "#FF9900",
    lighter: "#FFCC00"
}, {
    color: "#109618",
    lighter: "#14C21D"
}, {
    color: "#990099",
    lighter: "#DF51FD"
}, {
    color: "#0099C6",
    lighter: "#15CBFF"
}, {
    color: "#DD4477",
    lighter: "#FF97D2"
}, {
    color: "#66AA00",
    lighter: "#97FB00"
}, {
    color: "#B82E2E",
    lighter: "#DB6651"
}, {
    color: "#316395",
    lighter: "#518BC6"
}, {
    color: "#994499",
    lighter: "#BD6CBD"
}, {
    color: "#22AA99",
    lighter: "#35D7C2"
}, {
    color: "#AAAA11",
    lighter: "#E9E91F"
}, {
    color: "#6633CC",
    lighter: "#9877DD"
}, {
    color: "#E67300",
    lighter: "#FF8F20"
}, {
    color: "#8B0707",
    lighter: "#D20B0B"
}, {
    color: "#651067",
    lighter: "#B61DBA"
}, {
    color: "#329262",
    lighter: "#40BD7E"
}, {
    color: "#5574A6",
    lighter: "#6AA7C4"
}, {
    color: "#3B3EAC",
    lighter: "#6D70CD"
}, {
    color: "#B77322",
    lighter: "#DA9136"
}, {
    color: "#16D620",
    lighter: "#2DEA36"
}, {
    color: "#B91383",
    lighter: "#E81EA6"
}, {
    color: "#F4359E",
    lighter: "#F558AE"
}, {
    color: "#9C5935",
    lighter: "#C07145"
}, {
    color: "#A9C413",
    lighter: "#D7EE53"
}, {
    color: "#2A778D",
    lighter: "#3EA7C6"
}, {
    color: "#668D1C",
    lighter: "#97D129"
}, {
    color: "#BEA413",
    lighter: "#E9CA1D"
}, {
    color: "#0C5922",
    lighter: "#149638"
}, {
    color: "#743411",
    lighter: "#C5571D"
}];
var BG = chrome.extension.getBackgroundPage();
var loadEmail = function (b) {
    var a = "https://mail.google.com/mail/?shva=1#all/" + b;
    window.open(a)
};
var loadQuery = function (b) {
    var a = "https://mail.google.com/mail/#search/" + b;
    window.open(a)
};
var onQuery = function () {
    $(".status").hide();
    var a = $("#query").val();
    if (a == "") {
        return false
    }
    if (a in RUNNING_QUERIES) {
        return false
    }
    RUNNING_QUERIES[a] = QueryStatus.CONTINUE;
    processingManager.add(a);
    BG.downloadMessages(a, queryManager);
    return false
};
var UI = null;
var queryManager = BG.queryManager;
var Util = BG.Util;
var Errors = BG.Errors;
var RUNNING_QUERIES = BG.RUNNING_QUERIES;
var QueryStatus = BG.QueryStatus;
var processingManager = BG.processingManager;
$(function () {
    UI = new UI(queryManager);
    UI.updateGraphs();
    $("#query_form").submit(onQuery);
    $(".status").hide();
    $("#day_of_week_holder").css("display", "none");
    processingManager.onAdd(UI.onQueryProcessInit);
    processingManager.onUpdate(UI.onQueryProcessUpdate2);
    processingManager.onDone(UI.onQueryProcessDone);
    processingManager.callListeners();
    $("#query").focus();
    $("#intro h2").click(function () {
        window.open("http://www.graphyourinbox.com")
    })
});
var UI = function (a) {
    this.query_manager = a
};
UI.prototype.onQuerySuccess = function (b, c) {
    b.remove();
    var a = $("<li></li>");
    a.text(c);
    $("#query_list").prepend(a);
    if ($("#query").val() == c) {
        $("#query").val("")
    }
    this.flashGood("Your search was successful!")
};
var processedMap = {};
UI.prototype.onQueryProcessInit = function (c, a) {
    var b = $('<div id="processing_msg"></div>');
    b.html('Searching for <span class="query_text"></span><span class="processed"></span><img class="query_x" src="images/x.png"/>');
    b.find("span.query_text").text(c);
    var d = function () {
        RUNNING_QUERIES[c] = QueryStatus.CANCEL
    };
    b.find(".query_x").click(d);
    $("#processing_msgs").append(b);
    processedMap[c] = b
};
UI.prototype.onQueryProcessUpdate2 = function (d, a, c) {
    if (c > 0) {
        var b = processedMap[d];
        b.find(".processed").text(": Processed " + c + " conversations.")
    }
};
UI.prototype.onQueryProcessDone = function (b, a) {
    if (a == -1) {
        UI.onQuerySuccess(processedMap[b], b);
        UI.updateGraphs()
    } else {
        UI.onQueryFailure(processedMap[b], b, a)
    }
};
UI.prototype.onQueryFailure = function (b, c, a) {
    b.remove();
    switch (a) {
    case Errors.NOT_LOGGED_IN:
        var d = this.flashBad('You are not logged in. Please <a target="_blank" href="https://mail.google.com">click here</a> to login to Gmail.');
        break;
    case Errors.IG_NO_GMAIL:
        var d = this.flashBad('Graph Your Inbox needs the Gmail widget to be installed on iGoogle (even if you don\'t use iGoogle). <a target="_blank" href="http://www.google.com/ig/directory?type=gadgets&url=www.google.com/ig/modules/builtin_gmail.xml">Click here</a> and then click on "Add it Now".');
        break;
    case Errors.NO_MESSAGES_FOUND:
        this.flashBad("No messages found.");
        break;
    case Errors.QUERY_CANCELLED:
        this.flashBad("The query was cancelled.");
        break;
    case Errors.ERROR_PROCESSING_REQUEST:
        this.flashBad("There was an error processing this request. This may be a result of Gmail rate limiting. Please make sure you're logged into Gmail and try again in a few minutes.");
        break;
    default:
        this.flashBad("An unknown error occurred.")
    }
};
UI.prototype.updateGraphs = function (b) {
    if (queryManager.getNumQueries() > 0) {
        $("#intro").css("display", "none");
        $("#graph_tbl").css("display", "");
        this.redrawQueryItems();
        this.updateYearGraph();
        var a = this.updateYearMonthGraph();
        this.updateDayOfWeekGraph();
        this.updateSingleMonthGraph(a);
        this.updateEmails()
    } else {
        $("#intro").css("display", "");
        $("#graph_tbl").css("display", "none")
    }
};
UI.prototype.updateYearGraph = function () {
    var f = function (g) {
        return g.getGroupYear()
    };
    var e = function (h) {
        var g = Util.allKeys(h);
        return Util.yearKeys(g)
    };
    var a = Graph.createDataTable(this.query_manager, f, e, Util.yearFormatter);
    var d = a.getNumberOfColumns() > 4 ? "LineChart" : "ColumnChart";
    var c = new google.visualization[d](document.getElementById("year_graph"));
    c.draw(a, Graph.getOptions({
        width: 425
    }));
    var b = function () {
        var j = c.getSelection();
        var p = j[0].row;
        var h = j[0].column;
        var g = a.getValue(p, 0);
        var m = Util.yearReverseFormatter(g);
        var l = queryManager.getIth(h - 1);
        var o = queryManager.getMessages(l);
        var k = f(o);
        var i = null;
        if (m in k) {
            var n = k[m];
            i = o.getByIds(n)
        }
        UI.updateEmailsYear(l, m, i)
    };
    google.visualization.events.addListener(c, "select", b)
};
UI.prototype.updateYearMonthGraph = function () {
    var f = function (g) {
        return g.getGroupYearMonth()
    };
    var c = null;
    var e = function (i) {
        var g = Util.allKeys(i);
        var h = Util.yearMonthKeys(g);
        c = h[h.length - 1];
        return h
    };
    var a = Graph.createDataTable(this.query_manager, f, e, Util.yearMonthFormatter);
    var d = new google.visualization.LineChart(document.getElementById("year_month_graph"));
    d.draw(a, Graph.getOptions({
        width: 900,
        pointSize: 5,
        curveType: "none",
        hAxis: {
            slantedText: false
        }
    }));
    var b = function () {
        var j = d.getSelection();
        var p = j[0].row;
        var h = j[0].column;
        var n = a.getValue(p, 0);
        var g = Util.yearMonthReverseFormatter(n);
        var l = queryManager.getIth(h - 1);
        var o = queryManager.getMessages(l);
        var k = f(o);
        var i = null;
        if (g in k) {
            var m = k[g];
            i = o.getByIds(m)
        }
        UI.updateEmailsYearMonth(l, g, i);
        UI.updateSingleMonthGraph(g)
    };
    google.visualization.events.addListener(d, "select", b);
    return c
};
UI.prototype.updateSingleMonthGraph = function (e) {
    var g = function (h) {
        return h.getGroupYearMonthDay()
    };
    var f = function (h) {
        return Util.singleMonthKeys(e)
    };
    var a = Graph.createDataTable(this.query_manager, g, f, Util.singleMonthFormatter);
    var d = a.getNumberOfColumns() > 4 ? "LineChart" : "ColumnChart";
    var c = new google.visualization[d](document.getElementById("month_graph"));
    c.draw(a, Graph.getOptions({
        width: 900,
        height: 100,
        pointSize: 5,
        curveType: "none",
        hAxis: {
            slantedText: false
        }
    }));
    var b = function () {
        var j = c.getSelection();
        var q = j[0].row;
        var h = j[0].column;
        var o = a.getValue(q, 0);
        var m = queryManager.getIth(h - 1);
        var p = queryManager.getMessages(m);
        var k = g(p);
        var i = null;
        var l = e + Util.strpad(o, 2);
        if (l in k) {
            var n = k[l];
            i = p.getByIds(n)
        }
        UI.updateEmailsSingleMonth(m, l, i)
    };
    google.visualization.events.addListener(c, "select", b);
    $("#single_month_desc").text(Util.yearMonthFormatter(e))
};
UI.prototype.updateDayOfWeekGraph = function () {
    var c = function (d) {
        return d.getGroupDayOfWeek()
    };
    var a = Graph.createDataTable(this.query_manager, c, Util.getDaysOfWeek);
    var b = new google.visualization.ColumnChart(document.getElementById("day_of_week_graph"));
    b.draw(a, Graph.getOptions({
        width: 425
    }))
};
UI.prototype.redrawQueryItems = function () {
    var d = $("#query_items");
    d.empty();
    var a = this.query_manager.getQueryList();
    for (var c = 0; c < a.length; c++) {
        var b = this.query_manager.getMessages(a[c].query).getTotalNum();
        d.append(this.createQueryItem(c, a[c].query, a[c].id, b))
    }
};
UI.prototype.createQueryItem = function (b, e, g, a) {
    var d = this.query_manager;
    var f = $('<div class="query_item"><img src="images/ball.png" class="ball"> <span class="query_text"></span> (<span>' + a + '</span>)<img class="query_x" src="images/x.png"/></div>');
    f.find(".ball").css("backgroundColor", GOOGLE_COLORS[b % GOOGLE_COLORS.length].color);
    f.find(".query_text").text(e);
    var c = function () {
        f.remove();
        setTimeout(function () {
            d.removeById(g);
            UI.updateGraphs()
        }, 50)
    };
    f.find("img").click(c);
    return f
};
UI.prototype.flashGood = function (b) {
    var a = this.flash(b, true);
    setTimeout(function () {
        a.fadeOut(1000)
    }, 3000);
    return a
};
UI.prototype.flashBad = function (a) {
    return this.flash(a, false)
};
UI.prototype.flash = function (c, b) {
    var a = $(".status");
    if (b) {
        a.removeClass("bad");
        a.addClass("good")
    } else {
        a.removeClass("good");
        a.addClass("bad")
    }
    a.html(c);
    a.show();
    return a
};
UI.prototype.updateEmailsSingleMonth = function (f, a, d) {
    var c = null;
    var b = null;
    if (d && d.length > 0) {
        var g = d[0];
        c = "" + Util.getMonth(g.date.getMonth() + 1) + " " + g.date.getDate() + ", " + g.date.getFullYear();
        var e = Util.getDayBeforeAfter(g.date);
        b = f + " after:" + e.after + " before:" + e.before
    }
    this.updateEmails(c, b, d)
};
UI.prototype.updateEmailsYearMonth = function (f, a, d) {
    var c = Util.yearMonthFormatter(a);
    var e = Util.getSingleMonthBeforeAfter(a);
    var b = f + " after:" + e.after + " before:" + e.before;
    this.updateEmails(c, b, d)
};
UI.prototype.updateEmailsYear = function (f, c, d) {
    var b = null;
    var a = null;
    if (d && d.length > 0) {
        var g = d[0];
        b = "" + g.date.getFullYear();
        var e = Util.getYearBeforeAfter(g.date);
        a = f + " after:" + e.after + " before:" + e.before
    }
    this.updateEmails(b, a, d)
};
UI.prototype.updateEmails = function (j, f, c) {
    var b = 8;
    var e = $("#emails_holder tbody");
    e.empty();
    if (c == null || c.length == 0) {
        $("#email_preview_desc").text("");
        $("#no_emails_msg").css("display", "");
        return
    }
    $("#no_emails_msg").css("display", "none");
    $("#email_preview_desc").text("from " + j);
    var g = [];
    for (var d = 0; d < b && d < c.length; d++) {
        var a = c[d];
        g.push(this.createEmailRow(a))
    }
    var k = encodeURIComponent(f).replace(/'/g, "\\'");
    var h = c.length == 1 ? "" : "s";
    g.push('<tr><td colspan="3" align="center" onclick="loadQuery(\'' + k + "')\">[View all " + c.length + " conversation" + h + ".]</td></tr>");
    e.html(g.join(""))
};
UI.prototype.createEmailRow = function (e) {
    if (e.subject == "") {
        e.subject = "(no subject)"
    }
    var f = e.num_messages == 1 ? "" : " (" + e.num_messages + ")";
    var d = e.senders;
    if (d.length > 15) {
        d = d.substr(0, 15) + "&hellip;"
    }
    var c = e.subject;
    if (c.length > 30) {
        c = c.substr(0, 30) + "&hellip;"
    }
    var a = "" + (e.date.getMonth() + 1) + "/" + e.date.getDate() + "/" + Util.strpad(e.date.getFullYear() % 100, 2);
    var b = "<tr onclick=\"loadEmail('" + e.id + '\');"><td title="' + e.senders + '"><span class="email_from">' + d + f + '</span></td><td title="' + e.subject + " - " + e.message + '"><span class="email_subject">' + c + '</span></td><td align="right">' + a + "</td></tr>";
    return b
};
