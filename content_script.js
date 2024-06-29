var isVisibleSideMenu = false;
var links = {};

var img = document.createElement('img');
img.src = chrome.runtime.getURL('throbber.gif');
document.body.appendChild(img);

let treeData = [
    {
        "text": "folderA",
        "children": [
            { "text": "Google", "data": { "href": "https://www.google.com" } },
            { "text": "Yahoo", "data": { "href": "https://www.yahoo.com" } }
        ]
    },
    {
        "text": "folderB",
        "children": [
            { "text": "Bing", "data": { "href": "https://www.bing.com" } },
            { "text": "HackMD", "data": { "href": "https://localhost:3000" } }
        ]
    }
];


addFeaturesAttempt();




function addFeaturesAttempt() {
    if (!addMenu()) setTimeout(addFeaturesAttempt, 500);
}


function addMenu() {
    console.log("Executed!");

    let targetElement = document.querySelector('.nav.navbar-nav.navbar-form.navbar-left');

    if (!targetElement) {
        console.log("No target element found!");
        return false;
    }

    createIconButton();

    return true;
}


function createIconButton() {
    let button = document.createElement('span');
    button.className = 'btn btn-link btn-file ui-help';
    button.title = 'リンク一覧';

    let icon = document.createElement('i');
    icon.className = 'fa fa-align-left';

    button.appendChild(icon);

    button.addEventListener('click', toggleSideMenu);

    let addDistElement = document.querySelector('.nav.navbar-nav.navbar-form.navbar-left');

    if (!addDistElement) {
        console.log("Target element not found!");
        return;
    }

    addDistElement.appendChild(button);
}


function toggleSideMenu(event) {
    if (isVisibleSideMenu) {
        document.querySelector('.extension-menu').remove()
    } else {
        createSideMenu()
    }

    isVisibleSideMenu = !isVisibleSideMenu;
}


function createSideMenu() {
    let sideMenuHTML = `
        <div class="extension-menu" style="background-color: steelblue; position: absolute; top: 50px; z-index: 9999;">
            <button id="addUrlButton" style="display: block; background-color: #007bff; color: #fff; border: none; padding: 8px 12px; margin-bottom: 10px;">URLを追加</button>
            <button id="resetUrlButton" style="display: block; background-color: #dc3545; color: #fff; border: none; padding: 8px 12px; margin-bottom: 10px;">URLをリセット</button>
            <hr style="border: none; border-top: 1px solid #fff; margin: 10px 0;">
            <div id="jstree_demo_div"></div>
        </div>
    `;

    let sideMenuElement = new DOMParser().parseFromString(sideMenuHTML, 'text/html').body.firstChild;

    sideMenuElement.querySelector('#addUrlButton').addEventListener('click', function() {
        let title = window.prompt("URLのタイトルを入力してください");
        if (title) {
            let newUrl = {
                title: title,
                link: window.location.href
            };

            addUrl(newUrl, function() {
                console.log("New URL added successfully.");
                toggleSideMenu();
                toggleSideMenu();
            });
        }
    });

    sideMenuElement.querySelector('#resetUrlButton').addEventListener('click', function() {
        resetUrl();
        toggleSideMenu();
        toggleSideMenu();
    });

    getUrl().then(() => {
        $('#jstree_demo_div').jstree({
            'core': {
                'data': treeData,
                'worker': false
            }
        });

        // リンクを追加
        for (let title in links) {
            if (links.hasOwnProperty(title)) {
                let link = document.createElement('a');
                link.textContent = title;
                link.href = links[title];
                link.classList.add('sidemenu_items');
                sideMenuElement.appendChild(link);
            }
        }
    })

    document.body.appendChild(sideMenuElement);
}

function resetUrl() {
    let urls = {
        "Google": "https://www.google.com",
        "Yahoo": "https://www.yahoo.com",
        "Bing": "https://www.bing.com",
        "HackMD": "https://localhost:3000"
    }
    chrome.storage.local.set({"urls": urls}, function(){
        console.log("URL reset.");
    });
}

function addUrl(url, callback) {
    chrome.storage.local.get("urls", function(result) {
        let urls = result.urls || {};  // デフォルトは空のオブジェクト

        // 新しい URL を追加
        urls[url.title] = url.link;

        chrome.storage.local.set({"urls": urls}, function(){
            console.log("URL added:", url.title);

            // jsTreeに新しいノードを追加
            let treeInstance = $('#jstree_demo_div').jstree(true);
            let selectedNode = treeInstance.get_selected(true)[0];
            let parentNode = selectedNode ? selectedNode.id : '#';

            treeInstance.create_node(parentNode, { "text": url.title, "data": { "href": url.link } }, "last", function(newNode) {
                treeInstance.open_node(parentNode);  // 親ノードを開く
            });

            if (typeof callback === 'function') {
                callback();
            }
        });
    });
}

function getUrl() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("urls", function(result) {
            console.log(result);
            links = result.urls;
            resolve();
        });
    });
}


