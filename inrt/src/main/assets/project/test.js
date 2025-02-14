// 养号流程
const myDPI = com.stardust.util.ScreenMetrics.getDeviceScreenDensity();
const records = new Array()
var totalPost = 0, targetPost = 0

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

function isAProfile() {
   return className("EditText").findOne() != null && className("Button").descMatches(i18n.SEND_MESSENGER).findOne() != null
        && className("androidx.recyclerview.widget.RecyclerView").findOne() != null 
}

log(isAProfile())

function gotoPage() {
    var count = 0
    while (true) {
        var isPage = className("EditText").findOne() != null && className("Button").descMatches(i18n.POSTS).findOne() != null && className("androidx.recyclerview.widget.RecyclerView").findOne() != null

        if (!isPage) {
            back()
            sleep(3000)
            count++
            if (count >= 3) {
                toast("无法自动回到专页首页，请手动回到专页首页再点开始")
                engines.myEngine().forceStop()
                break
            }
        } else break;
    }

    // 有时候跑飞了，跑到专页的视频或者图片去了
    var postBtn = descMatches(i18n.POSTS).findOne()
    if(postBtn && !postBtn.selected())
        postBtn.click()
}

function gotoHome() {
    var count = 0
    while (true) {
        // 在搜索页面有时候前两项也会为true，搞不懂
        var isHome = descMatches(i18n.TREND).findOne() != null && className("androidx.recyclerview.widget.RecyclerView").findOne() != null
        if (!isHome) {
            back()
            sleep(3000)
            count++
            if (count >= 7) {
                toast("无法自动回到首页，请手动回到fb首页再点开始")
                engines.myEngine().forceStop()
                break
            }
        } else break;
    }
}

function gotoGroup() {
    log("gotoGroup")
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
                toast("无法自动回到小组首页，请手动回到小组再点开始")
                engines.myEngine().forceStop()
                break
            }
        } else break;
    }
}

function gotoPage() {
    var count = 0
    while (true) {
        var isPage = className("EditText").findOne() != null && className("Button").descMatches(i18n.POSTS).findOne() != null && className("androidx.recyclerview.widget.RecyclerView").findOne() != null

        if (!isPage) {
            back()
            sleep(3000)
            count++
            if (count >= 3) {
                toast("无法自动回到专页首页，请手动回到专页首页再点开始")
                engines.myEngine().forceStop()
                break
            }
        } else break;
    }

    // 有时候跑飞了，跑到专页的视频或者图片去了
    var postBtn = descMatches(i18n.POSTS).findOne()
    if(postBtn && !postBtn.selected())
        postBtn.click()
}


function pinglun(field, commentButton, chooseComment) {
    log(commentButton)
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

function getGroupOrPageName() {
    try {
        var isPage = className("EditText").findOne() != null && className("Button").descMatches(i18n.POSTS).findOne() != null && className("androidx.recyclerview.widget.RecyclerView").findOne() != null
        var isGroup = className("androidx.recyclerview.widget.RecyclerView").findOne() != null && className("android.widget.ImageView").descMatches(i18n.SEARCH).findOne() != null &&
            className("android.widget.Button").descMatches(i18n.GROUP_SHARE).findOne() != null
        log("isGroup:" + isGroup)
        log("isPage:" + isPage)
        if (isGroup) {
            var searchBtn = className("android.widget.ImageView").descMatches(i18n.SEARCH).findOne()
            return searchBtn.parent().sibling(-1).child(0).child(0).child(1).text()
        } else if (isPage) {
            var fans = descContains(i18n.PAGE_FANS).findOne()
            var name = ""
            if (fans) {
                name = fans.parent().parent().parent().parent().parent().sibling(-1).child(0).child(0).child(0).text()
            }
            else {
                var rv = findTargetRV(false)

                for (var i = 0; i < rv.childCount(); i++) {
                    var child = rv.child(i)
                    var public = child.findOne(textMatches(i18n.PUBLIC))
                    log(public)
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



function getSlibing(me, indexOffset) {
    var slibings = me.parent().children()
    return slibings[slibings.indexOf(me) + indexOffset]
}


function getPostContent(post, opened) {
    var content = ""

    if (post) {
        // 公开状态，也就是地球+日期那里
        try {
            var publish = post.findOne(textContains("分享对象"))
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
                var textObj = className("TextView").findOne()
                if (textObj)
                    content = textObj.text()
                // 没有文字，走ocr
                if (!content) {
                    let result = gmlkit.ocr(captureScreen(), "auto");
                    content = result.text
                }
            } else {
                console.log("打不开帖子，直接在首页通过ocr获取")
                var shot = captureScreen()
                var bounds = post.bounds()
                content = gmlkit.ocr(images.clip(shot, bounds.left, bounds.top, bounds.width(), bounds.height()), "auto").text
            }
        } else {
            // 通过ocr来得到内容
            let result = gmlkit.ocr(captureScreen(), "auto");
            content = result.text
        }
    }
    return {
        opened: opened,
        content: content
    }
}

function getZanCount(post, str) {
    var zanCount = 0;
    var obj = post ? post.findOne(descContains(str)) : descContains(str).findOne()
    if (obj) {
        zanCount = obj.text().match(/\d+/)
        if (zanCount)
            zanCount = zanCount[0]
    } else {
        // post不为空表示首页，这里点赞没有露出来是获取不了的，所以进入详情页获取
        if (post) {
            var image = post.find(className("ImageView")).filter(x => x.bounds().width() > device.width / 3);
            if (image.length > 0 && image[0].click()) {
                post = null             // 进入了详情页
                obj = descContains(str).findOne()
                if (obj) {
                    zanCount = obj.text().match(/\d+/)
                    if (zanCount)
                        zanCount = zanCount[0]
                } else return -1;
            }
        } else return -1
    }
    console.log("这个贴有" + zanCount + "个赞")
    if (!zanCount) zanCount = -1
    return zanCount
}

function includeWord(sentence, word) {
    sentence = sentence.toLowerCase().trim()
    word = word.toLowerCase().trim()
    if (!sentence.includes(" ")) return sentence.includes(word)
    else {
        // 移除emoji
        sentence = sentence.replace(/(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '')
        const special = "[ .,!\n?]"
        var regStr = ''
        if (!sentence.startsWith(word))
            regStr += special
        regStr += word.toLowerCase().trim()
        if (!sentence.endsWith(word))
            regStr += special
        return new RegExp(regStr).test(sentence)
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
        log(x)
        if (x) {
            if (x == lastReact) {
                log("上次互动过了")
                return;
            }
            // 略过广告
            if (x.findOne(descContains("赞助内容")))
                return
            var bounds = x.bounds();
            if (bounds.top < 0) bounds.top = 0;
            if (bounds.bottom > device.height) bounds.bottom = device.height;
            log(bounds.height())
            if (bounds.width() * bounds.height() > visibleArea) {
                log("target=x")
                target = x;
                visibleArea = bounds.width() * bounds.height()
            }
        }
    })

    if (target) {
        lastReact = target
    }
    return target
}

function tryToOpenPost(post, opened) {
    var image = post.find(className("ImageView")).filter(x => x.bounds().width() > device.width / 3);
    opened = image.length > 0 && image[0].click()

    if (!opened) {
        var oldOpen = opened
        try {
            var publish = post.findOne(textContains("分享对象"))
            var titleLayout = publish.parent().parent()
            opened = titleLayout.click()
        } catch (e) {
            log(e)
            opened = oldOpen
        }
    }
    return opened
}
