

const container = document.getElementById('container');
const speedAdjust = 0.4; // Adjust the speed of the bouncing images as needed
const padding = 50; // Padding from the edges and between elements
const velocities = [];

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to store URL parameters in local storage
function storeUrlParameters() {
    const params = ['client_id', 'redirect_uri', 'username', 'moderator_username'];
    params.forEach(param => {
        const value = getUrlParameter(param);
        if (value) {
            localStorage.setItem(param, value);
        }
    });
}

// Function to retrieve URL parameters from local storage
function retrieveUrlParameters() {
    const params = ['client_id', 'redirect_uri', 'username', 'moderator_username'];
    const result = {};
    params.forEach(param => {
        const value = localStorage.getItem(param);
        if (value) {
            result[param] = value;
        }
    });
    return result;
}

// Function to store access token in local storage
function storeAccessToken(token) {
    localStorage.setItem('access_token', token);
}

// Function to retrieve access token from local storage
function retrieveAccessToken() {
    return localStorage.getItem('access_token');
}

const urlParams = retrieveUrlParameters();
const clientId = urlParams.client_id || getUrlParameter('client_id');
const redirectUri = urlParams.redirect_uri || getUrlParameter('redirect_uri') || 'https://itsmejoji.github.io/StreamAssets/parasocial-checker.html';
//const redirectUri = urlParams.redirect_uri || getUrlParameter('redirect_uri') || 'http://localhost:3000/parasocial-checker.html'; //For Development
const username = urlParams.username || getUrlParameter('username');
const moderatorUsername = urlParams.moderator_username || getUrlParameter('moderator_username') || username;
const youtubeAPI = urlParams.youtube_api || getUrlParameter('youtube_api');
const youtubeStreamId = urlParams.youtube_stream_id || getUrlParameter('youtube_stream_id');

// Function to check if an image exists
function imageExists(url, callback) {
    const img = new Image();
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
    img.src = url;
}

function getRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * availablePokemon.length);
    return availablePokemon[randomIndex];
}

// Function to create and append Pokémon images and usernames

function addNewPokemonAndUsernames(chatter, previousIndex) {
    let index = previousIndex;

    const specialUsers = {
        'itsmejoji': 'blastoise-s',
        'nightbot': 'porygon-z',
        'thomkeeris': 'sableye',
        'sirtoastyt': 'scizor-s',
        'cherrius_': 'deoxys',
        'welcome2therage': 'zygarde-complete-s',
        'sd_z_yt': 'gengar-mega-s',
    }
    console.log('Adding new Pokémon for ' + chatter.user_name);
    function addPokemon() {

        let imageName = getRandomPokemon();
        if (specialUsers[chatter.user_name]) {
            imageName = specialUsers[chatter.user_name]; // Use special Pokémon for certain users
        }

        const imgElement = document.createElement('img');
        imgElement.className = 'bouncingImage';
        imgElement.id = `pokemon${index + 1}`;
        imgElement.alt = `Pokemon ${index + 1}`;

        const usernameElement = document.createElement('div');
        usernameElement.className = 'username';
        usernameElement.id = `username${index + 1}`;
        usernameElement.textContent = chatter.user_name;

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.id = `message${index + 1}`;

        const emoteElement = document.createElement('img');
        emoteElement.className = 'emote';
        emoteElement.id = `emote${index + 1}`;
        emoteElement.style.display = 'none'

        container.appendChild(imgElement);
        container.appendChild(usernameElement);
        container.appendChild(messageElement);
        messageElement.appendChild(emoteElement);

        // Shiny Check
        const MAX_RANGE = 10;
        function getRandomNumber(max) {
            return Math.floor(Math.random() * max) + 1;
        }
        const randomNumber1 = getRandomNumber(MAX_RANGE);
        const randomNumber2 = getRandomNumber(MAX_RANGE);
        if (!imageName.includes("-s")){
            if (randomNumber1 === randomNumber2) {
                imageName = imageName + '-s';
            }
        }

        function imageExists(imagePath, modifier) {
            if (imagePath) {
                return imagePath;
            } else {
                return 'assets/images/Pokemon/' + imageName.replace(modifier, '') + '.png';
            }
        }

        let imagePath = 'assets/images/Pokemon/' + imageName + '.png';
        if (imageName.endsWith('-f-s')) {
            const modifier = '-f-s';
            imagePath = 'assets/images/Pokemon/shiny/female/' + imageName.slice(0, -4) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else if (imageName.endsWith('-f')) {
            const modifier = '-f';
            imagePath = 'assets/images/Pokemon/female/' + imageName.slice(0, -2) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else if (imageName.endsWith('-s')) {
            const modifier = '-s';
            imagePath = 'assets/images/Pokemon/shiny/' + imageName.slice(0, -2) + '.png';
            imagePath = imageExists(imagePath, modifier);
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        } else {
            imgElement.src = imagePath;
            cropTransparent(imgElement);
        }

        // Initialize positions at the top left corner
        const posX = padding;
        const posY = padding;

        imgElement.style.left = `${posX}px`;
        imgElement.style.top = `${posY}px`;
        usernameElement.style.left = `${posX}px`;
        usernameElement.style.top = `${posY + imgElement.height}px`;
        messageElement.style.left = `${posX}px`;
        messageElement.style.top = `${posY + imgElement.height}px`;
        emoteElement.style.left = `${posX}px`;
        emoteElement.style.top = `${posY + imgElement.height}px`;

        velocities.push({
            x: (Math.random() * 4 - 2) * speedAdjust,
            y: (Math.random() * 4 - 2) * speedAdjust
        });
    }

    addPokemon();
    updatePosition();

    console.log('New Pokémon added for ' + chatter.user_name);
}


isUpdating = false;

function updatePosition() {

    if (isUpdating) return;
    isUpdating = true;

    const images = document.querySelectorAll('.bouncingImage');
    const usernames = document.querySelectorAll('.username');
    const messages = document.querySelectorAll('.message');
    // const emotes = document.querySelectorAll('.emote')

    images.forEach((img, index) => {
        if (img.style.display === 'none') return;

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
            if (index !== otherIndex && otherImg.style.display !== 'none') {
                const otherPosX = parseFloat(otherImg.style.left) || 0;
                const otherPosY = parseFloat(otherImg.style.top) || 0;

                // Define smaller collision area (20x20px) centered within each image
                const collisionSize = 50;
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

        const {scaleX, scaleY} = getScale(img);
        if (velocities[index].x > 0) {
            img.style.transform = `scale(${-Math.abs(scaleX)}, ${scaleY})`;
        } else {
            img.style.transform = `scale(${Math.abs(scaleX)}, ${scaleY})`;
        }

        img.style.left = posX + 'px';
        img.style.top = posY + 'px';
        usernames[index].style.left = `${posX - 20}px`;
        usernames[index].style.top = `${posY + img.height}px`;
        messages[index].style.left = `${posX - 20}px`;
        messages[index].style.top = `${posY + 5}px`;
        // emotes[index].style.left = `${posX}px`;
        // emotes[index].style.top = `${posY + 50}px`;
    });

    isUpdating = false;
    requestAnimationFrame(updatePosition);
}

function cropTransparent(imgElement) {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Needed if image is from another domain
    img.src = imgElement.src;

    img.onload = function () {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        let top = img.height, bottom = 0, left = img.width, right = 0;

        // Find bounding box of non-transparent pixels
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const alpha = pixels[index + 3]; // Alpha channel

                if (alpha > 0) { // If not fully transparent
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }

        // New cropped dimensions
        const newWidth = right - left + 1;
        const newHeight = bottom - top + 1;

        if (newWidth > 0 && newHeight > 0) {
            // Create a new canvas for cropped image
            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = newWidth;
            croppedCanvas.height = newHeight;
            const croppedCtx = croppedCanvas.getContext("2d");

            croppedCtx.drawImage(canvas, left, top, newWidth, newHeight, 0, 0, newWidth, newHeight);

            // Replace original image with cropped one
            imgElement.src = croppedCanvas.toDataURL();
        }
    };
}

function getScale(img){
    const transform = window.getComputedStyle(img).transform;

    if (transform === 'none') {
        return {scaleX: 1, scaleY: 1}; // Default scale if no transform is applied
    }

    const matrix = new DOMMatrix(transform);
    return {scaleX: matrix.a, scaleY: matrix.d};
}

function authenticate() {
    storeUrlParameters();
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=chat:read+moderator:read:chatters+channel:read:redemptions`;
    window.location.href = authUrl;
}

function getAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}

async function fetchChannelId(username, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].id;
    } else {
        throw new Error('Channel not found');
    }
}

async function fetchModeratorId(moderatorUsername, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${moderatorUsername}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        return data.data[0].id;
    } else {
        throw new Error('Moderator not found');
    }
}

async function fetchChatUsers(channelId, moderatorId, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${channelId}&moderator_id=${moderatorId}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching chat users:', response.status, errorData);
        throw new Error(`Error fetching chat users: ${response.status}`);
    }

    const data = await response.json();

}

function connectToPubSub(accessToken, broadcasterId) {
    const socket = new WebSocket('wss://pubsub-edge.twitch.tv');

    socket.onopen = () => {
        console.log('Connected to PubSub');
        const message = {
            type: 'LISTEN',
            nonce: Math.random().toString(36).substring(7),
            data: {
                topics: [`channel-points-channel-v1.${broadcasterId}`],
                auth_token: accessToken,
            },
        };
        socket.send(JSON.stringify(message));
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('PubSub message:', message);
        // Check for redemption events
        if (message.type === 'MESSAGE') {
            const redemptionData = JSON.parse(message.data.message);
            handleChannelPointRedemption(redemptionData);
        }
    };

    socket.onerror = (error) => {
        console.error('PubSub error:', error);
    };

    socket.onclose = () => {
        console.warn('PubSub connection closed. Reconnecting in 10 seconds...');
        setTimeout(() => connectToPubSub(accessToken, broadcasterId), 10000);
    };
}


function handleChannelPointRedemption(data) {
    console.log("Redemption data:", data.data);
    const redemption = data.data.redemption;

    if (redemption.reward.title === 'Reroll Pokemon') {
        const username = redemption.user.login;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1) {
            const newPokemon = getRandomPokemon();
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
            cropTransparent(pokemonElement);

            console.log(`${username} rerolled their Pokémon to ${newPokemon}`);
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
    }

    if (redemption.reward.title === 'Shiny Reroll'){
        const username = redemption.user.login;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1){
            const newPokemon = getRandomPokemon();
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            
            const MAX_RANGE = 3;
            function getRandomNumber(max) {
                return Math.floor(Math.random() * max) + 1;
            }
            const randomNumber1 = getRandomNumber(MAX_RANGE);
            const randomNumber2 = getRandomNumber(MAX_RANGE);
            if (randomNumber1 === randomNumber2) {
                pokemonElement.src = `assets/images/Pokemon/shiny/${newPokemon}.png`;
            } else{
                pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
            }
        
            cropTransparent(pokemonElement);

            console.log(`${username} rerolled their Pokémon to ${newPokemon}`);
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
    }

    if (redemption.reward.title === 'Choose Your Pokemon'){
        const username = redemption.user.login;
        const userInput = redemption.user_input;

        const index = existingUsernames.findIndex((name) => name === username);

        if (index !== -1){
            const newPokemon = userInput
            const pokemonElement = document.getElementById(`pokemon${index + 1}`);
            
            const MAX_RANGE = 3;
            function getRandomNumber(max) {
                return Math.floor(Math.random() * max) + 1;
            }
            const randomNumber1 = getRandomNumber(MAX_RANGE);
            const randomNumber2 = getRandomNumber(MAX_RANGE);
            if (newPokemon.endsWith('-s')){
                pokemonElement.src = `assets/images/Pokemon/shiny/${newPokemon.replace('-s','')}.png`;
            } else{
                pokemonElement.src = `assets/images/Pokemon/${newPokemon}.png`;
            }
        
            cropTransparent(pokemonElement);

            console.log(`${username} rerolled their Pokémon to ${newPokemon}`);
        } else {
            console.warn(`User ${username} is not currently in the chat.`);
        }
    }
}


function formatMessage(tags, message){
    if (!tags.emotes) {
        console.log("regular message detected")
        return [{ type: "text", content: message }];
    }

    let parts = [];
    let lastIndex = 0;

    let emoteList = [];
    Object.keys(tags.emotes).forEach(emoteId => {
        tags.emotes[emoteId].forEach(index => {
            let [start, end] = index.split('-').map(Number);
            emoteList.push({id: emoteId, start, end});
        });
    });

    emoteList.sort((a,b) => a.start - b.start);

    emoteList.forEach(({id, start, end}) => {
        if (lastIndex < start){
            parts.push({type: "text", content: message.substring(lastIndex, start)});
            console.log("regular message detected")
        }
        parts.push({type: "emote", content: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`});
        lastIndex = end + 1;
        console.log("emote detected")
    });

    if (lastIndex < message.length){
        parts.push({type: "text", content: message.substring(lastIndex)});
        console.log("regular message detected")
    }

    return parts;
}


const existingUsernames = [];
const accessToken = getAccessTokenFromUrl() || retrieveAccessToken();
if (accessToken) {
    storeAccessToken(accessToken);
    Promise.all([fetchChannelId(username, accessToken), fetchModeratorId(moderatorUsername, accessToken)])
        .then(([channelId, moderatorId]) => {
            connectToPubSub(accessToken, channelId);
            fetchChatUsers(channelId, moderatorId, accessToken);

            const chatters = [];

            const client = new tmi.Client({
                options: { debug: true },
                identity: {
                    username: username,
                    password: `oauth:${accessToken}`
                },
                channels: [username]
            });

            client.connect();

            // Listen to messages
            client.on('message', (channel, tags, message, self) => {

                // if (self) return; // Ignore messages from the bot

                const parts = formatMessage(tags, message);
                const badges = tags.badges || {};
                const isBroadcaster = badges.broadcaster === '1';
                const isModerator = badges.moderator === '1';
                const isSubscriber = tags.subscriber === '1';
                const isVip = badges.vip === '1';

                // Ensure the user is in the chatters array
                if (!chatters.some(chatter => chatter.user_name === tags.username)) {
                    chatters.push({ user_name: tags.username });
                }

                const username = tags.username;
                if (!existingUsernames.includes(username)) {
                        existingUsernames.push(username);
                        addNewPokemonAndUsernames({ user_name: username }, chatters.length - 1);
                        console.log('New User Added:' + username);
                    }
                    
                console.log('Badges:', badges);
                if (isBroadcaster || isModerator || isSubscriber || isVip) {

                    console.log('User is a mod, sub, or VIP');

                    //TODO: Add logic to handle mod, sub, and VIP messages
                    
                    // Display the message above the corresponding Pokémon
                    const usernameIndex = chatters.findIndex(chatter => chatter.user_name === tags.username);
                    if (usernameIndex !== -1) {
                        const messageElement = document.getElementById(`message${usernameIndex + 1}`);
                        const emoteElement = document.getElementById(`emote${usernameIndex + 1}`);
                        
                        // parts.forEach((part, index) =>{
                        //         if (part.type === "text"){
                        //             messageElement.textContent = part.content;
                        //             emoteElement.style.display = 'inline-block';
                        //         } else if (part.type === "emote"){
                        //             emoteElement.src = part.content;
                        //             emoteElement.style.display = 'inline-block';
                        //         }
                        // });

                        messageElement.textContent = message;

                        setTimeout(() => {
                            messageElement.textContent = '';
                            emoteElement.style.display = 'none';
                        }, 5000); // Clear the message after 5 seconds
                    }
                }

            });

            // Listen to users joining the channel
            // client.on('join', (channel, username, self) => {
            //     if (!chatters.some(chatter => chatter.user_name === username)) {
            //         //chatters.push({ user_name: username });
            //         // if (!existingUsernames.includes(username)) {
            //         //     existingUsernames.push(username);
            //         //     addNewPokemonAndUsernames({ user_name: username }, chatters.length - 1);
            //         // }
            //     }
            // });

            // Listen to users leaving the channel
            // client.on('part', (channel, username, self) => {
            //     const index = chatters.findIndex(chatter => chatter.user_name === username);
            //     if (index !== -1) {
            //         chatters.splice(index, 1); // Remove the user from chatters array
            //     }
            // });

            // Listen to deleted messages
            client.on('ban', (channel, username, deletedMessage, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });

            // Listen for Bans
            client.on('ban', (channel, username, reason, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });

            // Listen for Timeouts
            client.on('timeout', (channel, username, duration, reason, userstate) => {
                // Find the index of the deleted user's Pokémon
                const index = chatters.findIndex(chatter => chatter.user_name === username);

                if (index !== -1) {
                    // Remove Pokémon, username, and message elements from the DOM
                    const pokemonElement = document.getElementById(`pokemon${index + 1}`);
                    const usernameElement = document.getElementById(`username${index + 1}`);
                    const messageElement = document.getElementById(`message${index + 1}`);

                    if (pokemonElement) pokemonElement.remove();
                    if (usernameElement) usernameElement.remove();
                    if (messageElement) messageElement.remove();

                    // Remove user from chatters and existingUsernames arrays
                    chatters.splice(index, 1);
                    existingUsernames.splice(existingUsernames.indexOf(username), 1);
                }
            });


        })
        .catch(error => console.error(error));
} else {
    authenticate();
}


