localStorage.clear();

const container = document.getElementById('container');
const images = document.querySelectorAll('.bouncingImage');
const overlay = document.getElementById('overlay');
const speedAdjust = 1; // Adjust the speed of the bouncing images as needed
const minInterval = 10000; // Minimum interval in milliseconds
const maxInterval = 60000; // Maximum interval in milliseconds


// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to check if an image exists
    function imageExists(url, callback) {
    const img = new Image();
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
    img.src = url;
}

// Set image sources based on URL parameters
for (let i = 1; i <= 6; i++) {
    const imageName = getUrlParameter('pokemon' + i).toLowerCase();
    const imgElement = document.getElementById('pokemon' + i);
    if (imageName) {
        let imagePath = 'assets/images/Pokemon/' + imageName + '.png';
        if (imageName.endsWith('-f-s')) {
            imagePath = 'assets/images/Pokemon/shiny/female/' + imageName.slice(0,-4) + '.png';
        } else if (imageName.endsWith('-f')) {
            imagePath = 'assets/images/Pokemon/female/' + imageName.slice(0,-2) + '.png';
        } else if (imageName.endsWith('-s')) {
            imagePath = 'assets/images/Pokemon/shiny/' + imageName.slice(0,-2) + '.png';
        }
        imageExists(imagePath, (exists) => {
            if (exists) {
                imgElement.src = imagePath;
            } else {
                const regularImagePath = 'assets/images/Pokemon/' + imageName.slice(0,-2) + '.png';
                imageExists(regularImagePath, (exists) => {
                    if (exists) {
                        imgElement.src = regularImagePath;
                    } else {
                        imgElement.alt = 'Image not Found';
                    }
                });
            }
        });
    } else if (i != 1 && !imageName) {
        imgElement.style.display = 'none';
    }
    
}


const velocities = Array.from(images).map(() => ({
    x: (Math.random() * 4 - 2) * speedAdjust,
    y: (Math.random() * 4 - 2) * speedAdjust  
}));

function updatePosition() {
    images.forEach((img, index) => {
        let posX = parseFloat(img.style.left) || 0;
        let posY = parseFloat(img.style.top) || 0;

        posX += velocities[index].x;
        posY += velocities[index].y;

        if (posX + img.width >= container.clientWidth || posX <= 0) {
            velocities[index].x = -velocities[index].x;
        }
        if (posY + img.height >= container.clientHeight || posY <= 0) {
            velocities[index].y = -velocities[index].y;
        }

        images.forEach((otherImg, otherIndex) => {
            if (index !== otherIndex) {
                const otherPosX = parseFloat(otherImg.style.left) || 0;
                const otherPosY = parseFloat(otherImg.style.top) || 0;

                // Define smaller collision area (20x20px) centered within each image
                const collisionSize = 25;
                const halfCollisionSize = collisionSize / 2;

                const imgCenterX = posX + img.width / 2;
                const imgCenterY = posY + img.height / 2;
                const otherImgCenterX = otherPosX + otherImg.width / 2;
                const otherImgCenterY = otherPosY + otherImg.height / 2;

                if (Math.abs(imgCenterX - otherImgCenterX) < collisionSize &&
                    Math.abs(imgCenterY - otherImgCenterY) < collisionSize) {
                    velocities[index].x = -velocities[index].x;
                    velocities[index].y = -velocities[index].y;
                    velocities[otherIndex].x = -velocities[otherIndex].x;
                    velocities[otherIndex].y = -velocities[otherIndex].y;
                }
            }
        });

        if (velocities[index].x > 0) {
            img.style.transform = 'scaleX(-1)'; // Moving to the right
        } else {
            img.style.transform = 'scaleX(1)'; // Moving to the left
        }

        img.style.left = posX + 'px';
        img.style.top = posY + 'px';
    });

    requestAnimationFrame(updatePosition);
}

function showHeartsForImage(img, index) {
    if (img.style.display === 'none') return;

    const heartCount = Math.floor(Math.random() * 5) + 1;
    const hearts = [];

    const imgCenterX = parseFloat(img.style.left) + img.width / 2;
    const imgTopY = parseFloat(img.style.top);

    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('img');
        heart.src = 'assets/images/misc/heart.png';
        heart.className = 'heart';
        heart.style.left = `${imgCenterX - (heartCount * 15) + i * 30}px`;
        heart.style.top = `${imgTopY + 50}px`;
        heart.style.display = 'block';
        container.appendChild(heart);
        hearts.push(heart);
    }

    const originalVelocity = { ...velocities[index] };
    velocities[index] = { x: 0, y: 0 }; // Stop the image

    setTimeout(() => {
        hearts.forEach((heart) => {
            heart.remove();
        });
        velocities[index] = originalVelocity; // Resume the image movement
    }, 3000);

    const nextInterval = Math.random() * (maxInterval - minInterval) + minInterval; // Random interval between minInterval and maxInterval
    setTimeout(() => showHeartsForImage(img, index), nextInterval);
}

function startShowingHearts() {
    images.forEach((img, index) => {
        const initialInterval = Math.random() * (maxInterval - minInterval) + minInterval;
        setTimeout(() => showHeartsForImage(img, index), initialInterval);
    });
}

updatePosition();

const showHearts = getUrlParameter('friendship');
if (showHearts === 'true') {
    startShowingHearts();
}

const showOverlay = getUrlParameter('overlay');
if (showOverlay === 'false') {
    overlay.style.display = 'none';
}
