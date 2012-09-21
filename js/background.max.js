Errors = {
    SUCCESS: 0,
    NO_MESSAGES_FOUND: 1,
    QUERY_CANCELLED: 2,
    NOT_LOGGED_IN: 3,
    IG_NO_GMAIL: 4,
    ERROR_PROCESSING_REQUEST: 5
};
Status = {
    STOP: 0,
    CONTINUE: 1,
    RETRY: 2
};
var queryManager = null;
var processingManager = null;
window.onload = function () {
    queryManager = new QueryManager();
    processingManager = new ProcessingManager()
};
var Messages = function (a) {
    this.messages = null;
    this.group_year = {};
    this.group_year_month = {};
    this.group_year_month_day = {};
    this.group_day_of_week = {}
};
Messages.prototype.add = function (b) {
    if (this.messages != null) {
        return
    }
    this.messages = b;
    this.messages.sort(function (d, c) {
        return c.date.getTime() - d.date.getTime()
    });
    for (var a = 0; a < this.messages.length; a++) {
        this.group(a, this.messages[a])
    }
};
Messages.prototype.getTotalNum = function () {
    return this.messages.length
};
Messages.prototype.getByIds = function (c) {
    var a = [];
    for (var b = 0; b < c.length; b++) {
        a.push(this.messages[c[b]])
    }
    return a
};
Messages.prototype.group = function (f, b) {
    var d = "" + b.date.getFullYear();
    this.write_group(this.group_year, d, f);
    var e = d + Util.strpad(b.date.getMonth() + 1, 2);
    this.write_group(this.group_year_month, e, f);
    var a = e + Util.strpad(b.date.getDate(), 2);
    this.write_group(this.group_year_month_day, a, f);
    var c = Util.getDayOfWeek(b.date.getDay());
    this.write_group(this.group_day_of_week, c, f)
};
Messages.prototype.write_group = function (b, a, c) {
    if (a in b) {
        b[a].push(c)
    } else {
        b[a] = [c]
    }
};
Messages.prototype.getGroupYear = function () {
    return this.group_year
};
Messages.prototype.getGroupYearMonth = function () {
    return this.group_year_month
};
Messages.prototype.getGroupYearMonthDay = function () {
    return this.group_year_month_day
};
Messages.prototype.getGroupDayOfWeek = function () {
    return this.group_day_of_week
};
var RUNNING_QUERIES = {};
var QueryStatus = {
    CONTINUE: 0,
    CANCEL: 1
};
var GET = function (b, a, d) {
    var c = new XMLHttpRequest();
    c.open("GET", b, true);
    c.onload = function () {
        a(c.responseText)
    };
    if (typeof d != "undefined") {
        c.onerror = d
    }
    c.send(null)
};
var getMailHomeUrl = function (cb, error_cb) {
    GET("http://www.google.com/ig", function (text) {
        var magic_logged_out_token = '<a href="https://www.google.com/accounts/ServiceLogin?';
        if (text.indexOf(magic_logged_out_token) != -1) {
            error_cb(Errors.NOT_LOGGED_IN);
            return
        }
        var magic_mailhome_start = "https://mail.google.com/mail/ig/mailhome";
        var magic_mailhome_end = "',";
        var start_pos = text.indexOf(magic_mailhome_start);
        if (start_pos == -1) {
            error_cb(Errors.IG_NO_GMAIL);
            return
        }
        var end_pos = text.indexOf(magic_mailhome_end, start_pos + magic_mailhome_start.length);
        var mail_home_url_raw = text.substring(start_pos, end_pos);
        var mail_home_url = eval('"' + mail_home_url_raw + '"');
        cb(mail_home_url)
    }, function () {
        error_cb(Errors.ERROR_PROCESSING_REQUEST)
    })
};
var getGt = function (a, b) {
    return function (c) {
        GET(c, function (i) {
            var f = "+'gt=";
            var g = "&'";
            var d = i.indexOf(f);
            if (d == -1) {
                return
            }
            var h = i.indexOf(g, d + f.length);
            var e = i.substring(d + f.length, h);
            a(e)
        }, function () {
            b(Errors.ERROR_PROCESSING_REQUEST)
        })
    }
};
var convertDate = function (a, b) {
    if (a.indexOf("/") != -1) {
        return new Date(Date.parse(a))
    } else {
        if (a.indexOf("am") == a.length - 2 || a.indexOf("pm") == a.length - 2) {
            return b
        } else {
            return new Date(Date.parse(a + ", " + b.getFullYear()))
        }
    }
};
var processRawMessage = function (a, c) {
    var b = convertDate(a.c, c);
    if (!("c" in a) || a.c == false) {
        return null
    }
    var d = {
        id: a.e,
        senders: a.k,
        num_messages: a.h,
        subject: a.l,
        message: a.m,
        date: b
    };
    return d
};
var processRawMessages = function (e) {
    var c = [];
    var b = new Date();
    for (var d = 0; d < e.length; d++) {
        var a = processRawMessage(e[d], b);
        if (a == null) {
            return null
        }
        c.push(a)
    }
    return c
};
var create_message_fetch_updater = function (c) {
    var b = 0;
    var a = function (d) {
        b += d;
        processingManager.update(c, d, b)
    };
    return a
};
var done_cb = function (c, b, a) {
    if (b) {
        processingManager.done(c, a)
    } else {
        processingManager.done(c, - 1)
    }
};
var downloadMessages = function (g, d) {
    var c = [];
    var b = create_message_fetch_updater(g);
    var e = function (a) {
        b(a.length);
        c = c.concat(a)
    };
    var h = function (a) {
        if (a != Errors.SUCCESS) {
            done_cb(g, true, a);
            return
        }
        if (RUNNING_QUERIES[g] == QueryStatus.CANCEL) {
            done_cb(g, true, Errors.QUERY_CANCELLED)
        } else {
            if (c.length == 0) {
                done_cb(g, true, Errors.NO_MESSAGES_FOUND)
            } else {
                var i = new Messages();
                i.add(c);
                d.add(g, i);
                done_cb(g, false, null)
            }
        }
        delete RUNNING_QUERIES[g]
    };
    var f = function (a) {
        done_cb(g, true, a);
        delete RUNNING_QUERIES[g]
    };
    getMailHomeUrl(getGt(function (a) {
        MailJSONPool(1, g, a, e, h)
    }, f), f)
};
var RpcPool = function (b, c, f, h, l, g) {
    var d = 0;
    var e = true;
    var m = false;
    var k = function (p, o) {
        --d;
        var n = d == 0 && e == false;
        if (n) {
            m = true
        }
        var i = g(o, n);
        if (i == Status.CONTINUE || i == Status.RETRY) {
            if (e || i == Status.RETRY) {
                ++d;
                if (i == Status.CONTINUE) {
                    p = h(c);
                    c = f(c);
                    l(p, function (q) {
                        k(p, q)
                    })
                } else {
                    setTimeout(function () {
                        l(p, function (q) {
                            k(p, q)
                        })
                    }, 300)
                }
            }
        } else {
            if (i == Status.STOP) {
                e = false;
                if (d == 0 && !m) {
                    m = true;
                    g(null, true)
                }
            } else {
                console.log("received unknown status code: ", i)
            }
        }
    };
    d = b;
    for (var j = 0; j < b; j++) {
        var a = h(c);
        l(a, function (i) {
            k(a, i)
        });
        c = f(c)
    }
};
var MailJSONPool = function (num_connections, query, gt, message_consumer, completed_cb) {
    var o = 0;
    var hasCancelled = false;
    var o_incrementer = function (o) {
        return o + 100
    };
    var url_formatter = function (o) {
        return "https://mail.google.com/mail/ig/mailjson?hl=en&gt=" + gt + "&url=http%3A//www.google.com/ig&q=" + encodeURIComponent(query) + "&time=&val=100&st=" + o + "&vw=max"
    };
    var cb = function (response, last_response) {
        if (hasCancelled) {
            return Status.STOP
        }
        if (query in RUNNING_QUERIES && RUNNING_QUERIES[query] == QueryStatus.CANCEL) {
            hasCancelled = true;
            completed_cb(Errors.QUERY_CANCELLED);
            delete RUNNING_QUERIES[query];
            return Status.STOP
        }
        var messages = [];
        if (response != null) {
            response = response.replace("throw 1; < don't be evil' >", "");
            if (response.indexOf('"Information is temporarily unavailable."') != -1) {
                return Status.RETRY
            }
            var json = eval("(" + response + ")");
            if ("n" in json) {
                messages = processRawMessages(json.n);
                if (messages == null) {
                    delete RUNNING_QUERIES[query];
                    completed_cb(Errors.ERROR_PROCESSING_REQUEST);
                    return Status.STOP
                } else {
                    message_consumer(messages)
                }
            }
        }
        if (last_response) {
            completed_cb(Errors.SUCCESS)
        }
        return messages.length == 100 ? Status.CONTINUE : Status.STOP
    };
    return RpcPool(num_connections, o, o_incrementer, url_formatter, GET, cb)
};
var ProcessingManager = function () {
    this.addListener = function () {};
    this.updateListener = function () {};
    this.doneListener = function () {};
    this.queries = []
};
ProcessingManager.prototype.onAdd = function (a) {
    this.addListener = a
};
ProcessingManager.prototype.onUpdate = function (a) {
    this.updateListener = a
};
ProcessingManager.prototype.onDone = function (a) {
    this.doneListener = a
};
ProcessingManager.prototype.callListeners = function (c) {
    for (var a = 0; a < this.queries.length; a++) {
        var b = this.queries[a];
        this.addListener(b.query);
        this.updateListener(b.query, b.n, b.total)
    }
};
ProcessingManager.prototype.add = function (a) {
    this.queries.push({
        query: a,
        n: 0,
        total: 0
    });
    this.addListener(a)
};
ProcessingManager.prototype.getId = function (b) {
    for (var a = 0; a < this.queries.length; a++) {
        if (this.queries[a].query == b) {
            return a
        }
    }
    return -1
};
ProcessingManager.prototype.update = function (b, f, a) {
    var d = this.getId(b);
    if (d != -1) {
        this.queries[d].n = f;
        this.queries[d].n = a;
        try {
            this.updateListener(b, f, a)
        } catch (c) {}
    }
};
ProcessingManager.prototype.done = function (b, a) {
    var d = this.getId(b);
    if (d != -1) {
        try {
            this.doneListener(b, a)
        } catch (c) {}
        this.queries.splice(d, 1)
    }
};
var QueryManager = function () {
    this.query_list = [];
    this.query_map = {}
};
QueryManager.prototype.getNumQueries = function () {
    return this.getQueryList().length
};
QueryManager.prototype.add = function (b, a) {
    if (b in this.query_map) {
        var c = this.getQueryId(b);
        this.removeById(c)
    }
    this.query_list.push(b);
    this.query_map[b] = a
};
QueryManager.prototype.removeById = function (b) {
    var a = this.query_list[b];
    if (a in this.query_map) {
        delete this.query_map[a]
    }
    this.query_list[b] = null
};
QueryManager.prototype.getQueryList = function () {
    var a = [];
    for (var b = 0; b < this.query_list.length; b++) {
        if (this.query_list[b] in this.query_map) {
            a.push({
                query: this.query_list[b],
                id: b
            })
        }
    }
    return a
};
QueryManager.prototype.getQueryId = function (b) {
    for (var a = 0; a < this.query_list.length; a++) {
        if (b == this.query_list[a]) {
            return a
        }
    }
    return -1
};
QueryManager.prototype.getMessages = function (a) {
    if (a in this.query_map) {
        return this.query_map[a]
    } else {
        return null
    }
};
QueryManager.prototype.getIth = function (c) {
    var a = 0;
    for (var b = 0; b < this.query_list.length; b++) {
        if (this.query_list[b] != null) {
            if (c == a) {
                return this.query_list[b]
            }
            a++
        }
    }
};
QueryManager.prototype.getQueryMessageList = function () {
    var b = [];
    for (var a = 0; a < this.query_list.length; a++) {
        if (this.query_list[a] in this.query_map) {
            b.push(this.query_map[this.query_list[a]])
        }
    }
    return b
};
var Util = {};
Util.strpad = function (d, e) {
    d = "" + d;
    if (d.length < e) {
        var b = [];
        for (var c = 0; c < e - d.length; c++) {
            b.push("0")
        }
        return b.join("") + d
    } else {
        return d
    }
};
Util.allKeys = function (b) {
    var c = [];
    for (var e = 0; e < b.length; e++) {
        for (var d in b[e]) {
            c.push(d)
        }
    }
    return c
};
Util.yearKeys = function (c) {
    var b = [];
    c.sort();
    var d = parseInt(c[c.length - 1]);
    for (var a = parseInt(c[0]); a <= d; a++) {
        b.push("" + a)
    }
    return b
};
Util.yearMonthKeys = function (d) {
    d.sort();
    var a = [];
    var b = parseInt(d[d.length - 1]);
    for (var c = parseInt(d[0]); c <= b; c++) {
        a.push("" + c);
        if (c % 100 == 12) {
            c += 88
        }
    }
    return a
};
Util.mergeObjects = function (d, c) {
    for (var e in c) {
        d[e] = c[e]
    }
    return d
};
Util.getDayOfWeek = function (a) {
    switch (a) {
    case 0:
        return "Sun";
    case 1:
        return "Mon";
    case 2:
        return "Tue";
    case 3:
        return "Wed";
    case 4:
        return "Thu";
    case 5:
        return "Fri";
    case 6:
        return "Sat"
    }
};
Util.getDaysOfWeek = function () {
    var a = [];
    for (var b = 0; b < 7; b++) {
        a.push(Util.getDayOfWeek(b))
    }
    return a
};
Util.getDaysInMonth = function (a, b) {
    if (b == 2) {
        return 28 + ((a % 4 == 0) && (a % 100 != 0) || (a % 400 == 0))
    } else {
        if (b == 4 || b == 6 || b == 9 || b == 11) {
            return 30
        } else {
            return 31
        }
    }
};
Util.getMonth = function (a) {
    switch (parseInt(a, 10)) {
    case 1:
        return "Jan";
    case 2:
        return "Feb";
    case 3:
        return "Mar";
    case 4:
        return "Apr";
    case 5:
        return "May";
    case 6:
        return "Jun";
    case 7:
        return "Jul";
    case 8:
        return "Aug";
    case 9:
        return "Sep";
    case 10:
        return "Oct";
    case 11:
        return "Nov";
    case 12:
        return "Dec"
    }
};
Util.singleMonthKeys = function (c) {
    var b = parseInt(c.substr(0, 4), 10);
    var e = parseInt(c.substr(4, 2), 10);
    var f = [];
    var d = Util.getDaysInMonth(b, e);
    for (var a = 1; a <= d; a++) {
        f.push("" + b + Util.strpad(e, 2) + Util.strpad(a, 2))
    }
    return f
};
Util._yearMonthReverseMap = {};
Util.yearMonthFormatter = function (a) {
    var b = Util.getMonth(a.substr(4));
    var c = b + " '" + a.substr(2, 2);
    Util._yearMonthReverseMap[c] = a;
    return c
};
Util.yearMonthReverseFormatter = function (a) {
    return Util._yearMonthReverseMap[a]
};
Util.singleMonthFormatter = function (a) {
    return "" + parseInt(a.substr(6), 10)
};
Util._yearReverseMap = {};
Util.yearFormatter = function (a) {
    var b = "'" + a.substr(2);
    Util._yearReverseMap[b] = a;
    return b
};
Util.yearReverseFormatter = function (a) {
    return Util._yearReverseMap[a]
};
Util.getSingleMonthBeforeAfter = function (a) {
    var c = parseInt(a.substr(0, 4), 10);
    var e = parseInt(a.substr(4, 2), 10);
    var b = (e == 12) ? 1 : e + 1;
    var g = (e == 12) ? c + 1 : c;
    var f = c + "/" + e + "/01";
    var d = g + "/" + b + "/01";
    return {
        before: d,
        after: f
    }
};
Util.getDayBeforeAfter = function (b) {
    var g = b.getDate();
    var d = b.getMonth() + 1;
    var f = b.getFullYear();
    var c = d;
    if (g == Util.getDaysInMonth(f, d)) {
        c = (d == 12) ? 1 : d + 1
    }
    var i = f;
    if (d != c) {
        i = (d == 12) ? f + 1 : f
    }
    var e = (g == Util.getDaysInMonth(f, d)) ? 1 : g + 1;
    var a = f + "/" + d + "/" + g;
    var h = i + "/" + c + "/" + e;
    return {
        before: h,
        after: a
    }
};
Util.getYearBeforeAfter = function (a) {
    var b = a.getFullYear();
    return {
        before: b + "/12/31",
        after: b + "/1/1"
    }
};
