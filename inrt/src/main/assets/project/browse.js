// 养号流程
var util_module = require("util.js");
const myDPI = com.stardust.util.ScreenMetrics.getDeviceScreenDensity();
const ocrLang = util_module.storage.get("ocr_lang", 'latin')
var runningField = JSON.parse(util_module.storage.get("running_field", util_module.storage.get("field")))
const period = JSON.parse(util_module.storage.get('period'))
const comment = JSON.parse(util_module.storage.get('comment'))
const fieldInterval = util_module.storage.get('field_interval', 5)
const browseDuration = util_module.storage.get('browse_duration', 15)
const openImageProbability = util_module.storage.get('open_image_probability', 10)
const commentProbability = util_module.storage.get('comment_probability', 10)
const zanProbability = util_module.storage.get('zan_probability', 30)
const lowestZan = util_module.storage.get('lowest_zan', 0)
const commentEnable = util_module.storage.get('comment_enable', true)
const emojiZan = util_module.storage.get('emoji_zan', true)
const emojiHeart = util_module.storage.get('emoji_heart', true)
const emojiHug = util_module.storage.get('emoji_hug', true)
const records = new Array()
var totalPost = 0, targetPost = 0, repeat = 0
var isProfile = false
const DEBUG = false

const i18n = {
    // 英文、简体、繁体、法语、德语、西语、葡语
    "TREND": "^(Feed|动态|動態|Fil).*",
    "SEARCH": ".*(Search|搜索|搜尋|suchen|Suchen|Rechercher|Buscar|Pesquisar).*",
    "ZAN_COUNT1": ".*(reactions|个心情|個心情|Reaktionen|réactions|reacciones|reações).*",
    "ZAN_COUNT2": ".*(reacted|留下了心情|傳達了心情|habt reagiert|avez réagi|personas más reaccionaron|pessoas reagiram).*",
    "ZAN_BUTTON": ".*(Like button|赞按钮|「讚」按鈕|„Gefällt mir“-Button|Bouton J’aime appuyé|Botón \"Me gusta\"|Botão Curtir).*",
    "COMMENT": ".*(comment|Comment|评论|留言|Kommentieren|kommentieren|Commenter|commenter|Comentar|comentar).*",
    "PUBLIC": ".*(Shared with|分享对象|Geteilt mit|Partagé avec|Compartido con|Compartilhado com).*",
    "AD": ".*(Sponsored|赞助内容|Gesponsert|Sponsorisée|Publicidad|Patrocinado).*",
    "SEND": "Send|发送|傳送|Senden|Envoyer|Enviar",
    "PAGE_FANS": ".*(粉丝|follower|seguidores|追蹤者|seguidores|Follower).*",
    "POSTS": ".*(POSTS|帖子|貼文|Posts|Beiträge|Publications|Publicaciones|Publicações).*",
    "GROUP_SHARE": "Share|分享|Teilen|Partager|Compartir|Compartilhar",
    "PAGE_ABOUT": ".*(關於|关于|About|À propos|Info|Información|Sobre).*",
    "REACT_Q": "Participant questions|互动必答题|參與者必答問題|Fragen an potenzielle Teilnehmer|Questions de participation|Preguntas para participantes|Perguntas de participantes",
    "NO_PUBLIC_GROUP": ".*(非公开小组|Private group|私密社團|Privé|Grupo privado|Grupo Privado|Private Gruppe).*",
    "SEND_MESSENGER":"发消息|Message|Nachricht senden|Mensagem|發送訊息|Mensaje"
}

if (DEBUG) {
    if (!requestScreenCapture()) {
        toast("无法获取截屏权限");
        engines.myEngine().forceStop();
    }
    //启用按键监听
    /* events.observeKey();
     //监听音量下键按下
     events.onKeyDown("volume_down", function (event) {
         browsePost(["小房子", "https://www.facebook.com"])
     });
 
     events.onKeyDown("volume_up", function (event) {
         var rv = className("androidx.recyclerview.widget.RecyclerView").untilFindOne(15000)
         rv.scrollBackward();
     }); */
    var rv = findTargetRV(true)
    var post = findInteractivePost(rv);
    totalPost++
    if (!post) {
        console.log("没有找到互动贴文")
        swipe(device.width / 2, device.height * 2 / 3, device.width / 2, device.height * 2 / 3 - 300, 500)
    }

    if (post == 'repeat') {
        swipe(device.width / 2, device.height * 2 / 3, device.width / 2, device.height * 2 / 3 - 300, 500)
    }

    interactive(post, ["小房子", 'https://www.facebook.com'])
} else {
    var r = launch("com.facebook.katana")           // 启动facebook并回到首页
    if (r) {
        const fields = JSON.parse(util_module.storage.get("field"));
        const fieldNames = fields.map(x => x[0])
        const fieldUrls = fields.map(x => x[1])
        // 检测一下正在运行的场地是否有从场地表格中移除的
        var newRunning = new Array();
        runningField.forEach(x => {
            if (fieldNames.includes(x[0]) && fieldUrls.includes(x[1]))
                newRunning.push(x)
        })
        runningField = newRunning

        if (!requestScreenCapture()) {
            toast("无法获取截屏权限");
            engines.myEngine().forceStop();
        }

        if (!checkPeriod()) {
            alert("当前不在养号时间段，请稍后再来")
            engines.myEngine().forceStop();
        } else {
            sleep(4000)
            while (checkPeriod())
                browseField(popField())
            console.log("养号完成")
            engines.myEngine().forceStop();
        }
    } else {
        toast("你需要安装facebook完整版app")
        engines.myEngine().forceStop()
    }
}

setInterval(() => { }, 1000);

function refresh() {
    for (var i = 0; i < util_module.randomNum(0, 3); i++) {
        swipe(device.width / 2, device.height / 3, device.width / 2, device.height / 3 + 500, 1000)
        sleep(2000)
    }
}

function gotoHome(level) {
    var count = 0
    while (true) {
        // 在搜索页面有时候前两项也会为true，搞不懂
        var isHome = descMatches(i18n.TREND).findOne() != null && className("androidx.recyclerview.widget.RecyclerView").findOne() != null
        if (!isHome) {
            back()
            sleep(3000)
            count++
            if (count >= level) {
                if (level == 7)
                    toastLog("无法自动回到首页，请手动回到fb首页再点开始")
                else
                    toastLog("无法自动回到首页，切换到下个场地")
                return false
            }
        } else break;
    }
    return true
}

function gotoGroup() {
    var count = 0
    while (true) {
        // 在搜索页面有时候前两项也会为true，搞不懂
        var isGroup = className("androidx.recyclerview.widget.RecyclerView").findOne() != null && className("android.widget.ImageView").descMatches(i18n.SEARCH).findOne() != null &&
            className("android.widget.Button").descMatches(i18n.GROUP_SHARE).findOne() != null
        if (!isGroup) {
            back()
            sleep(3000)
            count++
            if (count >= 3) {
                toastLog("无法自动回到小组首页，切换到下个场地")
                return false
            }
        } else break;
    }
    return true
}

function isAPage() {
    return className("EditText").findOne() != null && className("Button").descMatches(i18n.POSTS).findOne() != null
        && className("androidx.recyclerview.widget.RecyclerView").findOne() != null && className("Button").descMatches(i18n.PAGE_ABOUT).findOne() != null
}

function isAProfile() {
   return className("EditText").findOne() != null && className("Button").descMatches(i18n.SEND_MESSENGER).findOne() != null
        && className("androidx.recyclerview.widget.RecyclerView").findOne() != null 
}

function gotoPage() {
    var count = 0
    // 有时候跑飞了，跑到专页的视频或者图片去了
    var postBtn = descMatches(i18n.POSTS).findOne()
    if (postBtn && !postBtn.selected())
        postBtn.click()
    while (true) {
        var isPage = isAPage()

        if (!isPage) {
            back()
            sleep(3000)
            count++
            if (count >= 3) {
                toastLog("无法自动回到专页首页，切换到下个场地")
                return false
            }
        } else break;
    }
    return true
}

/**
 * field[0]是名字 field[1]是链接
 * @param {场地} field 
 */
function browseField(field) {
    console.log(field[0] + ":" + field[1] + " 养号中")

    // 小房子
    if (field[1] == "https://www.facebook.com" || field[1] == 'https://www.facebook.com/') {
        gotoHome(7)

        var trend = descMatches(i18n.TREND).untilFindOne(15000)
        if (trend && !trend.selected())
            trend.click()
        doBrowseField(field)
    } else {
        if (getGroupOrPageName() != field[0]) {
            gotoHome(7)

            // 只有动态选中的时候，搜索框才出来
            var trend = descMatches(i18n.TREND).untilFindOne(15000)
            if (trend && !trend.selected())
                trend.click()
            descMatches(i18n.SEARCH).className("android.widget.Button").untilFindOne(15000).click()
            sleep(4000)

            while (true) {
                var edittext = className("EditText").findOne()
                edittext.click()
                log("setText:" + field[1])
                edittext.setText(field[1])
                sleep(2000)
                edittext = className("EditText").findOne()
                if (edittext && edittext.text() == field[1])
                    break
            }
            sleep(2000)
            if (getScreenSW() >= 600)
                click(device.width - myDPI / 160 * 32, device.height - device.getVirtualBarHeight() - myDPI / 160 * 175)
            else
                click(device.width - myDPI / 160 * 16, device.height - device.getVirtualBarHeight() - myDPI / 160 * 35)
            sleep(3000)
            textMatches(i18n.POSTS).untilFindOne(15000)
            sleep(2000)
            // 点击头像图片
            click(className("ImageView").findOne().bounds())
            sleep(3000)
        }

        doBrowseField(field)
    }

    runningField = runningField.filter(x => x != field)
    util_module.storage.put('running_field', JSON.stringify(runningField))
    if (records.length > 0) {
        util_module.writeRecords(records);
        records = new Array()
    }
}

function doBrowseField(field) {
    refresh()
    if (descMatches(i18n.NO_PUBLIC_GROUP).findOne()) {
        toast("私密小组无法养号，切换到下个场地")
        return;
    }
    const begin = java.lang.System.currentTimeMillis()
    totalPost = 0
    targetPost = 0
    repeat = 0
    isProfile = isAProfile()
    log(isProfile)
    while (java.lang.System.currentTimeMillis() - begin < fieldInterval * 60 * 1000) {
        // 个人主页无法每个帖子都检测，只能在开始的时候检测。因为划上去之后就没有什么标志了
        if (!isProfile && !ensureField(field))
            break

        if (repeat >= 10) {          // 找了10次帖子都是重复的
            toastLog("已滑到场地结尾")
            break
        }
        browsePost(field)
    }
}

/**
 * 查找最大的recyclerview
 * @returns 
 */
function findTargetRV(block) {
    var rvs;
    if (block) rvs = className("androidx.recyclerview.widget.RecyclerView").untilFind()
    else rvs = className("androidx.recyclerview.widget.RecyclerView").find()
    var target;
    var visibleArea = 0;
    rvs.forEach(function (x) {
        if (x) {
            var bounds = x.bounds();
            if (bounds.top < 0) bounds.top = 0;
            if (bounds.bottom > device.height) bounds.bottom = device.height;
            if (bounds.width() * bounds.height() > visibleArea) {
                target = x;
                visibleArea = bounds.width() * bounds.height()
            }
        }
    })
    return target
}

function browsePost(field) {
    var rv = findTargetRV(true)
    rv.scrollForward();
    sleep(1000)
    // 滑动之后要稳定下，而且还得重新获取rv，rv的值不会自动刷新
    rv = findTargetRV(true)
    var post = findInteractivePost(rv);
    totalPost++
    if (!post) {
        console.log("没有找到互动贴文")
        swipe(device.width / 2, device.height * 2 / 3, device.width / 2, device.height * 2 / 3 - 300, 500)
        return;
    }

    if (post == 'repeat') {
        repeat++
        swipe(device.width / 2, device.height * 2 / 3, device.width / 2, device.height * 2 / 3 - 300, 500)
        return;
    } else {
        repeat = 0
    }

    interactive(post, field)
    sleep(util_module.randomNum(3, 5) * 1000)
    if (totalPost > 0)
        log("场地：" + field[0] + "当前互动率" + targetPost / totalPost + "\n\n")
}

/**
 * 确认场地，确认是在正确的场地浏览
 * @param {场地} field 
 */
function ensureField(field) {
    if (field[1] == "https://www.facebook.com" || field[1] == "https://www.facebook.com/")
        return gotoHome(3)
    else if (field[1].includes("https://www.facebook.com/groups"))
        return gotoGroup()
    else return gotoPage()
}

function getGroupOrPageName() {
    try {
        var isPage = isAPage()
        var isGroup = className("androidx.recyclerview.widget.RecyclerView").findOne() != null && className("android.widget.ImageView").descMatches(i18n.SEARCH).findOne() != null &&
            className("android.widget.Button").descMatches(i18n.GROUP_SHARE).findOne() != null
        log("isGroup:" + isGroup)
        log("isPage:" + isPage)
        if (isGroup) {
            var searchBtn = className("android.widget.ImageView").descMatches(i18n.SEARCH).findOne()
            return searchBtn.parent().sibling(-1).child(0).child(0).child(1).text()
        } else if (isPage) {
            var fans = descMatches(i18n.PAGE_FANS).findOne()
            var name = ""
            if (fans) {
                name = fans.parent().parent().parent().parent().parent().sibling(-1).child(0).child(0).child(0).text()
            }
            else {
                var rv = findTargetRV(false)

                for (var i = 0; i < rv.childCount(); i++) {
                    var child = rv.child(i)
                    var public = child.findOne(textMatches(i18n.PUBLIC))
                    if (public) {
                        name = public.parent().sibling(-1).text()
                        if (name)
                            break;
                    }
                }
            }
            return name
        }
    } catch (e) {
        log(e)
        return ""
    }
}

function tryToOpenPost(post, opened) {
    var image = post.find(className("ImageView")).filter(x => x.bounds().width() > device.width / 3);
    opened = image.length > 0 && image[0].click()

    if (!opened) {
        var oldOpen = opened
        try {
            var publish = post.findOne(textContains(i18n.PUBLIC))
            var titleLayout = publish.parent().parent()
            opened = titleLayout.click()
        } catch (e) {
            log(e)
            opened = oldOpen
        }
    }
    return opened
}

/**
 * 互动流程，点赞和留言
 * 有的帖子在里面拿不到，就从外面传过来
 * @param {贴文uiObject} post 不为空是home页交互，为空是详情页
 */
function interactive(post, field) {
    const noInteractiveKeywords = comment.map(x => x[0]).filter(x => x)
    const religionKeywords = comment.map(x => x[1]).filter(x => x)
    const religionComments = comment.map(x => x[2]).filter(x => x)
    const waibangKeywords = comment.map(x => x[3]).filter(x => x)
    const waibangComments = comment.map(x => x[4]).filter(x => x)

    var opened = false
    console.log("开始互动")

    var random = util_module.randomNum(1, 100);
    console.log("打开随机值：" + random + " 设置值：" + openImageProbability)
    if (random >= 1 && random <= openImageProbability) {
        // 打开贴文
        opened = tryToOpenPost(post, opened)

        if (opened) {
            log("打开了贴文")
            post = null
            sleep(browseDuration * 1000)
            records.push([util_module.getDate(), util_module.getHourMinute(), field[0], field[1], "打开贴文"])
        }
    }

    log("打开贴文之后opened:" + opened)

    var result = getPostContent(post, opened)
    const content = result.content
    opened = result.opened
    if (result.opened)
        post = null
    console.log("贴文内容：" + content);
    if (!content) {
        if (opened) back()
        return;
    }

    log("获取内容后opened：" + opened)

    var noInteractive = false
    var isReligion = false
    var isWaibang = false
    noInteractiveKeywords.forEach(x => {
        if (includeWord(content, x)) {
            noInteractive = true
            console.log("不互动词：" + x)
        }
    })

    if (noInteractive) {
        console.log("不互动内容:" + content)
        if (opened) back()
        return;
    }

    religionKeywords.forEach(x => {
        if (includeWord(content, x)) {
            console.log("包含宗派词：" + x)
            isReligion = true
        }
    })

    waibangKeywords.forEach(x => {
        if (includeWord(content, x)) {
            console.log("包含外邦词：" + x)
            isWaibang = true
        }
    })

    const chooseComment = isReligion ? religionComments[util_module.randomNum(0, religionComments.length - 1)]
        : (isWaibang ? waibangComments[util_module.randomNum(0, waibangComments.length - 1)] : "")
    console.log("宗派贴：" + isReligion + " 外邦贴：" + isWaibang)

    if (!isReligion && !isWaibang) {
        console.log("无法判断帖子类型opened:" + opened)
        if (opened) back()
        return
    }

    result = getZanCount(post, opened)
    var zanCount = result.zanCount
    opened = result.opened
    if (opened)
        post = null
    log("帖子点赞数：" + zanCount)
    if (zanCount == -1) {
        log("读取点赞数异常")
        if (opened) back()
        return
    }

    log("获取点赞数后opened：" + opened)

    // 找到符合要求的帖子
    targetPost++

    random = util_module.randomNum(1, 100)
    console.log("点赞随机值：" + random + " 设置值：" + zanProbability)
    if (random >= 1 && random <= zanProbability && (emojiZan || emojiHeart || emojiHug) && zanCount >= lowestZan) {
        const emojis = []
        if (emojiZan) emojis.push(0)
        if (emojiHeart) emojis.push(1)
        if (emojiHug) emojis.push(2)
        const emoji = emojis[util_module.randomNum(0, 2)]

        var zanButton
        if (post)
            zanButton = post.findOne(descMatches(i18n.ZAN_BUTTON))
        else zanButton = descMatches(i18n.ZAN_BUTTON).findOne()

        if (zanButton) {
            dianzan(field, zanButton, emoji)
        } else if (post) {
            opened = tryToOpenPost(post, opened)

            if (opened) {
                log("找不到点赞按钮，进入了详情页点赞")
                post = null
                sleep(3000)
                zanButton = descMatches(i18n.ZAN_BUTTON).findOne()
                if (zanButton) {
                    dianzan(field, zanButton, emoji)
                }
            }
        }
    }

    /* if (commentEnable) {
        random = util_module.randomNum(1, 100)
        console.log("留言随机值：" + random + " 设置值：" + commentProbability)
        if (random >= 1 && random <= commentProbability) {
            var commentButton;
            if (post)
                commentButton = post.findOne(textMatches(i18n.COMMENT).className("android.widget.Button"))
            else {
                log("查找评论按钮")
                commentButton = textMatches(i18n.COMMENT).className("android.widget.Button").untilFindOne(15000)
            }

            if (commentButton) {
                pinglun(field, commentButton, chooseComment)
            } else if (post) {
                opened = tryToOpenPost(post, opened)

                if (opened) {
                    log("找不到评论按钮，进入了详情页")
                    sleep(3000)
                    commentButton = textMatches(i18n.COMMENT).className("android.widget.Button").untilFindOne(15000)
                    if (commentButton) {
                        pinglun(field, commentButton, chooseComment)
                    } else {
                        log("详情页依然找不到留言按钮")
                    }
                }
            }
        }
    } */
    log("最终是否打开了帖子：" + opened)
    if (opened) back()
}

function pinglun(field, commentButton, chooseComment) {
    if (!commentButton.click()) {
        try {
            click(commentButton.bounds())
        } catch (e) {
            log(e)
        }
    }
    sleep(3000)
    var edittext = className("EditText").textMatches(i18n.COMMENT).untilFindOne(15000)
    if (!edittext) {
        log("无法评论")
        back()
        return
    }
    edittext.setText(chooseComment)
    sleep(2000)
    descMatches(i18n.SEND).click();
    sleep(4000)
    records.push([util_module.getDate(), util_module.getHourMinute(), field[0], field[1], chooseComment])
    console.log("留言：" + chooseComment)
    while (className("EditText").textMatches(i18n.COMMENT).findOne() || textMatches(i18n.REACT_Q).findOne()) {
        back()
        sleep(5000)
    }
}

function dianzan(field, zanButton, emoji) {
    const bounds = zanButton.bounds();
    if (emoji == 0) zanButton.click();
    else {
        longClick(bounds.left + bounds.width() / 2, bounds.top + bounds.height() / 2)
        sleep(2000)
        try {
            const emojiBtns = classNameContains("X.").find();
            if (emojiBtns && emojiBtns.length > emoji)
                click(emojiBtns[emoji].bounds())
            else if (classNameContains("X.").find())
                back()
        } catch (e) {
            log(e)
            if (classNameContains("X.").find())
                back()
        }
    }

    var emojiStr = ''
    if (emoji == 0) emojiStr = "赞"
    else if (emoji == 1) emojiStr = "爱心"
    else emojiStr = "抱抱"
    console.log("点赞：" + emojiStr)
    records.push([util_module.getDate(), util_module.getHourMinute(), field[0], field[1], emojiStr])
    sleep(2000)
}

function includeWord(sentence, word) {
    sentence = sentence.toLowerCase().trim()
    word = word.toLowerCase().trim()
    if (!sentence.includes(" ")) return sentence.includes(word)
    else {
        // 移除emoji
        sentence = sentence.replace(/(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '')
        sentence = sentence.replace(/\.,!\n\?\"#@/g, "")
        return sentence.split(" ").includes(word)
    }
}

function formatZanNum(str) {
    return str.replace(",", "").replace("万", "0000")
}
/**
 * 
 * @param {贴文obj} post 
 * @param {ZAN_COUNT1是没有共同好友点赞时的显示 ZAN_COUNT2是有好友点赞时的} str 
 * @returns 
 */
function getZanCount(post, opened) {
    var zanCount = -1;
    var obj = post ? post.findOne(descMatches(i18n.ZAN_COUNT1)) : descMatches(i18n.ZAN_COUNT1).findOne()
    if (!obj)
        obj = post ? post.findOne(descMatches(i18n.ZAN_COUNT2)) : descMatches(i18n.ZAN_COUNT2).findOne()
    if (obj) {
        log(obj.text())
        try {
            zanCount = formatZanNum(obj.text()).match(/\d+/)[0]
        } catch (e) {
            log(e)
        }
    } else {
        // post不为空表示首页，这里点赞没有露出来是获取不了的，所以进入详情页获取
        if (post) {
            opened = tryToOpenPost(post, opened)
            if (opened) {
                sleep(2000)
                log("找不到点赞数，进入了详情页")
                obj = descMatches(i18n.ZAN_COUNT1).findOne()
                if (!obj) obj = descMatches(i18n.ZAN_COUNT2).findOne()
                if (obj) {
                    try {
                        zanCount = formatZanNum(obj.text()).match(/\d+/)[0]
                    } catch (e) {
                        log(e)
                    }
                } else {
                    zanCount = -1
                }
            }
        } else zanCount = -1
    }
    return {
        opened: opened,
        zanCount: zanCount
    }
}

function getPostContent(post, opened) {
    var content = ""

    if (post) {
        // 公开状态，也就是地球+日期那里
        try {
            var publish = post.findOne(textMatches(i18n.PUBLIC))
            var titleLayout = publish.parent().parent()
            var index = titleLayout.parent().children().indexOf(titleLayout)
            content = titleLayout.parent().children()[index + 1].children()[0].text()
        } catch (e) {
            log(e)
        }
    }
    log(content)

    if (!content) {
        if (post) {
            opened = tryToOpenPost(post, opened)
            if (opened) {
                console.log("找不到内容，进入了详情页")
                sleep(2000)
                try {
                    log("点击图片中间位置")
                    var rv = className("androidx.recyclerview.widget.RecyclerView").findOne()
                    // rv不为空的时候是图集贴，是一个列表，不打开图片了，不然回不去了
                    if (!rv) {
                        // 点击图片的中间位置，让点赞、留言这些按钮消失，留下干净的图片进行识别
                        click(device.width / 2, device.height / 2)
                        events.broadcast.emit("hide_ui", true);
                        sleep(4000)
                    }
                    var shot = captureScreen()
                    let result = gmlkit.ocr(shot, ocrLang);
                    content = result.text
                    shot.recycle()
                    if (!rv) {
                        click(device.width / 2, device.height / 2)
                        events.broadcast.emit("hide_ui", false);
                        sleep(2000)
                    }
                } catch (e) {
                    log(e)
                }
            } else {
                console.log("打不开帖子，直接在首页通过ocr获取")
                var shot = captureScreen()
                var bounds = post.bounds()
                try {
                    content = gmlkit.ocr(images.clip(shot, bounds.left, bounds.top, bounds.width(), bounds.height()), ocrLang).text
                    shot.recycle()
                } catch (e) {
                    log(e)
                }
            }
        } else {
            // 通过ocr来得到内容
            try {
                var shot = captureScreen()
                let result = gmlkit.ocr(shot, ocrLang);
                content = result.text
                shot.recycle()
            } catch (e) {
                log(e)
            }
        }
    }
    return {
        opened: opened,
        content: content
    }
}
/**
 * 找到需要互动的帖子，主要是看哪个在视图中的面积较大
 * @param {*} rv 
 * @returns 
 */
var lastReact
function findInteractivePost(rv) {
    var target;
    var visibleArea = 0;
    rv.children().forEach(function (x) {
        if (x) {
            if (x.findOne(textMatches(i18n.AD)))
                return
            var bounds = x.bounds();
            if (bounds.top < 0) bounds.top = 0;
            if (bounds.bottom > device.height) bounds.bottom = device.height;
            if (bounds.width() * bounds.height() > visibleArea) {
                target = x;
                visibleArea = bounds.width() * bounds.height()
            }
        }
    })

    if (target) {
        if (target + "" == lastReact + "") {
            log("找到跟上次重复目标")
            return "repeat";
        }
        lastReact = target
        console.log("目标" + target.bounds())
    }
    return target
}

/**
 * 获取一个场地，场地是从表格获取的，然后随机弹出一个，当所有都完成之后会重新开始
 */
function popField() {
    if (runningField.length == 0) {
        runningField = JSON.parse(util_module.storage.get("field"))
        util_module.storage.put('running_field', JSON.stringify(runningField))
    }
    log("队列中的场地:" + runningField.length)
    if (runningField.length == 1)
        return runningField[0]
    else return runningField[util_module.randomNum(0, runningField.length - 1)]
}

/**
 * 检测是否在养号时间段
 */
function checkPeriod() {
    if (period.length == 0) return true

    for (var i in period) {
        var item = period[i];
        if (item[0] != util_module.getTodayWeekDay() && item[0] != '每日')
            continue;
        const curTime = util_module.getHourMinute();

        if (util_module.compareTime(curTime, item[1]) >= 0 && util_module.compareTime(curTime, item[2]) <= 0)
            return true;
    }

    return false
}

