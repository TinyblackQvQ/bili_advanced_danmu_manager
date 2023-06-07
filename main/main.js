// DEBUG使用内容
var GM_dic = {};
function GM_getValue(k) {
    return GM_dic[k];
}
function GM_setValue(k, v) {
    GM_dic[k] = v;
}

// 字符串字典
var string = {
    "bili-dm": "bili-dm",
    "bili-roll": "bili-roll",
    "bili-show": "bili-show",
    "bili-vip-dm": "bili-dm-vip",
    "bili-comment-container-class": "comment-container",
    "bili-container-vue-id": "video-container-v1",  // 用于获取vue产生的随机id的元素
    "right-panel-inject-element-id": "danmukuBox",  // 被注入的元素id
    "injected-element-class": "danmaku-warp",       // 注入的元素class，用于直接适用css

    "ADM": {
        "test-text": "userscript-ADM-testtext",
        "style-sheet": "userscript-ADM-stylesheet",

        "header-box": "userscript-ADM-cfgpanel-header",
        "header-arrow-icon": "usercript-ADM-cfgpanel-arrow-icon",
        "panel-box": "userscript-ADM-cfgpanel-box",
        "alert": "userscript-ADM-alert-icon",
        "error": "userscript-ADM-error-icon",
        "save-button": "userScript-cfg-save",
        "cancel-button": "userScript-cfg-cancel"
    },
    "config": {
        "script-initialized": "scriptInitialized",
        "search-danmu-limit": "searchDanmuLimit",
        "remove-vip-danmu-style": "removeVipDanmuStyle",
        "refresh-time": "refreshTime",
        "alert-wait-time": "alertWaitTime",
        "error-wait-time": "errorWaitTime",
        "initialize-refresh-time": "initializeRefreshTime"
    },
    "input": {
        "remove-vip-danmu-style": "remove_vip_danmu",
        "refresh-time": "refresh_time"
    },
    "style": {
        "font-family": "fontFamily",
        "font-size": "fontSize",
        "font-weight": "fontWeight",
        "text-shadow": "textShadow",
        "--webkit--text-stroke": "webkitTextStroke",
        "background": "background"
    }
};
// 脚本初始配置
var defaultconfig = {
    "scriptInitialized": false,     // 脚本是否初始化（第一次使用）
    "removeVipDanmuStyle": true,    // 是否清除vip弹幕样式
    "searchDanmuLimit": 100,        // 在获取初始弹幕样式函数中，搜寻弹幕数量的上限
    "initializeRefreshTime": 300,   // 当脚本处于初始化状态时，每次刷新间隔的时间
    "refreshTime": 1000,            // 监测弹幕刷新时间
    "alertWaitTime": 3000,          // 发现问题直到出现警告的等待时间
    "errorWaitTime": 20000          // 发现问题直到出现报错的等待时间
};
// 存储初始弹幕样式
var defaultStyle = {};

// 脚本样式表
var styleSheet = `
        //debug
    `;
// 脚本配置面板html
var cfgPanelHtml = `
        //debug
    `;

// 脚本加载进程
// 0：未开始
// 1：成功注入样式表和配置面板
// 2：成功加载本地配置
// 3：成功获取默认弹幕样式（完成）
var loadProgress = 0;

// 配置功能，静态模块
var cfg = {
    // 配置的临时保存位置
    content: {},

    // 设置配置值，结果保存于content
    setValue(k, v) {
        this.content[k] = v;
    },

    // 通过key值获取配置值，来源于content
    getValue(k) {
        return this.content[k];
    },

    // 从本地加载配置
    // 先从预设配置找到key值，之后尝试访问，并将结果放至content中
    // 若autoLoadDefault为true，则检测到脚本第一次打开时，将自动加载默认配置并保存至gm
    loadCfgFromLocalSave(autoLoadDefault) {
        for (const key in defaultconfig) {
            if (Object.hasOwnProperty.call(defaultconfig, key)) {
                this.content[key] = GM_getValue(key);
            }
        }
        if (this.getValue(string.config["script-initialized"]) != true && autoLoadDefault) {
            this.loadCfgFromDefault();
            this.setValue(string.config["script-initialized"], true);
            this.applyChange();
        }
    },

    // 将配置保存到本地
    applyChange() {
        for (const key in this.content) {
            if (Object.hasOwnProperty.call(this.content, key)) {
                const ele = this.content[key];
                GM_setValue(key, ele);
            }
        }
    },

    // 加载默认配置
    loadCfgFromDefault() {
        this.content = defaultconfig;
    }
};

function refreshCfgPanelFromLocalCfg() {
    var input_rmVipDm = document.getElementsByName(string.input["remove-vip-danmu-style"])[0];
    var input_refreshTime = document.getElementsByName(string.input["refresh-time"])[0];
    input_rmVipDm.checked = cfg.getValue(string.config["remove-vip-danmu-style"]);
    input_refreshTime.value = cfg.getValue(string.config["refresh-time"]);
}

// 将函数插入元素中
function addFunc() {
    // 添加在 id:userscript-ADM-cfgpanel-header 上，用于控制面板开合
    function headerFold() {
        if (panelFold) {
            panel.style.height = "90px";
            panel.style.marginBottom = "18px";
            panel.style.paddingTop = "15px";
            panel.style.paddingBottom = "15px";
            header.style.marginBottom = "6px";
            arrow.style.transform = "rotate(-90deg)";
            panelFold = false;
        }
        else {
            panel.style.height = "0px";
            panel.style.marginBottom = "0px";
            panel.style.paddingTop = "0px";
            panel.style.paddingBottom = "0px";
            header.style.marginBottom = "18px";
            arrow.style.transform = "rotate(90deg)";
            panelFold = true;
        }
    }
    function saveConfig() {
        cfg.setValue(string.config["remove-vip-danmu-style"], input_rmVipDm.checked);
        if (input_refreshTime.value < 100) {
            cfg.setValue(string.config["refresh-time"], 100);
        }
        else {
            cfg.setValue(string.config["refresh-time"], input_refreshTime.value);
        }
        cfg.applyChange();
        //重启主循环
        clearInterval(mainInterval);
        setTimeout(() => {
            mainCirculation();
        }, 1000);
    }

    var panelFold = true;
    var panel = document.getElementById(string.ADM["panel-box"]);
    var header = document.getElementById(string.ADM["header-box"]);
    var arrow = document.getElementById(string.ADM["header-arrow-icon"]);
    var input_rmVipDm = document.getElementsByName(string.input["remove-vip-danmu-style"])[0];
    var input_refreshTime = document.getElementsByName(string.input["refresh-time"])[0];
    var input_save = document.getElementById(string.ADM["save-button"]);
    var input_cancel = document.getElementById(string.ADM["cancel-button"]);

    header.addEventListener("click", headerFold);
    input_save.addEventListener("click", saveConfig);
    input_cancel.addEventListener("click", refreshCfgPanelFromLocalCfg);
}

// 倒计时检测脚本是否出现运行问题，时间到后出现图标提醒
function alertCountdown() {
    setTimeout(() => {
        if (loadProgress != 3) {
            document.getElementById(string.ADM.alert).style.visibility = "visible";
            setTimeout(() => {
                if (loadProgress != 3) {
                    document.getElementById(string.ADM.alert).style.visibility = "hidden";
                    document.getElementById(string.ADM.error).style.visibility = "visible";
                }
            }, defaultconfig[string.config["error-wait-time"]]);
        }
    }, defaultconfig[string.config["alert-wait-time"]]);
}

// 初始化脚本
function initializeScript() {
    // 向网页中注入css和配置html
    function inject() {
        // 获取vue元素随机id
        var randomVueContainerId = document.getElementsByClassName(string["bili-container-vue-id"])[0].attributes[1].name;
        if (document.getElementById(string.ADM["test-text"]) == undefined) {
            document.getElementById(string["right-panel-inject-element-id"]).insertAdjacentHTML("afterend", cfgPanelHtml);
            // 添加vue元素随机id
            document.getElementById(string.ADM["header-box"]).setAttribute(randomVueContainerId, randomVueContainerId);
            document.getElementById(string.ADM["panel-box"]).setAttribute(randomVueContainerId, randomVueContainerId);
        }
        if (document.getElementById(string.ADM["style-sheet"]) == undefined) {
            var e = document.createElement("style");
            e.id = string.ADM["style-sheet"];
            e.innerText = styleSheet;
            document.head.appendChild(e);
        }
        addFunc();
    }
    // 检测初始化进度
    function checkProgress(pro) {
        switch (pro) {
            case 0:
                return 1;
            case 1:
                // 检测html和css是否注入网页
                return !(document.getElementById(string.ADM["test-text"]) == undefined
                    || document.getElementById(string.ADM["style-sheet"]) == undefined);
            case 2:
                // 检测配置是否加载
                return cfg.getValue(string.config["script-initialized"]) != undefined;
            case 3:
                // 检测默认弹幕样式是否已获取
                return defaultStyle[string.style["text-shadow"]] != undefined;
        }
    }
    // 注入css/html
    if (loadProgress == 0) {
        inject();
        if (checkProgress(1))
            loadProgress = 1;
    }
    // 加载配置
    else if (loadProgress == 1) {
        cfg.loadCfgFromLocalSave(true);
        if (checkProgress(2)) {
            refreshCfgPanelFromLocalCfg();
            loadProgress = 2;
        }
    }
    // 获取默认弹幕样式
    else if (loadProgress == 2) {
        getDefaultStyle();
        if (checkProgress(3))
            loadProgress = 3;
    }
}

// 检测页面是否加载完成
function checkPageLoaded() {
    return document.getElementsByClassName(string["bili-comment-container-class"]).length != 0;
}

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

// 获取初始弹幕样式
function getDefaultStyle() {
    var dmList = document.getElementsByClassName(string["bili-roll"]);
    if (dmList.length >= 1) {
        // 获取弹幕样例，保存样式
        for (let i = 0; i < dmList.length && i < cfg.getValue(string.config["search-danmu-limit"]); i++) {
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

// 代码运行入口如下
// ——————————————————————————————
// alertCountdown();
// 先检测页面是否加载完成（存在评论区）
// 之后进入初始化循环，等待加载
// 加载完成后进入主循环
var mainInterval;

var checkInterval = setInterval(
    () => {
        // 检测页面是否加载完成
        if (checkPageLoaded) {
            clearInterval(checkInterval);

            var initializeInterval = setInterval(() => {
                initializeScript();
                //当加载完成后，启动正常循环
                if (loadProgress == 3) {
                    clearInterval(initializeInterval);
                    mainCirculation();
                }
            }, defaultconfig[string.config["initialize-refresh-time"]]);
        }
    }
    , 200);

function mainCirculation() {
    mainInterval = setInterval(() => {
        if (cfg.getValue(string.config["remove-vip-danmu-style"])) {
            document.getElementsByClassName(string["bili-vip-dm"]).forEach(element => {
                clearVipDanmuStyle(element);
            });
        }
    }, cfg.getValue(string.config["refresh-time"]));
}
