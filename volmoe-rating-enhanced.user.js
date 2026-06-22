// ==UserScript==
// @name          vol.moe 显示分级信息（增强版）
// @description   在 vol.moe 的列表页显示分级信息（缓存优先+限速补查），详情页自动缓存+手动更新按钮。基于 ichiogo/Hueizhi 原版修改。
// @version       0.5
// @author        jhtllkx
// @contributor   ichiogo, Hueizhi
// @match         https://vol.moe/*
// @match         https://mox.moe/*
// @match         https://volmoe.com/*
// @match         https://kox.moe/*
// @match         https://kxo.moe/*
// @match         https://koz.moe/*
// @match         https://kzz.moe/*
// @match         https://comic.im/*
// @grant         GM.getValue
// @grant         GM.setValue
// @grant         GM_addStyle
// @run-at        document-end
// @license       MIT
// @namespace     https://github.com/jhtllkx
// @contributionURL https://greasyfork.org/zh-CN/scripts/538866
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .rating-r18,
        .rating-r15,
        .rating-gen,
        .rating-failed,
        .rating-unknown {
            font-weight: bold;
            font-size: 83%;
            position: relative;
            top: -0.5px;
            font-family: auto;
        }

        .rating-r18 {
            color: red;
        }
        .rating-r15 {
            color: orange;
        }
        .rating-general {
            color: green;
        }
        .rating-failed {
            color: purple;
        }
        .rating-unknown {
            color: #999;
        }

        .rating-update-btn {
            display: inline-block;
            margin-left: 6px;
            padding: 1px 6px;
            font-size: 12px;
            font-weight: normal;
            color: #666;
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 3px;
            cursor: pointer;
            vertical-align: middle;
            line-height: 1.4;
        }
        .rating-update-btn:hover {
            color: #333;
            background: #e0e0e0;
        }
        .rating-update-btn.updated {
            color: green;
            border-color: green;
            background: #f0fff0;
        }
    `)

    const R18 = 'r18';
    const R15 = 'r15';
    const OTHER = 'rall';
    const FAILED = 'failed';

    const cidRE = /\/c\/(\w+)\.htm$/;
    const r18RE = /var is_r18\s*=\s*parseInt\(\s*"(\d)"\s*\)/;

    function parseRating(html) {
        const rv = r18RE.exec(html);
        if (rv && rv[1]) {
            switch (rv[1]) {
                case '2': return R18;
                case '1': return R15;
            }
            return OTHER;
        }
        return null;
    }

    function ratingTag(rating) {
        if (rating === R18) return '<span class="rating-r18">R18</span>';
        if (rating === R15) return '<span class="rating-r15">R15</span>';
        if (rating === FAILED) return '<span class="rating-failed">FAILED</span>';
        return '';
    }

    // ====== 详情页：存缓存 + 更新按钮 ======
    if (cidRE.test(location.pathname)) {
        const match = cidRE.exec(location.pathname);
        if (match && match[1]) {
            const cid = match[1];
            const rating = parseRating(document.documentElement.innerHTML);
            if (rating) {
                GM.setValue(cid, rating);
            }

            // 插入更新缓存按钮（放在 body 顶部浮动）
            const btn = document.createElement('button');
            btn.textContent = '更新分级缓存';
            btn.className = 'rating-update-btn';
            Object.assign(btn.style, {
                position: 'fixed',
                top: '8px',
                right: '8px',
                zIndex: '99999',
                padding: '4px 10px',
                fontSize: '13px',
                background: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
            });
            btn.addEventListener('click', () => {
                const r = parseRating(document.documentElement.innerHTML);
                if (r) {
                    GM.setValue(cid, r);
                    btn.textContent = ratingTag(r).replace(/<[^>]+>/g, '') || '全年龄';
                    btn.classList.add('updated');
                    setTimeout(() => {
                        btn.textContent = '更新分级缓存';
                        btn.classList.remove('updated');
                    }, 2000);
                } else {
                    btn.textContent = '未找到';
                    setTimeout(() => { btn.textContent = '更新分级缓存'; }, 2000);
                }
            });
            document.body.appendChild(btn);
        }
        return;
    }

    // ====== 列表页：缓存优先，缺的限速补查 ======
    if (!/^(?:\/|\/l\/.*|\/list\.php|\/myfollow\.php|\/(?:k|m)\/?(?:l\/.*|list\.php)?|\/m\/myfollow\.php)$/.test(location.pathname)) return;

    // 限速队列：每 1.5 秒一个请求，最多 1 个并发（对站长最友好）
    const FETCH_INTERVAL = 1500;
    let fetchQueue = [];
    let fetchRunning = false;

    function scheduleNext() {
        if (fetchQueue.length === 0) {
            fetchRunning = false;
            return;
        }
        fetchRunning = true;
        const { cid, anchor } = fetchQueue.shift();

        // 拉取前再检查一次缓存（可能详情页刚存过）
        GM.getValue(cid, null).then(cached => {
            if (cached) {
                renderTag(anchor, cached);
                scheduleNext();
                return;
            }
            // 限速等待
            setTimeout(() => {
                fetch(`${location.origin}/c/${cid}.htm`)
                    .then(r => r.text())
                    .then(html => {
                        const rv = r18RE.exec(html);
                        if (rv && rv[1]) {
                            let flag = OTHER;
                            switch (rv[1]) {
                                case '2': flag = R18; break;
                                case '1': flag = R15; break;
                            }
                            GM.setValue(cid, flag);
                            renderTag(anchor, flag);
                        } else {
                            console.error(`未能在 CID ${cid} 的页面中找到分级信息。`);
                            GM.setValue(cid, FAILED);
                            renderTag(anchor, FAILED);
                        }
                    })
                    .catch(error => {
                        console.error(`获取 CID ${cid} 内容失败:`, error);
                    })
                    .finally(() => {
                        scheduleNext();
                    });
            }, FETCH_INTERVAL);
        });
    }

    function enqueueFetch(cid, anchor) {
        fetchQueue.push({ cid, anchor });
        if (!fetchRunning) {
            scheduleNext();
        }
    }

    function renderTag(anchor, rating) {
        if (anchor.dataset.ratingRendered) return;
        anchor.dataset.ratingRendered = '1';

        let ratingHtml = '';
        if (rating === R18) {
            ratingHtml = '<span class="rating-r18">R18</span>';
        } else if (rating === R15) {
            ratingHtml = '<span class="rating-r15">R15</span>';
        } else if (rating === FAILED) {
            ratingHtml = '<span class="rating-failed">FAILED</span>';
        }
        // OTHER (全年龄) 不显示标签

        if (ratingHtml) {
            anchor.insertAdjacentHTML('afterbegin', ratingHtml);
        }
    }

    function init() {
        let anchors;
        if (location.pathname.endsWith("m/myfollow.php")) {
            anchors = document.querySelectorAll("a.weui-cell");
        } else if (location.pathname.endsWith("myfollow.php")) {
            anchors = document.querySelectorAll("table > tbody > tr:nth-child(n+4) > td > a");
        } else if (location.pathname.startsWith("/m") || location.pathname.startsWith("/k")) {
            anchors = document.querySelectorAll(".listbg0 > td > div > a");
        } else {
            anchors = document.querySelectorAll('td > div > a');
        }

        if (anchors.length === 0) {
            console.log("未找到匹配的漫画链接。");
            return;
        }

        anchors.forEach(anchor => {
            const match = cidRE.exec(anchor.href);
            if (!match || !match[1]) return;
            const cid = match[1];

            GM.getValue(cid, null).then(cached => {
                if (cached) {
                    // 有缓存：立即显示，零请求
                    renderTag(anchor, cached);
                } else {
                    // 无缓存：排入限速队列，1.5秒后逐个补查
                    enqueueFetch(cid, anchor);
                }
            });
        });
    }

    init();
})();
