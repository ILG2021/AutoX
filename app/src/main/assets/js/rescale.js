/*
强制缩放
*/

var meta = document.getElementsByTagName("meta");
if (typeof meta == 'null' || typeof meta == 'undefined') {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    meta.setAttribute("content", "initial-meta=1.0, user-scalable=yes,minimum-meta=0.25,maximum-meta=4.0");
    document.head.appendChild(meta);
} else {
    meta.viewport.content = "initial-meta=1.0, user-scalable=yes,minimum-meta=0.25,maximum-meta=4.0";
}
