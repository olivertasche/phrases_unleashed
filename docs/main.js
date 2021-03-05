'use strict';

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

    document.querySelector('#download').addEventListener('click', () => {
        new RenderImage();
    });
});

class RenderImage {
    constructor() {
        this.canvas = document.querySelector('#canvas');

        this.container = document.querySelector('.container');
        this.box = document.querySelector('.box');
        this.avatar = document.querySelector('.avatar');
        this.name = document.querySelector('.name');
        this.message = document.querySelector('.message');

        this.context = this.canvas.getContext('2d');

        this.loader = new Loader();

        let avatar = this.loader.loadImage('avatar', this.avatar.src);

        avatar.then(function (loaded) {
            this.render();

            let anchor = document.createElement('a');
            anchor.href = this.canvas.toDataURL('image/png');
            anchor.download = 'phrases_unleashed.png';
            anchor.click();
        }.bind(this));
    }

    render() {
        // Get Bounding Boxes
        let containerBounding = this.container.getBoundingClientRect();
        let containerStyles = getComputedStyle(this.container);

        let boxBounding = this.box.getBoundingClientRect();
        let boxStyles = getComputedStyle(this.box);

        let avatarBounding = this.avatar.getBoundingClientRect();

        let nameBounding = this.name.getBoundingClientRect();
        let nameStyles = getComputedStyle(this.name);

        let messageBounding = this.message.getBoundingClientRect();
        let messageStyles = getComputedStyle(this.message);

        // Generate basic canvas
        let canvas = document.querySelector('#canvas');
        canvas.width = containerBounding.width;
        canvas.height = containerBounding.height;

        let context = canvas.getContext('2d');

        // Fill background
        context.fillStyle = containerStyles.getPropertyValue('background-color');
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw avatar
        this.roundedRect(
            context,
            boxStyles.getPropertyValue('background-color'),
            boxBounding.left - containerBounding.left,
            boxBounding.top - containerBounding.top,
            boxBounding.width,
            boxBounding.height,
            parseInt(boxStyles.getPropertyValue('border-radius'), 10),
            true,
        );

        context.drawImage(
            this.loader.getImage('avatar'),
            avatarBounding.left - containerBounding.left,
            avatarBounding.top - containerBounding.top,
            avatarBounding.width,
            avatarBounding.height
        )

        // Draw name
        context.font = nameStyles.getPropertyValue('font-size') + ' ' + nameStyles.getPropertyValue('font-family');
        context.fillStyle = nameStyles.getPropertyValue('color');
        context.textBaseline = 'top';
        context.fillText(
            this.name.innerText,
            nameBounding.left - containerBounding.left + parseInt(nameStyles.getPropertyValue('padding-left'), 10),
            nameBounding.top - containerBounding.top + parseInt(nameStyles.getPropertyValue('padding-top'), 10) + 2,
            nameBounding.width,
            parseInt(nameStyles.getPropertyValue('font-size'), 10) * 1.18
        );

        // Draw message box
        this.roundedRect(
            context,
            messageStyles.getPropertyValue('border-color'),
            messageBounding.left - containerBounding.left - parseInt(messageStyles.getPropertyValue('border-left-width'), 10),
            messageBounding.top - containerBounding.top - parseInt(messageStyles.getPropertyValue('border-top-width'), 10),
            messageBounding.width + parseInt(messageStyles.getPropertyValue('border-left-width'), 10) + parseInt(messageStyles.getPropertyValue('border-right-width'), 10),
            messageBounding.height + parseInt(messageStyles.getPropertyValue('border-top-width'), 10) + parseInt(messageStyles.getPropertyValue('border-bottom-width'), 10),
            parseInt(messageStyles.getPropertyValue('border-radius'), 10)
            + Math.round(
                (
                    parseInt(messageStyles.getPropertyValue('border-left-width'), 10)
                    + parseInt(messageStyles.getPropertyValue('border-top-width'), 10)
                    + parseInt(messageStyles.getPropertyValue('border-right-width'), 10)
                    + parseInt(messageStyles.getPropertyValue('border-bottom-width'), 10)
                ) / 2
            ),
            true,
        );

        this.roundedRect(
            context,
            messageStyles.getPropertyValue('background-color'),
            messageBounding.left - containerBounding.left,
            messageBounding.top - containerBounding.top,
            messageBounding.width,
            messageBounding.height,
            parseInt(boxStyles.getPropertyValue('border-radius'), 10),
            true,
        );

        // Draw message text
        context.font = messageStyles.getPropertyValue('font-size') + ' ' + messageStyles.getPropertyValue('font-family');
        context.fillStyle = messageStyles.getPropertyValue('color');
        context.textBaseline = 'top';
        this.wrapText(
            context,
            this.message.innerText,
            messageBounding.left - containerBounding.left + parseInt(messageStyles.getPropertyValue('padding-left'), 10),
            messageBounding.top - containerBounding.top + parseInt(messageStyles.getPropertyValue('padding-top'), 10) + 4,
            messageBounding.width - parseInt(messageStyles.getPropertyValue('padding-right'), 10),
            parseInt(messageStyles.getPropertyValue('font-size'), 10) * 1.2
        );
    }

    roundedRect(context, style, x, y, width, height, radius, fill) {
        context.fillStyle = style;
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
    }

    wrapText(context, text, x, y, maxWidth, lineHeight) {
        let lines = text.split("\n");
        let lineCount = 0;

        for (let l = 0; l < lines.length; l++) {
            let words = lines[l].split(' ');
            let line = '';
            let test;
            let metrics;

            for (let i = 0; i < words.length; i++) {
                test = words[i];
                metrics = context.measureText(test);

                while (metrics.width > maxWidth) {
                    // Determine how much of the word will fit
                    test = test.substring(0, test.length - 1);
                    metrics = context.measureText(test);
                }

                if (words[i] != test) {
                    words.splice(i + 1, 0,  words[i].substr(test.length))
                    words[i] = test;
                }

                test = line + words[i] + ' ';
                metrics = context.measureText(test);

                if (metrics.width > maxWidth && i > 0) {
                    context.fillText(line, x, y);
                    line = words[i] + ' ';
                    y += lineHeight;
                    lineCount++;
                } else {
                    line = test;
                }
            }

            context.fillText(line, x, y);
            y += lineHeight;
            lineCount++;
        }
    }
}

class Loader {
    images = {}

    loadImage(key, src) {
        let img = new Image();

        let promise = new Promise(function (resolve, reject) {
            img.onload = function () {
                this.images[key] = img;
                resolve(img);
            }.bind(this);

            img.onerror = function () {
                reject('Could not load image: ' + src);
            };
        }.bind(this));

        img.src = src;

        return promise;
    }

    getImage(key) {
        return (key in this.images) ? this.images[key] : null;
    }
}
