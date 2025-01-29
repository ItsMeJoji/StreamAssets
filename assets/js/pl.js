async function loadDAT(filePath, version){
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    //Generic Variables
    const buffer = await response.arrayBuffer();
    const dat = new Uint8Array(buffer);
    let game;
    let interval;
    let mapsTable = [];
    let pokemonData = [];
    let regularPokemonData = [];
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
    const percentSurf = [60, 30, 5, 4, 1]
    const percentRockSmash = [90, 10]
    const percentOldRodDPPt = [60, 30, 5, 4, 1]
    const percentGoodRodDPPt = [40, 40, 15, 4, 1]
    const percentSuperRodDPPt = [40, 40, 15, 4, 1]
    const percentOldRodHGSS = [40, 30, 15, 10, 5]
    const percentGoodRodHGSS = [40, 30, 15, 10, 5]
    const percentSuperRodHGSS = [40, 30, 15, 10, 5]
    const slotsSwarm = [0, 1]
    const slotsDayNight = [2, 3]
    const slotsRadar = [4, 5, 10, 11]
    const slotsCart = [8,9]

    let mapInt;
    let minLv;
    let maxLv;
    let grass;
    let day;
    let night;
    let surf;
    let oldRod;
    let goodRod;
    let superRod;
    let location;
    //DPPt Specific Variables
    let swarm;
    let pokeRadar;
    let ruby;
    let sapphire;
    let emerald;
    let fireRed;
    let leafGreen;
    //HGSS Specific Variables
    let swarmGrass;
    let swarmSurf;
    let rockSmash;
    let hoenn;
    let sinnoh;
    let nightFish;
    let swarmFish;

    //Gen 5 Variables
    const intervalBW = 323;

    //Gen 6 Variables
    const intervalXY = 376;
    const intervalORAS = 244;

    //Gen 7 Variables
    //TBD


    //Version Specific Variables Setup
    switch (version) {
        case 'C':
            interval = intervalGSC;
            mapFileName = 'Maps_C.txt';
            game = 'Crystal';
            break;
        case 'GS':
            interval = intervalGSC;
            mapFileName = 'Maps_GS.txt';
            game = 'Gold/Silver';
            break;
        case 'RS':
            interval = intervalRSE;
            mapFileName = 'Maps_RS.txt';
            game = 'Ruby/Sapphire';
            break;
        case 'E':
            interval = intervalRSE;
            mapFileName = 'Maps_E.txt';
            game = 'Emerald';
            break;
        case 'FRLG':
            interval = intervalFRLG;
            mapFileName = 'Maps_FRLG.txt';
            game = 'FireRed/LeafGreen';
            break;
        case 'D':
            interval = intervalDPPt;
            mapFileName = 'Maps_DP.txt';
            game = 'Diamond';
            mapsTable = mapsTableDP;
            break;
        case 'P':
            interval = intervalDPPt;
            mapFileName = 'Maps_DP.txt';
            game = 'Pearl';
            mapsTable = mapsTableDP;
            break
        case 'Pt':
            interval = intervalDPPt;
            mapFileName = 'Maps_Pt.txt';
            game = 'Platinum';
            mapsTable = mapsTablePt;
            break;
        case 'HG':
            interval = intervalHGSS;
            mapFileName = 'Maps_HGSS.txt';
            game = 'HeartGold';
            mapsTable = mapsTableHGSS;
            break;
        case 'SS':
            interval = intervalHGSS;
            mapFileName = 'Maps_HGSS.txt';
            game = 'SoulSilver';
            mapsTable = mapsTableHGSS;
            break;
        case 'B':
            interval = intervalBW;
            mapFileName = 'Maps_BW.txt';
            game = 'Black';
            break;
        case 'W':
            interval = intervalBW;
            mapFileName = 'Maps_BW.txt';
            game = 'White';
            break;
        case 'B2':
            interval = intervalBW;
            mapFileName = 'Maps_B2W2.txt';
            game = 'Black 2';
            break;
        case 'W2':
            interval = intervalBW;
            mapFileName = 'Maps_B2W2.txt';
            game = 'White 2';
            break;
        case 'X':
            interval = intervalXY;
            mapFileName = 'Maps_XY.txt';
            game = 'X';
            break;
        case 'Y':
            interval = intervalXY;
            mapFileName = 'Maps_XY.txt';
            game = 'Y';
        case 'OR':
            interval = intervalORAS;
            mapFileName = 'Maps_OR.txt';
            game = 'Omega Ruby';
            break;
        case 'AS':
            interval = intervalORAS;
            mapFileName = 'Maps_AS.txt';
            game = 'Alpha Sapphire';
            break;
        // Add more cases as needed for other versions
        default:
            throw new Error(`Unknown version: ${version} when setting up variables`);
    }


    //console.log('Map Count:', dat.length/interval);
    //console.log('DAT:', dat);

    const names = await loadPokemonNames('./assets/dat/pokemon.txt');
    const areas = await loadAreaNames(`./assets/dat/Maps/${mapFileName}`);



    //Version Specific Data Parsing
    switch (version) {
        case 'C':
            break;
        case 'GS':
            break;
        case 'RS':
            break;
        case 'E':
            break;
        case 'FRLG':
            break;
        case 'D':
        case 'P':
        case 'Pt':

            for (i = 0; i < dat.length; i += interval) {
                const startsWithZero = dat[i] !== 0;
                mapInt = i/interval;
                //console.log(`Interval starting at ${i}: ${startsWithZero ? 'Does not start with 0' : 'Start with 0'}`);

                if (startsWithZero) {
                    //console.log(`Map: ${mapInt}`);
                    //console.log(mapsTable.indexOf(mapInt));
                    location = areas[mapsTable.indexOf(mapInt)];
                    //console.log(areas[mapsTable.indexOf(mapInt)]);
                    pokemonLocation = location;
                    //console.log(`Location: ${location}`);
                    if (!pokemonLocation) {
                        continue;
                    }
                    //clear out previous data
                    regularPokemonData = [];

                    grass = dat.slice(i+4, i+100);
                    for (j = 0; j < grass.length; j += 8) {
                        const encounter = grass.slice(j, j+8);
                        const speciesID = BitConverter.toInt16(encounter.slice(4, 6));
                        const name = names[speciesID-1];
                        maxLv = encounter[0];
                        minLv = encounter[1];
                        if (minLv === 0) minLv = maxLv;
                        const percent = percentGrass[j/8];
                        pokemonName = name;
                        pokemonMinLv = minLv;
                        pokemonMaxLv = maxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Grass/Walking';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                        regularPokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    swarm = dat.slice(i+100, i+108);
                    for (s = 0; s < swarm.length; s += 4) {
                        const encounter = swarm.slice(s, s+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, s+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsSwarm[s/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsSwarm[s/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsSwarm[s/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Swarm';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    day = dat.slice(i+108, i+116);
                    for (d = 0; d < day.length; d += 4) {
                        const encounter = day.slice(d, d+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, d+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsDayNight[d/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsDayNight[d/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsDayNight[d/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Day Encounter';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    night = dat.slice(i+116, i+124);
                    for (n = 0; n < night.length; n += 4) {
                        const encounter = night.slice(n, n+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, n+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsDayNight[n/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsDayNight[n/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsDayNight[n/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Night Encounter';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    pokeRadar = dat.slice(i+124, i+140);
                    for (r = 0; r < pokeRadar.length; r += 4) {
                        const encounter = pokeRadar.slice(r, r+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, r+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsRadar[r/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsRadar[r/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsRadar[r/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Poke Radar';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    ruby = dat.slice(i+164, i+172);
                    for (r = 0; r < ruby.length; r += 4) {
                        const encounter = ruby.slice(r, r+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, r+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsCart[r/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsCart[r/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsCart[r/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Ruby Inserted';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    sapphire = dat.slice(i+172, i+180);
                    for (s = 0; s < sapphire.length; s += 4) {
                        const encounter = ruby.slice(s, s+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, s+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsCart[s/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsCart[s/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsCart[s/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Sapphire Inserted';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    emerald = dat.slice(i+180, i+188);
                    for (e = 0; e < emerald.length; e += 4) {
                        const encounter = emerald.slice(e, e+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, e+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsCart[e/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsCart[e/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsCart[e/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Emerald Inserted';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    fireRed = dat.slice(i+188, i+196);
                    for (f = 0; f < fireRed.length; f += 4) {
                        const encounter = fireRed.slice(f, f+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, f+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsCart[f/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsCart[f/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsCart[f/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'FireRed Inserted';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                    }

                    leafGreen = dat.slice(i+196, i+204);
                    for (l = 0; l < leafGreen.length; l += 4) {
                        const encounter = leafGreen.slice(l, l+4);
                        const speciesID = BitConverter.toInt16(encounter.slice(0, l+4));
                        const name = names[speciesID-1];
                        const percent = percentGrass[slotsCart[l/4]];
                        pokemonName = name;
                        pokemonMinLv = regularPokemonData[slotsCart[l/4]].pokemonMinLv;
                        pokemonMaxLv = regularPokemonData[slotsCart[l/4]].pokemonMaxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'LeafGreen Inserted';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
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
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
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
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
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
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
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
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});``
                    }
                }
            }
            break;
        case 'HG':
        case 'SS':

        for (i = 0; i < dat.length; i += interval) {
            let data = dat.slice(i,i+196);
            grass = new Uint8Array(48);
            for (j=0; j<12; j++){

                //Levels
                grass[4 * j] = data[8 + j];
                //Species
                grass[4*j+2] = data[20+2*j];
                grass[4*j+3] = data[20+2*j+1]
            }
            mapInt = i/interval;
                //console.log(`Interval starting at ${i}: ${startsWithZero ? 'Does not start with 0' : 'Start with 0'}`);
                

                if (grass[0] !== 0) {
                    //console.log(`Map: ${mapInt}`);
                    //console.log(mapsTable.indexOf(mapInt));
                    location = areas[mapsTable.indexOf(mapInt)];
                    //console.log(areas[mapsTable.indexOf(mapInt)]);
                    pokemonLocation = location;
                    //console.log(`Location: ${location}`);
                    if (!pokemonLocation) {
                        continue;
                    }
                    //clear out previous data
                    regularPokemonData = [];

                    for (g = 0; g < grass.byteLength/4; g++) {
                        const encounter = grass
                        const speciesID = BitConverter.toInt16(encounter, 4*g+2);
                        const name = names[speciesID-1];
                        maxLv = encounter[4*g];
                        minLv = encounter[4*g+1];
                        if (minLv === 0) minLv = maxLv;
                        const percent = percentGrass[g];
                        pokemonName = name;
                        pokemonMinLv = minLv;
                        pokemonMaxLv = maxLv;
                        pokemonEncounterRate = percent;
                        pokemonEncounterType = 'Grass/Walking';
                        pokemonData.push({game, pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                        regularPokemonData.push({pokemonName, pokemonLocation, pokemonMinLv, pokemonMaxLv, pokemonEncounterRate, pokemonEncounterType});
                        if (pokemonName == 'Pikachu'){
                            console.log(4*g+2)
                            console.log('Data:', encounter)
                            console.log(`Pokemon: ${pokemonName} Location: ${pokemonLocation} Min LV: ${pokemonMinLv} Max LV: ${pokemonMaxLv} `)}
                    }
                }
            }
            break;
        case 'B':
        case 'W':
            break;
        case 'B2':
        case 'W2':
            break;
        case 'X':
        case 'Y':
            break;
        case 'OR':
        case 'AS':
            break;
        // Add more cases as needed for other versions
        default:
            throw new Error(`Unknown version: ${version} when data parsing`);

        }
        return pokemonData;            
}


const mapsTableDP = [178, 176, 177, 53, 179, 180, 181, 182, 54, 55, 8, 9, 23, 24, 25, 26, 27, 28, 63, 69,
                    75, 112, 113, 114, 115, 118, 119, 121, 120, 122, 123, 124, 117, 0, 136, 137, 134, 7,
                    4, 5, 6, 56, 57, 58, 22, 19, 11, 12, 15, 16, 17, 18, 13, 10, 21, 20, 3, 138, 139, 140,
                    141, 142, 144, 143, 146, 145, 147, 148, 149, 150, 157, 156, 159, 158, 160, 161, 162, 163,
                    164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 47, 51, 48, 49, 50, 52, 29, 59,
                    106, 107, 108, 109, 110, 111, 151, 152, 153, 154, 155, 116, 2, 1, 125, 132];

const mapsTablePt = [ 178, 176, 177, 53, 179, 180, 181, 182, 54, 55, 8, 9, 23, 24, 25, 26, 27, 28, 63, 70, 69,
                    75, 112, 113, 114, 115, 118, 119, 121, 120, 122, 123, 124, 117, 0, 136, 137, 134, 135, 7,
                    4, 5, 6, 56, 57, 58, 22, 19, 11, 12, 15, 16, 17, 18, 13, 10, 21, 20, 3, 138, 139, 140, 141,
                    142, 144, 143, 146, 145, 147, 148, 149, 150, 157, 156, 159, 158, 160, 161, 162, 163, 164, 165,
                    166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 47, 51, 48, 49, 50, 52, 29, 59, 106, 107,
                    108, 109, 110, 111, 151, 152, 153, 154, 155, 116, 2, 1, 125, 132 ];

const mapsTableHGSS = [ 66, 69, 70, 97, 20, 0, 95, 98, 133, 140, 139, 141, 14, 15, 16, 99, 93, 94, 128, 41, 42, 132,
                    101, 65, 137, 108, 109, 80, 79, 86, 88, 81, 87, 89, 83, 74, 75, 76, 77, 78, 51, 96, 58, 5, 85,
                    53, 54, 55, 56, 72, 106, 40, 23, 100, 82, 18, 19, 27, 111, 136, 112, 113, 114, 115, 116, 117,
                    118, 119, 120, 121, 92, 122, 123, 124, 125, 126, 127, 129, 130, 131, 103, 104, 105, 1, 3, 4, 8,
                    17, 21, 22, 25, 26, 38, 39, 52, 57, 59, 67, 68, 71, 102, 60, 61, 62, 63, 110, 9, 10, 30, 28, 29,
                    6, 43, 44, 46, 48, 2 ];


async function loadPokemonNames(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder('utf-16').decode(buffer);
        return text.split('\r\n');
    } catch (error) {
        console.error('Error in loadPokemonNames:', error);
        throw error;
    }
}

async function loadAreaNames(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder('utf-16').decode(buffer);
        return text.split('\r\n');
    } catch (error) {
        console.error('Error in loadAreaNames:', error);
        throw error;
    }
}


//Not Used
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

    //availableGames = ['C', 'GS', 'RS', 'E', 'FRLG', 'DP', 'Pt', 'HGSS', 'BW', 'B2W2', 'XY', 'OR', 'AS'];
    availableGames = ['D', 'P', 'Pt', 'HG', 'SS'];
    availableGameNames = ['Diamond', 'Pearl', 'Platinum', 'HeartGold', 'SoulSilver'];

    if (searchedPokemonName) {
        let pokemonData = [];
        for (let i = 0; i < availableGames.length; i++) {
            const game = availableGames[i];
            const gameName = availableGameNames[i];
            const data = await loadDAT(`./assets/dat/Slots/${gameName}Slots.dat`, game);
            pokemonData = pokemonData.concat(data);
        }
        if (pokemonData) {
            const searchedPokemon = pokemonData.filter(pokemon => 
                pokemon.pokemonName && pokemon.pokemonName.toLowerCase() === searchedPokemonName.toLowerCase()
            );
            console.log(searchedPokemon);

            if (searchedPokemon.length > 0) {
                const consolidatedData = {};

                searchedPokemon.forEach(gameData => {
                    const key = `${gameData.game}-${gameData.pokemonLocation}-${gameData.pokemonEncounterType}`;
                    if (!consolidatedData[key]) {
                        consolidatedData[key] = {
                            game: gameData.game,
                            location: gameData.pokemonLocation,
                            encounterType: gameData.pokemonEncounterType,
                            minLv: gameData.pokemonMinLv,
                            maxLv: gameData.pokemonMaxLv,
                            encounterRate: gameData.pokemonEncounterRate
                        };
                    } else {
                        consolidatedData[key].minLv = Math.min(consolidatedData[key].minLv, gameData.pokemonMinLv);
                        consolidatedData[key].maxLv = Math.max(consolidatedData[key].maxLv, gameData.pokemonMaxLv);
                        consolidatedData[key].encounterRate += gameData.pokemonEncounterRate;
                    }
                });

                const finalConsolidatedData = {};

                Object.values(consolidatedData).forEach(data => {
                    const key = `${data.game}-${data.location}`;
                    if (!finalConsolidatedData[key]) {
                        finalConsolidatedData[key] = {
                            game: data.game,
                            location: data.location,
                            encounterTypes: []
                        };
                    }
                    finalConsolidatedData[key].encounterTypes.push({
                        encounterType: data.encounterType,
                        minLv: data.minLv,
                        maxLv: data.maxLv,
                        encounterRate: data.encounterRate
                    });
                });

                const gameGroups = {};

                Object.values(finalConsolidatedData).forEach(data => {
                    if (!gameGroups[data.game]) {
                        gameGroups[data.game] = [];
                    }
                    gameGroups[data.game].push(data);
                });

                let htmlContent = '';

                Object.keys(gameGroups).forEach(game => {
                    htmlContent += `
                        <button type="button" class="collapsible">${game}</button>
                        <div class="content">
                    `;
                    gameGroups[game].forEach(data => {
                        htmlContent += `
                            <p><strong>Location:</strong> ${data.location}</p>
                        `;
                        const regularEncounter = data.encounterTypes.find(encounter => encounter.encounterType === 'Grass/Walking');
                        data.encounterTypes.forEach(encounter => {
                            if ((encounter.encounterType !== 'Day Encounter' && encounter.encounterType !== 'Night Encounter') || !regularEncounter || 
                                (regularEncounter.minLv !== encounter.minLv && regularEncounter.maxLv !== encounter.maxLv)) {
                                htmlContent += `
                                    <p><strong>Encounter Type:</strong> ${encounter.encounterType}</p>
                                    <p><strong>Min Level:</strong> ${encounter.minLv}</p>
                                    <p><strong>Max Level:</strong> ${encounter.maxLv}</p>
                                    <p><strong>Encounter Rate:</strong> ${encounter.encounterRate}%</p>
                                    <hr>
                                `;
                            }
                        });
                    });
                    htmlContent += `</div>`;
                });

                resultsDiv.innerHTML = htmlContent;

                // Re-attach event listeners for the new collapsible buttons
                const coll = document.getElementsByClassName("collapsible");
                for (let i = 0; i < coll.length; i++) {
                    coll[i].addEventListener("click", function() {
                        this.classList.toggle("active");
                        const content = this.nextElementSibling;
                        if (content.style.maxHeight){
                            content.style.maxHeight = null;
                          } else {
                            content.style.maxHeight = content.scrollHeight + "px";
                          }
                    });
                }
            } else {
                resultsDiv.innerHTML = '<p>No encounter data found for this Pokemon.</p>';
            }
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
