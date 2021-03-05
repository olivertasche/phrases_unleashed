document.addEventListener('DOMContentLoaded', () => {
    let storage = window.localStorage;

    stringHandler('name', 'Playername');
    stringHandler('message', 'Don\'t be rude!');

    function stringHandler(selector, fallback) {
        let element = document.querySelector('#' + selector);
        element.innerText = storage.getItem(selector) ?? fallback;
        element.addEventListener('input', (event) => {
            storage.setItem(selector, event.target.innerText);
        });
    }

    let name = document.querySelector('.name');
    let pinkToggle = document.querySelector('#pinkToggle');

    pinkToggle.checked = storage.getItem('pink') == 'true';
    pinkToggle.addEventListener('change', function() {
        storage.setItem('pink', this.checked ? 'true' : 'false');
        togglePink(this.checked);
    });

    togglePink(pinkToggle.checked);

    function togglePink(active) {
        if (active) {
            name.classList.add('pink');
        } else {
            name.classList.remove('pink');
        }
    }

    let avatar = document.querySelector('#avatar');
    let avatarList = document.querySelector('#list');

    avatar.src = storage.getItem('avatar') ?? '.png';
    avatar.addEventListener('click', (event) => {
        avatarList.style.display = 'inline-block';
        event.stopPropagation();
    });

    for (let i = 0; i < avatarList.children.length; i++) {
        avatarList.children[i].addEventListener('click', (event) => {
            avatar.src = event.target.src;
            storage.setItem('avatar', event.target.src);
            avatarList.style.display = 'none';
        });
    }

    document.querySelector('body').addEventListener('click', () => {
        avatarList.style.display = 'none';
    });

    let download = document.querySelector('#download');
    let container = document.querySelector('.container');

    download.addEventListener('click', () => {
        html2canvas(container).then(function(canvas) {
            const anchor = document.createElement('a');

            anchor.href = canvas.toDataURL('image/png');
            anchor.download = 'phrases_unleashed.png';
            anchor.click();
        });
    });
});
