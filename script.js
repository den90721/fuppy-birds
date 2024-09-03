const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// CSS стили
const style = document.createElement('style');
style.innerHTML = `
    html, body {
        margin: 0;
        padding: 0;
        overflow: hidden; /* Отключаем скроллинг */
        height: 100%;
        width: 100%;
    }
    #gameCanvas {
        display: block; /* Убираем возможные отступы вокруг холста */
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
    gravity: 0.4,
    lift: -6,
    velocity: 0,
    rotation: 0 // Угол для поворота птицы
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
let birdHit = false; // Новый флаг для удара

let coctels = []; // Массив для коктейлей
const coctelSpawnChance = 0.2; // Вероятность появления коктейля (20%)

let coins = [];
let coinInterval = 320; // Интервал появления монет

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

let shakeOnHit = false; // Флаг для активации тряски при ударе

// Условие для отображения промокода
const coinsForPromoCode = 1; // Количество монет для появления промокода
const promoCode = "PROMO123"; // Сам промокод

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
fonGif.src = 'assets/fon.gif'; // Гифка фона

const coctelImg = new Image();
coctelImg.src = 'assets/coctel.png'; // Используем правильный путь к изображению коктейля

const coinImg = new Image();
coinImg.src = 'assets/coin.png'; // Монетка

const tabloImg = new Image();
tabloImg.src = 'assets/tablo (3).svg'; // Заменяем tablo.png на tablo.svg

const overImg = new Image();
overImg.src = 'assets/over.svg'; // Загружаем изображение "Game Over"

const puskImg = new Image();
puskImg.src = 'assets/pusk.svg'; // Загружаем изображение "Pusk"

const zastavkaImg = new Image();
zastavkaImg.src = 'assets/zastavka (1).png'; // Загрузка изображения заставки

const logoImg = new Image();
logoImg.src = 'assets/Logo.svg'; // Загрузка изображения логотипа

const zastavkaScale = 1.5; // Коэффициент масштабирования для заставки
const logoScale = 1.7; // Коэффициент масштабирования для логотипа

let showZastavka = false; // Флаг для отображения заставки
let showLogo = false; // Флаг для отображения логотипа

// Отрисовка заставки и логотипа только после их полной загрузки
logoImg.onload = function() {
    showLogo = true;
    render();
};

zastavkaImg.onload = function() {
    showZastavka = true;
    render(); // Обновляем экран с заставкой и логотипом
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

canvas.addEventListener('click', function () {
    if (!gameStarted || gameOver) {
        showZastavka = false; // Скрываем заставку перед запуском новой игры
        showLogo = false; // Скрываем логотип перед запуском новой игры
        showTablo = false; // Скрываем таблицу перед запуском новой игры
        resetGame();
        gameStarted = true;
        gameOver = false;
        startGameLoop();
    } else {
        bird.velocity = bird.lift;
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
        // Если игра завершена, и птица еще не на земле, продолжаем её движение вниз
        if (bird.y + bird.height < canvas.height - 50) {
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;
        } else {
            // Птица достигла земли, показываем табло
            if (!showTablo) {
                setTimeout(() => {
                    showTablo = true; // Показываем таблицу
                }, 100); // Задержка перед отображением табло (500 мс)
            }
        }
        return;
    }

    if (birdHit) {
        // Если птица ударилась о трубу, даем задержку перед падением
        bird.velocity = 0;
        bird.rotation = -Math.PI / 4; // Поворот птицы при ударе
        shakeEffect = true; // Включаем эффект тряски
        shakeDuration = 15; // Устанавливаем кратковременную тряску

        setTimeout(() => {
            birdHit = false;
            gameOver = true; // Переходим в состояние падения
            shakeEffect = false; // Отключаем эффект тряски после удара
        }, 500); // Задержка перед падением (500 мс)
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

    // Генерация труб
    if (frameCount % 75 === 0) {
        let minY = 50 * scale;
        let maxY = canvas.height - 200 * scale - pipeGap;
        let pipeY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
        let pipe = { x: canvas.width, y: pipeY };
        pipes.push(pipe);

        // Добавляем коктейль с редкой вероятностью
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

    // Обновление положения труб
    pipes.forEach((pipe, index) => {
        pipe.x -= 2 * scale;

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
            passedPipe = false;
        }

        let pipeTop = pipe.y;
        let pipeBottom = pipeTop + pipeGap;

        // Проверка на столкновение
        if (
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipeTop || bird.y + bird.height > pipeBottom)
        ) {
            birdHit = true; // Устанавливаем флаг удара
            return;
        }

        if (!passedPipe && pipe.x + pipeWidth < bird.x) {
            score++;
            passedPipe = true;
        }
    });

    // Обновление коктейлей
    coctels.forEach((coctel, index) => {
        coctel.x -= 2 * scale;

        if (coctel.x + coctel.width < 0) {
            coctels.splice(index, 1);
        }

        // Проверка на столкновение с коктейлем
        if (
            coctel.isVisible &&
            bird.x < coctel.x + coctel.width &&
            bird.x + bird.width > coctel.x &&
            bird.y < coctel.y + coctel.height &&
            bird.y + bird.height > coctel.y
        ) {
            coctel.isVisible = false;
            activateDrunkenMode(); // Активируем "пьяный режим"
        }
    });

    // Обновление монет
    if (frameCount % (coinInterval + Math.floor(Math.random() * 200)) === 0) { // Случайный интервал появления монет
        const randomPipeIndex = Math.floor(Math.random() * pipes.length); // Выбираем случайную трубу для монет
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

        // Проверка на столкновение с монетой
        if (
            bird.x < coin.x + coin.width &&
            bird.x + bird.width > coin.x &&
            bird.y < coin.y + coin.height &&
            bird.y + bird.height > coin.y
        ) {
            coins.splice(index, 1);
            collectedCoins++; // Увеличиваем счетчик монет
        }
    });

    frameCount++;
    groundX -= groundSpeed * scale;
    if (groundX <= -canvas.width) {
        groundX = 0;
    }

    // Эффект опьянения: усложненное управление птицей
    if (drunkenEffect) {
        bird.velocity += Math.random() * 0.6 - 0.3; // Добавление случайных изменений в скорость
        bird.rotation += Math.random() * 0.1 - 0.05; // Случайное изменение угла поворота
        drunkenDuration--;
        if (drunkenDuration <= 0) {
            drunkenEffect = false; // Окончание эффекта опьянения
            shakeEffect = false; // Окончание эффекта тряски
            glitchEffect = false; // Окончание глитч-эффекта
            backgroundGif = false; // Возвращаем фон к исходному состоянию
        }
    }

    // Эффект тряски
    if (shakeEffect) {
        shakeDuration--;
        if (shakeDuration <= 0) {
            shakeEffect = false; // Остановка тряски
        }
    }

    // Эффект глитча
    if (glitchEffect) {
        glitchDuration--;
        if (glitchDuration <= 0) {
            glitchEffect = false; // Остановка глитч-эффекта
            backgroundGif = false; // Вернуть фон к исходному
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка логотипа и заставки, если изображение загружено и игра еще не началась
    if (showZastavka && showLogo) {
        const zastavkaWidth = zastavkaImg.width * zastavkaScale;
        const zastavkaHeight = zastavkaImg.height * zastavkaScale;
        const zastavkaX = (canvas.width - zastavkaWidth) / 2;
        const zastavkaY = (canvas.height - zastavkaHeight) / 2;

        const logoWidth = logoImg.width * logoScale;
        const logoHeight = logoImg.height * logoScale;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = zastavkaY - logoHeight - 150 * scale; // Отступ 20px над заставкой

        // Отрисовка логотипа выше заставки
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // Отрисовка заставки
        ctx.drawImage(zastavkaImg, zastavkaX, zastavkaY, zastavkaWidth, zastavkaHeight);
        return; // Остановить дальнейшую отрисовку, пока отображается заставка
    }

    // Отрисовка фона
    if (backgroundGif) {
        ctx.drawImage(fonGif, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }

    // Эффект тряски для труб и всего экрана
    ctx.save();
    if (shakeEffect) {
        const shakeOffsetX = Math.random() * 10 - 5; // Больший эффект тряски при ударе
        const shakeOffsetY = Math.random() * 10 - 5;
        ctx.translate(shakeOffsetX, shakeOffsetY);
    }

    // Отрисовка труб
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

    // Отрисовка коктейлей
    coctels.forEach(coctel => {
        if (coctel.isVisible) {
            ctx.drawImage(coctelImg, coctel.x, coctel.y, coctel.width, coctel.height);
        }
    });

    // Отрисовка монет
    coins.forEach(coin => {
        ctx.drawImage(coinImg, coin.x, coin.y, coin.width, coin.height);
    });

    // Отрисовка земли
    ctx.drawImage(zemlaImg, groundX, canvas.height - 50 * scale, canvas.width, 50 * scale);
    ctx.drawImage(zemlaImg, groundX + canvas.width, canvas.height - 50 * scale, canvas.width, 50 * scale);

    // Эффект тряски и глитча для птички
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

    // Отрисовка счета
    ctx.font = `${48 * scale}px FlappyFont`; // Используем кастомный шрифт
    ctx.fillStyle = '#FCB800';
    ctx.fillText(score, canvas.width / 2 - 10 * scale, 100 * scale);

    // Отрисовка счетчика монет
    ctx.drawImage(coinImg, 10 * scale, 10 * scale, 30 * scale, 30 * scale);
    ctx.font = `${24 * scale}px FlappyFont`; // Используем кастомный шрифт
    ctx.fillStyle = '#FFF';
    ctx.fillText(collectedCoins, 50 * scale, 30 * scale);

    // Отрисовка табло и изображения "Game Over", если игра окончена
    if (showTablo) {
        const tabloWidth = tabloImg.width * scale;
        const tabloHeight = tabloImg.height * scale;
        const tabloX = (canvas.width - tabloWidth) / 2;
        const tabloY = (canvas.height - tabloHeight) / 2;

        // Отрисовка изображения "Game Over" чуть выше таблицы
        const overImgWidth = overImg.width * scale;
        const overImgHeight = overImg.height * scale;
        const overImgX = (canvas.width - overImgWidth) / 2;
        const overImgY = tabloY - overImgHeight - 50 * scale; // Отступ 20px над таблицей

        ctx.drawImage(overImg, overImgX, overImgY, overImgWidth, overImgHeight);

        // Отрисовка таблицы
        ctx.drawImage(tabloImg, tabloX, tabloY, tabloWidth, tabloHeight);

        // Отрисовка изображения "Pusk" ниже таблицы
        const puskImgWidth = puskImg.width * scale;
        const puskImgHeight = puskImg.height * scale;
        const puskImgX = (canvas.width - puskImgWidth) / 2;
        const puskImgY = tabloY + tabloHeight + 20 * scale; // Отступ 20px под таблицей

        ctx.drawImage(puskImg, puskImgX, puskImgY, puskImgWidth, puskImgHeight);

        // Отрисовка счетчиков на табло (монеты первым, счет вторым)
        ctx.font = `${36 * scale}px FlappyFont`;
        ctx.fillStyle = '#FFF';
        ctx.fillText(collectedCoins, tabloX + tabloWidth - 66 * scale, tabloY + 57 * scale); // Монеты
        ctx.fillText(score, tabloX + tabloWidth - 66 * scale, tabloY + 98 * scale); // Счет

        // Отображение только промокода обычным шрифтом Arial, если собрано достаточно монет
        if (collectedCoins >= coinsForPromoCode) {
            ctx.font = `${15 * scale}px Arial`; // Шрифт Arial для промокода
            ctx.fillStyle = '#FFF';
            ctx.fillText(promoCode, tabloX + 20 * scale, tabloY + 65 * scale); // Промокод без слова "Promo"
        }
    }

    ctx.restore(); // Восстанавливаем исходное состояние контекста после тряски
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
    passedPipe = false; // Сброс переменной passedPipe
    birdHit = false; // Сброс флага удара
    drunkenEffect = false; // Сброс пьяного режима
    shakeEffect = false; // Сброс эффекта тряски
    glitchEffect = false; // Сброс эффекта глитча
    backgroundGif = false; // Сброс фона
    showTablo = false; // Сброс отображения табло
    gameOver = false;
}

function activateDrunkenMode() {
    drunkenEffect = true;
    drunkenDuration = 1200; // Продолжительность пьяного режима
    shakeEffect = true;
    shakeDuration = 150; // Продолжительность эффекта тряски
    glitchEffect = true;
    glitchDuration = 150; // Продолжительность глитч-эффекта
    backgroundGif = true; // Сменить фон на гифку
}
