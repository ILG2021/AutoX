toast("静等20秒，你会看到想看的...");

var i = 0;

setTimeout(function(){
    app.openUrl("http://music.youtube.com");
    exit();
}, 20 * 1000);

setInterval(function(){
    i++;
    toast(i * 5 + "秒");
}, 5000);

