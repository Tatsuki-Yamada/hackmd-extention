var isVisibleSideMenu = false;
var links = {};
var folderStructure = {};

addFeaturesAttempt();

// 初期データをリセット
resetUrl();

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

    let addDistElement = document.querySelector('.btn-group'); // ナイトテーマのボタン

    if (!addDistElement) {
        console.log("Target element not found!");
        return;
    }

    // 要素の親ノードに対して挿入する
    addDistElement.parentNode.insertBefore(button, addDistElement.nextSibling);
}

function toggleSideMenu(event) {
    if (isVisibleSideMenu) {
        document.querySelector('.extension-menu').remove();
    } else {
        createSideMenu();
    }

    isVisibleSideMenu = !isVisibleSideMenu;
}

function createSideMenu() {
    let topPosition = document.querySelector('.collapse.navbar-collapse').offsetHeight + 1;     // +1 はメニューバーの下に謎の1pxの空間があるため追加している。

    let sideMenuHTML = `
        <div class="extension-menu" style="top: ${topPosition};">
            <button class="extention-add-url-button">このページを追加</button>
            <button id="resetUrlButton" style="display: block; background-color: #dc3545; color: #fff; border: none; padding: 8px 12px; margin-bottom: 10px;">URLをリセット</button>
            <hr class="extention-border">
            <div id="folderContainer"></div>
        </div>
    `;

    let sideMenuElement = new DOMParser().parseFromString(sideMenuHTML, 'text/html').body.firstChild;

    sideMenuElement.querySelector('.extention-add-url-button').addEventListener('click', function() {
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

    document.body.appendChild(sideMenuElement);

    // サイドメニューがDOMに追加された後にフォルダ構造をレンダリング
    renderFolders(folderStructure);
}

function resetUrl() {
    let urls = {
        "folderA/Google": "https://www.google.com",
        "folderA/Yahoo": "https://www.yahoo.com",
        "folderB/Bing": "https://www.bing.com",
        "folderB/HackMD": "https://localhost:3000"
    }
    chrome.storage.local.set({"urls": urls}, function() {
        console.log("URL reset.");
        folderStructure = buildFolderStructure(urls);
    });
}

function addUrl(url, callback) {
    chrome.storage.local.get("urls", function(result) {
        let urls = result.urls || {};  // デフォルトは空のオブジェクト

        // 新しい URL を追加
        urls[url.title] = url.link;

        chrome.storage.local.set({"urls": urls}, function() {
            console.log("URL added:", url.title);
            folderStructure = buildFolderStructure(urls);
            renderFolders(folderStructure);

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
            folderStructure = buildFolderStructure(result.urls || {});
            resolve();
        });
    });
}

function buildFolderStructure(urls) {
    let structure = {};
    for (let key in urls) {
        const parts = key.split('/');
        let current = structure;

        parts.forEach((part, index) => {
            // その階層が存在していなければ
            if (!current[part]) {
                // 階層の終端ならリンク付きのオブジェクトを、そうでなｋれば空のオブジェクト（フォルダー）を作成する。
                current[part] = (index === parts.length - 1) ? { link: urls[key] } : {};
            }
            // 一つ下の階層に行く。
            current = current[part];
        });
    }
    return structure;
}

function createFolderElement(name, children) {
    const folderElement = document.createElement('li');
    folderElement.classList.add('folder');

    // フォルダの開閉アイコンの追加
    const icon = document.createElement('span');
    icon.classList.add('folder-icon');
    if (Object.keys(children).length > 0) {
        icon.textContent = '▶ '; // フォルダが展開されていないときのアイコン
    } else {
        icon.textContent = '▼ '; // フォルダが展開されているときのアイコン
    }
    folderElement.appendChild(icon);

    // フォルダ名の追加
    const folderName = document.createElement('span');
    folderName.textContent = name;
    folderElement.appendChild(folderName);

    // 子要素リストの作成と追加
    const childList = document.createElement('ul');
    childList.classList.add('hidden');
    for (const key in children) {
        if (children[key].link) {
            childList.appendChild(createFileElement(key, children[key].link));
        } else {
            childList.appendChild(createFolderElement(key, children[key]));
        }
    }
    folderElement.appendChild(childList);

    // クリックで展開・折りたたみ
    folderElement.addEventListener('click', function (e) {
        e.stopPropagation();
        childList.classList.toggle('hidden');
        if (childList.classList.contains('hidden')) {
            icon.textContent = '▶ ';
        } else {
            icon.textContent = '▼ ';
        }
    });

    return folderElement;
}

function createFileElement(name, link) {
    const fileElement = document.createElement('li');
    fileElement.classList.add('file');
    const fileLink = document.createElement('a');
    fileLink.textContent = name;
    fileLink.href = link;
    fileElement.appendChild(fileLink);
    return fileElement;
}

function renderFolders(structure) {
    const container = document.getElementById('folderContainer');
    if (!container) {
        console.log('folderContainer element not found.');
        return;
    }
    container.innerHTML = '';

    const rootList = document.createElement('ul');
    rootList.classList.add('root-list')

    for (const key in structure) {
        rootList.appendChild(createFolderElement(key, structure[key]));
    }

    container.appendChild(rootList);
}
