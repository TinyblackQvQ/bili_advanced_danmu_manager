// ==UserScript==
// @name         去除B站彩色弹幕(大会员弹幕)样式
// @namespace    https://www.greasyfork.org/
// @namespace    http://www.trampermonkey.com/
// @version      Alpha0.1
// @description  (Bilibili_Danmu_Advanced_Manager) 去除B站彩色弹幕样式
// @author       Tinyblack_QvQ
// @license      GPL-3.0
// @match        *://www.bilibili.com/video/av*
// @match        *://www.bilibili.com/video/BV*
// @match        *://www.bilibili.com/list/*
// @match        *://www.bilibili.com/bangumi/play/ep*
// @match        *://www.bilibili.com/bangumi/play/ss*
// @match        *://www.bilibili.com/cheese/play/ep*
// @match        *://www.bilibili.com/cheese/play/ss*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 字符串字典
    var string = {
        "bili-dm": "bili-dm",
        "bili-roll": "bili-roll",
        "bili-show": "bili-show",
        "bili-vip-dm": "bili-dm-vip"
    };
    // 脚本配置
    var config = {
        "searchDanmuLimit": 100,
        "refreshTime": 1000
    };
    // 存储初始弹幕样式
    var defaultStyle = {};
    // 是否初始化脚本
    // 0：未获取初始弹幕样式
    // 1：已获取部分，但未获取textShadow
    // 2：全部获取
    var initialized = 0;

    // 解释csstext
    function interpretCsstext(csstext) {
        var cssList = csstext.split(';');
        var style = {};
        cssList.forEach(key => {
            var k = key.split(':')[0].replace("--", "").replace(" ", "");
            var v = key.split(':')[1];
            style[k] = v;
        });
        return style;
    }
    
    // 生成csstext
    function encodeCss(css) {
        
    }
    // 获取初始弹幕样式
    function getDefaultStyle() {
        var dmList = document.getElementsByClassName(string["bili-roll"]);
        if (dmList.length >= 1) {
            // 获取弹幕样例，保存样式
            for (let i = 0; i < dmList.length && i < config.searchDanmuLimit; i++) {
                // 由于b站第一个弹幕没有直接设置textShadow，所以使用循环来强制获取
                var example = interpretCsstext(dmList[i].style.cssText);
                defaultStyle = {
                    "fontFamily": example.fontFamily,
                    "fontWeight": example.fontWeight,
                    "textShadow": example.textShadow
                };
                // 获取到后即可跳出
                if (defaultStyle.textShadow != undefined)
                    break;
            }
            // 初始化完成
            if (defaultStyle.textShadow == undefined)
                initialized = 1;
            else
                initialized = 2;
        }
    }

    // 清除vip弹幕样式
    function clearVipDanmuStyle(element) {
        if (element.style.background != "none") {
            // 清除特殊样式
            element.style.background = "none";
            element.style.webkitTextStroke = "";
            // 设置初始样式
            element.style.fontFamily = defaultStyle["fontFamily"];
            element.style.fontWeight = defaultStyle["fontWeight"];
            element.style.textShadow = defaultStyle["textShadow"];
        }
    }

    // 设置全局循环
    setInterval(() => {
        // 等待初始化
        if (initialized != 2) {
            getDefaultStyle();
        }
        else {
            document.getElementsByClassName(string["bili-vip-dm"]).forEach(element => {
                clearVipDanmuStyle(element);
            });
        }

    }, config.refreshTime);

})();