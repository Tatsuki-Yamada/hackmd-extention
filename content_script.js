var isVisibleSideMenu = false;

var links = {};

addFeaturesAttempt();

setUrl();


function addFeaturesAttempt() {
    if (!addMenu()) setTimeout(addFeaturesAttempt, 500);
}


function addMenu() {
    console.log("Executed!");

    let targetElement = document.querySelector('.nav.action-group.navbar-nav.navbar-left');

    if (!targetElement) {
        console.log("No target element found!");
        return false;
    }

    copyIconButtonElement();

    return true;
}

function copyIconButtonElement() {
    let originalElement = document.querySelector('[data-original-title="ヘルプ"]');

    // 要素を複製（true を渡すと、子ノードも含めて完全に複製）
    let clonedElement = originalElement.cloneNode(true);

    // 複製された要素を書き換える
    clonedElement.setAttribute('data-original-title', 'リンク一覧');
    clonedElement.querySelector('i.fa').className = 'fa fa-align-left fa-18';
    clonedElement.onclick = toggleSideMenu;

    // 複製された要素を DOM に追加（ここでは元の要素の後に追加）
    originalElement.parentNode.insertBefore(clonedElement, originalElement.nextSibling);
}


function toggleSideMenu(event) {
    event.stopPropagation(); // イベントの伝播を止める

    if (isVisibleSideMenu) {
        document.querySelector('.extension-menu').remove()
    } else {
        createSideMenu()
    }

    isVisibleSideMenu = !isVisibleSideMenu;
}


function createSideMenu() {
    let sideMenu = document.createElement('div');
    sideMenu.className = "extension-menu";
    sideMenu.style.backgroundColor = "steelblue";
    sideMenu.style.position = "absolute";
    sideMenu.style.top = "50px";

    getUrl().then(() => {
        // リンクを追加
        for (let title in links) {
            if (links.hasOwnProperty(title)) {
                let link = document.createElement('a');
                link.textContent = title;
                link.href = links[title];
                link.style.display = 'block';
                link.style.color = '#fff';
                link.style.padding = '8px';
                link.style.textDecoration = 'none';

                sideMenu.appendChild(link);
            }
        }
    })

    document.body.appendChild(sideMenu);
}

function setUrl() {
    let urls = {
        "Google": "https://www.google.com",
        "Yahoo": "https://www.yahoo.com",
        "Bing": "https://www.bing.com",
        "HackMD": "https://hackmd.io/19pBt7mvQSmspCe7znv78Q?both#"
    }
    chrome.storage.local.set({"urls": urls}, function(){
        console.log("URL saved.")
    })
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


