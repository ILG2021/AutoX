var storage = storages.create("config");
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZCZ32diRF9_VgKZUwDkYFKxgDJyA-KQEz7neqomDziFbCzZLRXH3MrXuIhv7bDegD/exec"

function writeRecords(records) {
    try {
        var r = http.postJson(SCRIPT_URL + "?action=write_record&sheet_url=" + encodeURIComponent(storage.get("sheet_url")),
            records
        )

        r = r.body.json()
        if (r.success)
            console.log("已写入养号记录")
    } catch (e) {
        console.error(e)
        console.log("写入记录失败:" + JSON.stringify(records))
    }
}

function importSheet(sheet_url, callback, silence) {
    threads.start(function () {
        var r = http.get(SCRIPT_URL + "?action=read&sheet_url=" + encodeURIComponent(sheet_url));
        if (callback)
            callback()
        if (r.statusCode == 200) {
            const data = r.body.json()

            if (!data.field) {
                if (!silence)
                    alert("找不到'养号场地'，请检查表格，确定所有sheet名称没有改动")
                return;
            }

            if (!data.period) {
                if (!silence)
                    alert("找不到'养号时间段'，请检查表格，确定所有sheet名称没有改动")
                return;
            }

            if (!data.comment) {
                if (!silence)
                    alert("找不到'留言设置'，请检查表格，确定所有sheet名称没有改动")
                return;
            }

            if (data.field.length == 0) {
                if (!silence)
                    alert("养号场地不能为空")
                return;
            }

            if (!silence)
                toast("导入成功")
            storage.put("field", JSON.stringify(data.field))
            storage.put("period", JSON.stringify(data.period))
            storage.put("comment", JSON.stringify(data.comment))
            storage.put("sheet_url", sheet_url)
            console.log("更新表格数据成功")
        } else {
            if (!silence)
                alert("访问表格服务失败" + r.statusCode)
            console.error("访问表格服务失败" + r.statusCode)
        }
    })
}

function isScriptRunning(scriptName) {
    for (var i in engines.all()) {
        var engine = engines.all()[i];
        if ((engine.getSource().toString()).indexOf(scriptName) != -1)
            return true;
    }
    return false;
}

function stopScript(scriptName) {
    for (var i in engines.all()) {
        var engine = engines.all()[i];
        if ((engine.getSource().toString()).indexOf(scriptName) != -1) {
            engine.forceStop();
            break;
        }
    }
}

function getTodayWeekDay() {
    var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var today = new Date();
    return days[today.getDay()];
}

function getHourMinute() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();

    // 使用两位数字表示小时和分钟
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    var time = hours + ':' + minutes;
    return time;
}

function compareTime(time1, time2) {
    var parts1 = time1.split(':');
    var parts2 = time2.split(':');
    var hours1 = parseInt(parts1[0], 10);
    var hours2 = parseInt(parts2[0], 10);
    var minutes1 = parseInt(parts1[1], 10);
    var minutes2 = parseInt(parts2[1], 10);

    if (hours1 < hours2) {
        return -1;
    } else if (hours1 > hours2) {
        return 1;
    } else if (minutes1 < minutes2) {
        return -1;
    } else if (minutes1 > minutes2) {
        return 1;
    } else {
        return 0;
    }
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDate() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var date = today.getDate();

    return (year + '年' + month + '月' + date + '日');
}

/**
 * 
 * @param {图标路径} iconPath 
 * @param {找图选项，是一个对象，可以指定属性region（范围）} option
 * @returns 
 */
function findIcon(iconPath, option) {
    var screenShot = images.captureScreen()
    var icon = images.read(iconPath);

    var p;
    if (option)
        p = images.findImage(screenShot, icon, option);
    else
        p = images.findImage(screenShot, icon);
    var iconWidth = icon.getWidth();
    var iconHeight = icon.getHeight();
    screenShot.recycle();
    icon.recycle();
    if (p) {
        return {
            x: p.x,
            y: p.y,
            width: iconWidth,
            height: iconHeight
        }
    } else {
        return null
    }
}

module.exports = {
    storage: storage,
    importSheet: importSheet,
    isScriptRunning: isScriptRunning,
    writeRecords: writeRecords,
    randomNum: randomNum,
    getDate: getDate,
    compareTime: compareTime,
    stopScript: stopScript,
    getTodayWeekDay: getTodayWeekDay,
    getHourMinute: getHourMinute
}