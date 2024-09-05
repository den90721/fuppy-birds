const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// CSS стили
const style = document.createElement('style');
style.innerHTML = `
    html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        height: 100%;
        width: 100%;
    }
    #gameCanvas {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
    }
    img {
        image-rendering: crisp-edges;
    }
`;
document.head.appendChild(style);

// Загрузка кастомного шрифта
const flappyFont = new FontFace('FlappyFont', 'url(assets/Flappy-font.ttf)');

flappyFont.load().then(function(loadedFont) {
    document.fonts.add(loadedFont);
}).catch(function(error) {
    console.error('Failed to load font:', error);
});

// Параметры элементов
let scale = 1;
let bird = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    gravity: 0.2,
    lift: -3.6,
    velocity: 0,
    rotation: 0
};

let pipes = [];
let pipeWidth = 50;
let pipeHeight = 357;
let pipeGap = 150 * scale;
let frameCount = 0;
let score = 0;
let collectedCoins = 0;
let gameStarted = false;
let gameOver = false;
let birdHit = false;

let coctels = [];
const coctelSpawnChance = 0.1;

let coins = [];
let coinInterval = 50;

let groundX = 0;
const groundSpeed = 2;
let passedPipe = false;

let drunkenEffect = false;
let drunkenDuration = 0;
let shakeEffect = false;
let shakeDuration = 0;
let glitchEffect = false;
let glitchDuration = 0;
let backgroundGif = false;
let showTablo = false;

let shakeOnHit = false;

const coinsForPromoCode = 150;
const promoCode = "AVAHUNNA100";

// Загрузка изображений
const birdImg = new Image();
birdImg.src = 'assets/bird.png';

const pipeImg = new Image();
pipeImg.src = 'assets/pipe.png';

const zemlaImg = new Image();
zemlaImg.src = 'assets/zemla.png';

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';

const fonGif = new Image();
fonGif.src = 'assets/fon.gif';

const coctelImg = new Image();
coctelImg.src = 'assets/coctel.png';

const coinImg = new Image();
coinImg.src = 'assets/coin.png';

const tabloImg = new Image();
tabloImg.src = 'assets/tablo (4).svg';

const overImg = new Image();
overImg.src = 'assets/OVER.svg';

const puskImg = new Image();
puskImg.src = 'assets/pusk.svg';

const zastavkaImg = new Image();
zastavkaImg.src = 'assets/zastavka (2).png';

const logoImg = new Image();
logoImg.src = 'assets/Logo.svg';

const zastavkaScale = 1.5;
const logoScale = 1.7;

let showZastavka = false;
let showLogo = false;

logoImg.onload = function() {
    showLogo = true;
    render();
};

zastavkaImg.onload = function() {
    showZastavka = true;
    render();
};

let animationFrameId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = canvas.width / 320;
    bird.width = 40 * scale;
    bird.height = 40 * scale;
    pipeWidth = 50 * scale;
    pipeHeight = 357 * scale;
    pipeGap = 150 * scale;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Добавляем обработчик клика для холста для первого запуска игры
canvas.addEventListener('click', function (event) {
    if (!gameStarted && !gameOver) {
        // Игра не запущена, запускаем её
        showZastavka = false;
        showLogo = false;
        showTablo = false;
        resetGame();
        gameStarted = true;
        startGameLoop();
    } else if (gameStarted && !gameOver) {
        // Игра запущена, поднимаем птицу
        bird.velocity = bird.lift;
    } else if (gameOver && showTablo) {
        // Проверяем клик по кнопке "Pusk"
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const puskImgWidth = puskImg.width * scale;
        const puskImgHeight = puskImg.height * scale;
        const puskImgX = (canvas.width - puskImgWidth) / 2;
        const puskImgY = (canvas.height - puskImgHeight) / 2 + 100 * scale; // отрегулируйте позицию по Y

        // Проверка, попал ли клик в область изображения "Pusk"
        if (mouseX >= puskImgX && mouseX <= puskImgX + puskImgWidth &&
            mouseY >= puskImgY && mouseY <= puskImgY + puskImgHeight) {
            showZastavka = false;
            showLogo = false;
            showTablo = false;
            resetGame();
            gameStarted = true;
            gameOver = false;
            startGameLoop();
        }
    }
});

function gameLoop() {
    update();
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update() {
    if (gameOver) {
        if (bird.y + bird.height < canvas.height - 50) {
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;
        } else {
            if (!showTablo) {
                setTimeout(() => {
                    showTablo = true;
                }, 100);
            }
        }
        return;
    }

    if (birdHit) {
        bird.velocity = 0;
        bird.rotation = -Math.PI / 4;
        shakeEffect = true;
        shakeDuration = 15;

        setTimeout(() => {
            birdHit = false;
            gameOver = true;
            shakeEffect = false;
        }, 500);
        return;
    }

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 4, bird.velocity / 15);

    if (bird.y + bird.height > canvas.height - 50) {
        bird.y = canvas.height - bird.height - 50;
        bird.velocity = 0;
        gameOver = true;
        return;
    }
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
        gameOver = true;
        return;
    }

    if (frameCount % 75 === 0) {
        let minY = 50 * scale;
        let maxY = canvas.height - 200 * scale - pipeGap;
        let pipeY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        let pipe = { x: canvas.width, y: pipeY };
        pipes.push(pipe);

        if (Math.random() < coctelSpawnChance) {
            let coctelY = pipeY + Math.random() * (pipeGap - 30 * scale);
            coctels.push({
                x: pipe.x,
                y: coctelY,
                width: 30 * scale,
                height: 30 * scale,
                isVisible: true
            });
        }
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= 2 * scale;

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
            passedPipe = false;
        }

        let pipeTop = pipe.y;
        let pipeBottom = pipeTop + pipeGap;

        if (
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipeTop || bird.y + bird.height > pipeBottom)
        ) {
            birdHit = true;
            return;
        }

        if (!passedPipe && pipe.x + pipeWidth < bird.x) {
            score++;
            passedPipe = true;
        }
    });

    coctels.forEach((coctel, index) => {
        coctel.x -= 2 * scale;

        if (coctel.x + coctel.width < 0) {
            coctels.splice(index, 1);
        }

        if (
            coctel.isVisible &&
            bird.x < coctel.x + coctel.width &&
            bird.x + bird.width > coctel.x &&
            bird.y < coctel.y + coctel.height &&
            bird.y + bird.height > coctel.y
        ) {
            coctel.isVisible = false;
            activateDrunkenMode();
        }
    });

    if (frameCount % (coinInterval + Math.floor(Math.random() * 100)) === 0) {
        const randomPipeIndex = Math.floor(Math.random() * pipes.length);
        const pipe = pipes[randomPipeIndex];
        if (pipe) {
            let coinX = pipe.x - 30 * scale;
            let coinY = pipe.y + Math.random() * (pipeGap - 30 * scale);

            coins.push({ x: coinX, y: coinY, width: 30 * scale, height: 30 * scale });
        }
    };

    coins.forEach((coin, index) => {
        coin.x -= 2 * scale;

        if (coin.x + coin.width < 0) {
            coins.splice(index, 1);
        }

        if (
            bird.x < coin.x + coin.width &&
            bird.x + bird.width > coin.x &&
            bird.y < coin.y + coin.height &&
            bird.y + bird.height > coin.y
        ) {
            coins.splice(index, 1);
            collectedCoins++;
        }
    });

    frameCount++;
    groundX -= groundSpeed * scale;
    if (groundX <= -canvas.width) {
        groundX = 0;
    }

    if (drunkenEffect) {
        bird.velocity += Math.random() * 0.6 - 0.3;
        bird.rotation += Math.random() * 0.1 - 0.05;
        drunkenDuration--;
        if (drunkenDuration <= 0) {
            drunkenEffect = false;
            shakeEffect = false;
            glitchEffect = false;
            backgroundGif = false;
        }
    }

    if (shakeEffect) {
        shakeDuration--;
        if (shakeDuration <= 0) {
            shakeEffect = false;
        }
    }

    if (glitchEffect) {
        glitchDuration--;
        if (glitchDuration <= 0) {
            glitchEffect = false;
            backgroundGif = false;
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showZastavka && showLogo) {
        const zastavkaWidth = zastavkaImg.width * zastavkaScale;
        const zastavkaHeight = zastavkaImg.height * zastavkaScale;
        const zastavkaX = (canvas.width - zastavkaWidth) / 2;
        const zastavkaY = (canvas.height - zastavkaHeight) / 2;

        const logoWidth = logoImg.width * logoScale;
        const logoHeight = logoImg.height * logoScale;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = zastavkaY - logoHeight - 150 * scale;

        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        ctx.drawImage(zastavkaImg, zastavkaX, zastavkaY, zastavkaWidth, zastavkaHeight);
        return;
    }

    if (backgroundGif) {
        ctx.drawImage(fonGif, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    if (shakeEffect) {
        const shakeOffsetX = Math.random() * 10 - 5;
        const shakeOffsetY = Math.random() * 10 - 5;
        ctx.translate(shakeOffsetX, shakeOffsetY);
    }

    pipes.forEach(pipe => {
        let pipeTop = pipe.y;
        let pipeBottom = pipeTop + pipeGap;

        ctx.drawImage(pipeImg, pipe.x, pipeBottom, pipeWidth, canvas.height - pipeBottom - 50 * scale);
        ctx.save();
        ctx.translate(pipe.x + pipeWidth / 2, pipeTop);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImg, -pipeWidth / 2, 0, pipeWidth, pipeHeight);
        ctx.restore();
    });

    coctels.forEach(coctel => {
        if (coctel.isVisible) {
            ctx.drawImage(coctelImg, coctel.x, coctel.y, coctel.width, coctel.height);
        }
    });

    coins.forEach(coin => {
        ctx.drawImage(coinImg, coin.x, coin.y, coin.width, coin.height);
    });

    ctx.drawImage(zemlaImg, groundX, canvas.height - 50 * scale, canvas.width, 50 * scale);
    ctx.drawImage(zemlaImg, groundX + canvas.width, canvas.height - 50 * scale, canvas.width, 50 * scale);

    ctx.save();
    if (shakeEffect) {
        const shakeOffsetX = Math.random() * 5 - 2.5;
        const shakeOffsetY = Math.random() * 5 - 2.5;
        ctx.translate(shakeOffsetX, shakeOffsetY);
    }
    if (glitchEffect) {
        const glitchOffsetX = Math.random() * 5 - 2.5;
        const glitchOffsetY = Math.random() * 5 - 2.5;
        ctx.translate(glitchOffsetX, glitchOffsetY);
    }
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();

    ctx.font = `${48 * scale}px FlappyFont`;
    ctx.fillStyle = '#FCB800';
    ctx.fillText(score, canvas.width / 2 - 10 * scale, 100 * scale);

    ctx.drawImage(coinImg, 10 * scale, 10 * scale, 30 * scale, 30 * scale);
    ctx.font = `${24 * scale}px FlappyFont`;
    ctx.fillStyle = '#FFF';
    ctx.fillText(collectedCoins, 50 * scale, 30 * scale);

    if (showTablo) {
        const tabloWidth = tabloImg.width * scale;
        const tabloHeight = tabloImg.height * scale;
        const tabloX = (canvas.width - tabloWidth) / 2;
        const tabloY = (canvas.height - tabloHeight) / 2;

        const overImgWidth = overImg.width * scale;
        const overImgHeight = overImg.height * scale;
        const overImgX = (canvas.width - overImgWidth) / 2;
        const overImgY = tabloY - overImgHeight - 50 * scale;

        ctx.drawImage(overImg, overImgX, overImgY, overImgWidth, overImgHeight);

        ctx.drawImage(tabloImg, tabloX, tabloY, tabloWidth, tabloHeight);

        const puskImgWidth = puskImg.width * scale;
        const puskImgHeight = puskImg.height * scale;
        const puskImgX = (canvas.width - puskImgWidth) / 2;
        const puskImgY = tabloY + tabloHeight + 20 * scale;

        ctx.drawImage(puskImg, puskImgX, puskImgY, puskImgWidth, puskImgHeight);

        ctx.font = `${36 * scale}px FlappyFont`;
        ctx.fillStyle = '#FFF';
        ctx.fillText(collectedCoins, tabloX + tabloWidth - 66 * scale, tabloY + 57 * scale);
        ctx.fillText(score, tabloX + tabloWidth - 66 * scale, tabloY + 98 * scale);

        if (collectedCoins >= coinsForPromoCode) {
            ctx.font = `${15 * scale}px Arial`;
            ctx.fillStyle = '#FFF';
            ctx.fillText(promoCode, tabloX + 20 * scale, tabloY + 65 * scale);
        }
    }

    ctx.restore();
}

function resetGame() {
    cancelAnimationFrame(animationFrameId);
    bird.x = 50;
    bird.y = 150 * scale;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    coctels = [];
    coins = [];
    frameCount = 0;
    score = 0;
    collectedCoins = 0;
    passedPipe = false;
    birdHit = false;
    drunkenEffect = false;
    shakeEffect = false;
    glitchEffect = false;
    backgroundGif = false;
    showTablo = false;
    gameOver = false;
}

function activateDrunkenMode() {
    drunkenEffect = true;
    drunkenDuration = 1200;
    shakeEffect = true;
    shakeDuration = 150;
    glitchEffect = true;
    glitchDuration = 150;
    backgroundGif = true;
}
