'use strict';

document.addEventListener('DOMContentLoaded', () => {
    let params = new URLSearchParams(window.location.search.toLowerCase());
    let storage = window.localStorage;

    let body = document.querySelector('body');

    let decal = document.querySelector('#decal');
    let decalLayer = document.querySelector('#decal-layer');
    let decals = document.querySelector('#decals');

    let name = document.querySelector('#name');
    let message = document.querySelector('#message');

    let pink = document.querySelector('#pink');
    let styles = document.querySelectorAll('.style');

    decal.src = storage.getItem('decal') ?? 'decals/unknown.png';
    decal.addEventListener('click', function() {
        if (this.classList.contains('disabled')) { return; }
        decalLayer.classList.add('visible');
        body.classList.add('noscroll');
    });

    decalLayer.addEventListener('click', function() {
        decalLayer.classList.remove('visible');
        body.classList.remove('noscroll');
    });

    for (let i = 0; i < decals.children.length; i++) {
        decals.children[i].addEventListener('click', function() {
            let src = this.querySelector('img').src;
            decal.src = src;
            storage.setItem('decal', src);
        });
    }

    name.value = storage.getItem('name') ?? '';
    name.addEventListener('change', function() {
        if (this.classList.contains('disabled')) { return; }
        storage.setItem('name', this.value);
    });

    message.value = storage.getItem('message') ?? '';
    message.addEventListener('change', function() {
        storage.setItem('message', this.value);
    });

    pink.checked = storage.getItem('pink') == 'true';
    pink.addEventListener('change', function() {
        storage.setItem('pink', this.checked ? 'true' : 'false');
    });

    styles.forEach((style) => {
        style.checked = storage.getItem('style') == style.value;
        style.addEventListener('change', function() {
            if (this.checked) {
                storage.setItem('style', this.value);
            }
        });
    });

    // Generate button
    document.querySelector('#generate').addEventListener('click', function() {
        this.disabled = true;

        new RenderImage(
            decal.src,
            name.value,
            message.value,
            pink.checked,
            document.querySelector('input.style:checked')?.value ?? 'phrase',
            !params.has('debug')
        );
    });

    // Presets
    let presets = document.querySelectorAll('.preset-box');

    presets.forEach((preset) => {
        preset.addEventListener('click', function() {
            name.value = this.querySelector('.preset-name').innerText;
            decal.src = this.querySelector('.preset-decal').src;
        });
    });

    // Collapsable
    let collapsables = document.querySelectorAll('.collapsable-button');
    console.log(collapsables);

    for (let i = 0; i < collapsables.length; i++) {
        collapsables[i].addEventListener('click', function() {
            this.classList.toggle('active');

            let collapsableContent = this.parentNode.querySelector('.collapsable-content');

            if (collapsableContent.style.maxHeight){
                collapsableContent.style.maxHeight = null;
            } else {
                collapsableContent.style.maxHeight = collapsableContent.scrollHeight + 'px';
            }
        });
    }

    // Debugger
    if (params.has('debug')) {
        Object.assign(document.querySelector('.render').style, { display: 'block', position: 'relative', left: 0 });
        Object.assign(document.querySelector('#canvas').style, { display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 });
        Object.assign(document.querySelector('#preview').style, { opacity: 0.5, position: 'absolute', top: 0, left: 0, zIndex: 2 });
    }

    // Not really hidden Easteregg
    if (params.has('wisely')) {
        name.value = 'Wisely';
        name.classList.add('disabled');
        name.disabled = true;

        decal.src = 'decals/wisely.png';
        decal.classList.add('disabled');

        document.querySelector('.presets').style.display = 'none';
    }
});

class RenderImage {
    constructor(decal, name, message, pink, style, download = false) {
        if (message == '') {
            message = '...';
        }

        this.canvas = document.querySelector('#canvas');

        this.container = document.querySelector('#preview');
        this.box = document.querySelector('#preview-box');
        this.decal = document.querySelector('#preview-decal');
        this.name = document.querySelector('#preview-name');
        this.message = document.querySelector('#preview-message');

        if (style == 'phrase') {
            this.box.classList.remove('achievement');
        } else {
            this.box.classList.remove('phrase');
        }

        this.box.classList.add(style);

        this.decal.src = decal;
        this.name.innerText = name + (style == 'phrase' ? ':' : '');

        let lines = message.split("\n");
        message = '';

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let words = lines[lineIndex].split(' ');
            let line = '';

            for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
                line += '<span>' + words[wordIndex] + '</span> ';
            }

            message += line.trim();

            if (lineIndex < lines.length - 1) {
                message += '<br>';
            }
        }

        this.message.innerHTML = message;

        if (pink) {
            this.name.classList.add('pink');
        } else {
            this.name.classList.remove('pink');
        }

        this.context = this.canvas.getContext('2d');

        this.loader = new Loader();

        let decalImage = this.loader.loadImage('decal', this.decal.src);

        decalImage.then(function (loaded) {
            this.render();

            if (download) {
                this.download();
            }

            document.querySelector('#generate').disabled = false;
        }.bind(this, download));
    }

    render() {
        // Get Bounding Boxes
        let containerBounding = this.container.getBoundingClientRect();
        let containerStyles = getComputedStyle(this.container);

        let boxBounding = this.box.getBoundingClientRect();
        let boxStyles = getComputedStyle(this.box);

        let decalBounding = this.decal.getBoundingClientRect();

        let nameBounding = this.name.getBoundingClientRect();
        let nameStyles = getComputedStyle(this.name);

        let messageBounding = this.message.getBoundingClientRect();
        let messageStyles = getComputedStyle(this.message);

        let isPhrase = this.box.classList.contains('phrase');

        // Generate basic canvas
        let canvas = this.canvas;
        canvas.width = boxBounding.width
            + parseInt(boxStyles.getPropertyValue('margin-left'), 10)
            + parseInt(boxStyles.getPropertyValue('margin-right'), 10);
        canvas.height = boxBounding.height
            + parseInt(boxStyles.getPropertyValue('margin-top'), 10)
            + parseInt(boxStyles.getPropertyValue('margin-bottom'), 10);

        let context = canvas.getContext('2d');

        // Fill background
        context.fillStyle = containerStyles.getPropertyValue('background-color');
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw box
        this.roundedRect(
            context,
            boxStyles.getPropertyValue('background-color'),
            boxBounding.left - containerBounding.left + .5,
            boxBounding.top - containerBounding.top + .5,
            boxBounding.width,
            boxBounding.height,
            parseInt(boxStyles.getPropertyValue('border-radius'), 10),
            true,
        );

        // Draw decal
        context.drawImage(
            this.loader.getImage('decal'),
            decalBounding.left - containerBounding.left + 1,
            decalBounding.top - containerBounding.top + 1,
            decalBounding.width,
            decalBounding.height
        )

        // Draw name
        context.font = nameStyles.getPropertyValue('font-size') + ' ' + nameStyles.getPropertyValue('font-family');
        context.fillStyle = nameStyles.getPropertyValue('color');
        context.textBaseline = 'top';
        context.fillText(
            this.name.innerText,
            nameBounding.left - containerBounding.left + 1,
            nameBounding.top - containerBounding.top + (isPhrase ? 8 : 11),
            nameBounding.width,
            parseInt(nameStyles.getPropertyValue('font-size'), 10) * 1.18
        );

        // Draw message box
        if (isPhrase) {
            this.roundedRect(
                context,
                messageStyles.getPropertyValue('border-bottom-color'),
                messageBounding.left - containerBounding.left + .5,
                messageBounding.top - containerBounding.top + 1.5,
                messageBounding.width,
                messageBounding.height,
                parseInt(messageStyles.getPropertyValue('border-radius'), 10) + 3,
                true,
            );

            this.roundedRect(
                context,
                messageStyles.getPropertyValue('background-color'),
                messageBounding.left - containerBounding.left + 2.5,
                messageBounding.top - containerBounding.top + 2.5,
                messageBounding.width - 4,
                messageBounding.height - 5,
                parseInt(boxStyles.getPropertyValue('border-radius'), 10),
                true,
            );
        }

        // Draw message text
        context.font = messageStyles.getPropertyValue('font-weight') + ' '
            + messageStyles.getPropertyValue('font-size') + ' '
            + messageStyles.getPropertyValue('font-family');
        context.fillStyle = messageStyles.getPropertyValue('color');
        context.textBaseline = 'top';

        let modifyX = 0;
        let modifyY = 15;

        if (isPhrase) {
            modifyX = 0;
            modifyY = 5;
        }

        for (let word of this.message.children) {
            let wordBounding = word.getBoundingClientRect();

            let x = wordBounding.left - containerBounding.left + modifyX;
            let y = wordBounding.top - containerBounding.top + modifyY;

            [...word.innerText].forEach((letter) => {
                context.fillText(letter, x, y);
                x += context.measureText(letter).width * 0.95;
            });
        }
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

    download() {
        let anchor = document.createElement('a');
        anchor.href = this.canvas.toDataURL('image/png');
        anchor.download = 'llpu_' + random(6) + '.png';
        anchor.click();
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

let random = (length) => {
   let result = '';
   var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;

   for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }

   return result;
}
