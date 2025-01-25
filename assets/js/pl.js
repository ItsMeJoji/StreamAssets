async function fetchPokemonData(pokemonName) {
    try {
        const encounterResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}/encounters`);
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        if (!encounterResponse.ok) {
            throw new Error('Pokemon not found');
        }
        const data = await encounterResponse.json();
        let versionName;
        let locationName;
        let shinyStatus;
        let allData = [];

        data.forEach(pokemonData => {
            pokemonData.version_details.forEach(nameValue => {
                versionName = nameValue.version.name;
                locationName = pokemonData.location_area.name;
                shinyStatus = "Data not available";
                allData.push({versionName, locationName, shinyStatus});
            });
        });

        return allData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function lookupPokemon() {
    const pokemonName = document.getElementById('pokemonName').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (pokemonName) {
        const pokemonData = await fetchPokemonData(pokemonName);
        console.log(pokemonData);
        if (pokemonData) {

            pokemonData.forEach(gameData => {
                const game = gameData.versionName;
                const location = gameData.locationName;
                const shinyStatus = gameData.shinyStatus;

                resultsDiv.innerHTML += `
                    <p><strong>Game:</strong> ${game}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Shiny Locked:</strong> ${shinyStatus}</p>
                    <hr>
                `;
        }); 
    } else {
            resultsDiv.innerHTML = '<p>No encounter data found for this Pokemon.</p>';
        }
    } else {
        resultsDiv.innerHTML = '<p>Please enter a Pokemon name.</p>';
    }
}

function toProperCase(str) {
    return str
      .toLowerCase() // Convert the entire string to lowercase first
      .split(' ') // Split the string into words by spaces
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(' '); // Join the words back together
  }