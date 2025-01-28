async function loadDAT(filePath, version){
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    //Generic Variables
    const buffer = await response.arrayBuffer();
    const dat = new Uint8Array(buffer);
    let interval;
    let pokemonData = [];
    let pokemonName;
    let pokemonLocation;
    let pokemonEncounterRate;
    let pokemonEncounterType;
    let pokemonMinLv;
    let pokemonMaxLv;
    let mapFileName;


    //Gen 2 Variables
    const intervalGSC = 360;

    //Gen 3 Variables
    const intervalRSE = 128;
    const intervalFRLG = 128;

    //Gen 4 Variables
    const intervalDPPt = 424;
    const intervalHGSS = 196;
    const percentGrass = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1]
    const slotsSwarm = [0, 1]
    const slotsDayNight = [2, 3]
    const slotsRadar = [4, 5, 10, 11]
    const slotsCart = [8,9]

    //Gen 5 Variables
    const intervalBW = 323;

    //Gen 6 Variables
    const intervalXY = 376;
    const intervalORAS = 244;

    //Gen 7 Variables
    //TBD


    //Get Data
    switch (version) {
        case 'C':
            interval = intervalGSC;
            mapFileName = 'Maps_C.txt';
            break;
        case 'GS':
            interval = intervalGSC;
            mapFileName = 'Maps_GS.txt';
            break;
        case 'RS':
            interval = intervalRSE;
            mapFileName = 'Maps_RS.txt';
            break;
        case 'E':
            interval = intervalRSE;
            mapFileName = 'Maps_E.txt';
            break;
        case 'FRLG':
            interval = intervalFRLG;
            mapFileName = 'Maps_FRLG.txt';
            break;
        case 'DP':
            interval = intervalDPPt;
            mapFileName = 'Maps_DP.txt';
            break;
        case 'Pt':
            interval = intervalDPPt;
            mapFileName = 'Maps_Pt.txt';
            break;
        case 'HGSS':
            interval = intervalHGSS;
            mapFileName = 'Maps_HGSS.txt';
            break;
        case 'BW':
            interval = intervalBW;
            mapFileName = 'Maps_BW.txt';
            break;
        case 'B2W2':
            interval = intervalBW;
            mapFileName = 'Maps_B2W2.txt';
            break;
        case 'XY':
            interval = intervalXY;
            mapFileName = 'Maps_XY.txt';
            break;
        case 'OR':
            interval = intervalORAS;
            mapFileName = 'Maps_OR.txt';
            break;
        case 'AS':
            interval = intervalORAS;
            mapFileName = 'Maps_AS.txt';
            break;
        // Add more cases as needed for other versions
        default:
            throw new Error(`Unknown version: ${version}`);
    }


    //console.log('Map Count:', dat.length/interval);
    //console.log('DAT:', dat);

    const names = await loadPokemonNames('./assets/dat/pokemon.txt');
    const areas = await loadAreaNames('./assets/dat/Maps/Maps_DP.txt');

    let mapInt;
    let grass;
    let swarm;
    let day;
    let night;
    let pokeRadar;
    let ruby;
    let sapphire;
    let emerald;
    let fireRed;
    let leafGreen;
    let surf;
    let oldRod;
    let goodRod;
    let superRod;
    let location;

    for (i = 0; i < dat.length; i += interval) {
        const startsWithZero = dat[i] !== 0;
        mapInt = i/interval;
        //console.log(`Interval starting at ${i}: ${startsWithZero ? 'Does not start with 0' : 'Start with 0'}`);

        if (startsWithZero) {
            location = areas[mapsTableDP.indexOf(mapInt)];
            pokemonLocation = location;
            //console.log(`Location: ${location}`);


            grass = dat.slice(i+4, i+100);
            //console.log('Grass Slot Data:', grass);
            //console.log('Number of Grass Encounters: ', grass.length/8);
            for (j = 0; j < grass.length; j += 8) {
                const encounter = grass.slice(j, j+8);
                const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                const name = names[speciesID-1];
                const maxLv = encounter[0];
                let minLv = encounter[1];
                if (minLv === 0) minLv = maxLv;
                const percent = percentGrass[j/8];
                pokemonName = name;
                pokemonMinLv = minLv;
                pokemonMaxLv = maxLv;
                pokemonEncounterRate = percent;
                pokemonEncounterType = 'Grass/Walking';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}, Min Level: ${minLv}, Max Level: ${maxLv}, Encounter Rate: ${percent}%`);;
            }

            swarm = dat.slice(i+100, i+108);
            for (s = 0; s < swarm.length; s += 4) {
                const encounter = swarm.slice(s, s+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, s+4));
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Swarm';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            day = dat.slice(i+108, i+116);
            for (d = 0; d < day.length; d += 4) {
                const encounter = day.slice(d, d+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, d+4));
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Day Encounter';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            night = dat.slice(i+116, i+124);
            for (n = 0; n < night.length; n += 4) {
                const encounter = night.slice(n, n+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, n+4));
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Night Encounter';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            pokeRadar = dat.slice(i+124, i+140);
            //console.log('Poke Radar Slot Data:', pokeRadar);
            //console.log('Encounter Changes when using Poke Radar: ', pokeRadar.length/4);
            for (r = 0; r < pokeRadar.length; r += 4) {
                const encounter = pokeRadar.slice(r, r+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, r+4));
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Poke Radar';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            ruby = dat.slice(i+164, i+172);
            //console.log('Ruby Slot Data:', ruby);
            //console.log('Encounter Changes when Ruby inserted: ', ruby.length/4);
            for (r = 0; r < ruby.length; r += 4) {
                const encounter = ruby.slice(r, r+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, r+4));
                //console.log(`Species ID: ${speciesID}`);
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Ruby Inserted';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            sapphire = dat.slice(i+172, i+180);
            for (s = 0; s < sapphire.length; s += 4) {
                const encounter = ruby.slice(s, s+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, s+4));
                //console.log(`Species ID: ${speciesID}`);
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Sapphire Inserted';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            emerald = dat.slice(i+180, i+188);
            for (e = 0; e < emerald.length; e += 4) {
                const encounter = emerald.slice(e, e+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, e+4));
                //console.log(`Species ID: ${speciesID}`);
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'Emerald Inserted';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            fireRed = dat.slice(i+188, i+196);
            for (f = 0; f < fireRed.length; f += 4) {
                const encounter = fireRed.slice(f, f+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, f+4));
                //console.log(`Species ID: ${speciesID}`);
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'FireRed Inserted';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

            leafGreen = dat.slice(i+196, i+204);
            for (l = 0; l < leafGreen.length; l += 4) {
                const encounter = leafGreen.slice(l, l+4);
                const speciesID = BitConverter.toInt16(encounter.slice(0, l+4));
                //console.log(`Species ID: ${speciesID}`);
                const name = names[speciesID-1];
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}`);;
                pokemonName = name;
                pokemonMinLv = 0;
                pokemonMaxLv = 0;
                pokemonEncounterRate = 0;
                pokemonEncounterType = 'LeafGreen Inserted';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
            }

        }

        surf = dat.slice(i+208, i+248);
        if(surf[0] !== 0){
            location = areas[mapsTableDP.indexOf(mapInt)];
            pokemonLocation = location;
            for (s = 0; s < surf.length; s += 8) {
                const encounter = surf.slice(s, s+8);
                const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                const name = names[speciesID-1];
                const maxLv = encounter[0];
                let minLv = encounter[1];
                if (minLv === 0) minLv = maxLv;
                const percent = percentGrass[s/8];
                pokemonName = name;
                pokemonMinLv = minLv;
                pokemonMaxLv = maxLv;
                pokemonEncounterRate = percent;
                pokemonEncounterType = 'Surfing';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}, Min Level: ${minLv}, Max Level: ${maxLv}, Encounter Rate: ${percent}%`);;
            }
        }

        oldRod = dat.slice(i+296, i+336);
        if(oldRod[0] !== 0){
            location = areas[mapsTableDP.indexOf(mapInt)];
            pokemonLocation = location;
            for (o = 0; o < oldRod.length; o += 8) {
                const encounter = oldRod.slice(o, o+8);
                const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                const name = names[speciesID-1];
                const maxLv = encounter[0];
                let minLv = encounter[1];
                if (minLv === 0) minLv = maxLv;
                const percent = percentGrass[o/8];
                pokemonName = name;
                pokemonMinLv = minLv;
                pokemonMaxLv = maxLv;
                pokemonEncounterRate = percent;
                pokemonEncounterType = 'Old Rod';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}, Min Level: ${minLv}, Max Level: ${maxLv}, Encounter Rate: ${percent}%`);;
            }
        }

        goodRod = dat.slice(i+340, i+380);
        if(goodRod[0] !== 0){
            location = areas[mapsTableDP.indexOf(mapInt)];
            pokemonLocation = location;
            for (g = 0; g < goodRod.length; g += 8) {
                const encounter = goodRod.slice(g, g+8);
                const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                const name = names[speciesID-1];
                const maxLv = encounter[0];
                let minLv = encounter[1];
                if (minLv === 0) minLv = maxLv;
                const percent = percentGrass[g/8];
                pokemonName = name;
                pokemonMinLv = minLv;
                pokemonMaxLv = maxLv;
                pokemonEncounterRate = percent;
                pokemonEncounterType = 'Good Rod';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}, Min Level: ${minLv}, Max Level: ${maxLv}, Encounter Rate: ${percent}%`);;
            }
        }

        superRod = dat.slice(i+384, i+424);
        if (superRod[0] !== 0){
            location = areas[mapsTableDP.indexOf(mapInt)];
            pokemonLocation = location;
            for (s = 0; s < superRod.length; s += 8) {
                const encounter = superRod.slice(s, s+8);
                const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                const name = names[speciesID-1];
                const maxLv = encounter[0];
                let minLv = encounter[1];
                if (minLv === 0) minLv = maxLv;
                const percent = percentGrass[s/8];
                pokemonName = name;
                pokemonMinLv = minLv;
                pokemonMaxLv = maxLv;
                pokemonEncounterRate = percent;
                pokemonEncounterType = 'Super Rod';
                pokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                //console.log(`Pokemon: ${name}, Pokedex #: ${speciesID}, Min Level: ${minLv}, Max Level: ${maxLv}, Encounter Rate: ${percent}%`);;
            }
        }
    }
    return pokemonData;
}



mapsTableDP = [178, 176, 177, 53, 179, 180, 181, 182, 54, 55, 8, 9, 23, 24, 25, 26, 27, 28, 63, 69,
            75, 112, 113, 114, 115, 118, 119, 121, 120, 122, 123, 124, 117, 0, 136, 137, 134, 7,
            4, 5, 6, 56, 57, 58, 22, 19, 11, 12, 15, 16, 17, 18, 13, 10, 21, 20, 3, 138, 139, 140,
            141, 142, 144, 143, 146, 145, 147, 148, 149, 150, 157, 156, 159, 158, 160, 161, 162, 163,
            164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 47, 51, 48, 49, 50, 52, 29, 59,
            106, 107, 108, 109, 110, 111, 151, 152, 153, 154, 155, 116, 2, 1, 125, 132];

async function loadPokemonNames(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new TextDecoder().decode(buffer).split('\r\n');
}

async function loadAreaNames(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new TextDecoder().decode(buffer).split('\r\n');
}

// loadPokemonNames('./assets/dat/pokemon.txt').then(pokemonNames => {
//     console.log('Pokemon names loaded:', pokemonNames);
// }).catch(error => {
//     console.error('Error loading Pokemon names:', error);
// });

//Get Pokemon DPPt Data
// loadDAT('./assets/dat/Slots/DiamondSlots.dat', 'DP').then(dat => {
//     console.log('DAT loaded:', dat);
// }).catch(error => {
//     console.error('Error loading DAT:', error);
// });



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
    const searchedPokemonName = document.getElementById('pokemonName').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    
    if (searchedPokemonName) {
        //const pokemonData = await fetchPokemonData(pokemonName);
        const pokemonData = await loadDAT('./assets/dat/Slots/DiamondSlots.dat', 'DP');
        //console.log(pokemonData);
        console.log(searchedPokemonName);
        if (pokemonData) {
            const searchedPokemon = pokemonData.filter(pokemon => pokemon.pokemonName === searchedPokemonName);
            console.log(searchedPokemon);
            searchedPokemon.forEach(gameData => {
                //const game = gameData.versionName;
                const game = 'game';
                const location = gameData.pokemonLocation;
                const minLv = gameData.pokemonMinLv;
                const maxLv = gameData.pokemonMaxLv;
                const encounterRate = gameData.pokemonEncounterRate;
                const encounterType = gameData.pokemonEncounterType;

                resultsDiv.innerHTML += `
                    <p><strong>Game:</strong> ${game}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Encounter Type:</strong> ${encounterType}</p>
                    <p><strong>Min Level:</strong> ${minLv}</p>
                    <p><strong>Max Level:</strong> ${maxLv}</p>
                    <p><strong>Encounter Rate:</strong> ${encounterRate}%</p>
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