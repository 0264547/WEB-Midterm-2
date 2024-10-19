const express = require('express');
const app = express();
const https = require("https");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
var characterList;
var contador = 0;
let page = 0; 
const perPage = 10; // cuantos monos por pagina 

//lista de familias para el display por familias
var families = {
    'House Targaryen': 'Targaryen',
    'Targaryan': 'Targaryen',
    'House Tarly': 'Tarly',
    'House Stark': 'Stark',
    'Stark': 'Stark',
    'House Baratheon': 'Baratheon',
    'Baratheon': 'Baratheon',
    'House Lannister': 'Lannister',
    'Lannister': 'Lannister',
    'House Lanister': 'Lannister',
    'House Greyjoy': 'Greyjoy',
    'Greyjoy': 'Greyjoy',
    'House Clegane': 'Clegane',
    'House Baelish': 'Baelish',
    'House Seaworth': 'Seaworth',
    'Bronn': 'Bronn',
    'House Tyrell': 'Tyrell',
    'Tyrell': 'Tyrell',
    'Free Folk': 'Free Folk',
    'Qyburn': 'Qyburn',
    'Worm': 'Worm',
    'Tarth': 'Tarth',
    'Naathi': 'Naathi',
    'Bolton': 'Bolton',
    'Naharis': 'Naharis',
    'Lorathi': 'Lorathi',
    'Mormont': 'Mormont',
    'Sparrow': 'Sparrow',
    'Viper': 'Viper',
    'Lorath': 'Lorath',
    'Sand': 'Sand',
    'Unknown': 'Unknown',
    'Unkown': 'Unknown',
    '': 'Unknown',
    'None': 'None'
    };

app.listen(3000, () => {
    console.log("Server running on port 3000");
});


app.get('/', (req, res) => {
    // Obtener un solo personaje
    var singleCharacterUrl = `https://thronesapi.com/api/v2/Characters/${contador}`;
    https.get(singleCharacterUrl, (response) => {
        var singleContent = "";

        response.on("data", (data) => {
            singleContent += data;
        }).on("end", () => {
            const characterData = JSON.parse(singleContent);

            
            const iceAndFireUrl = `https://anapioficeandfire.com/api/characters?name=${encodeURIComponent(characterData.fullName)}`;

            https.get(iceAndFireUrl, (response) => {
                let iceContent = "";

                response.on("data", (data) => {
                    iceContent += data;
                }).on("end", () => {
                    const iceCharacterData = JSON.parse(iceContent);

                   
                    const mergedCharacter = {
                        imageUrl: characterData.imageUrl,
                        id: characterData.id,
                        firstName: characterData.firstName,
                        lastName: characterData.lastName,
                        fullName: characterData.fullName,
                        title: characterData.title,
                        family: characterData.family,
                        born: iceCharacterData[0]?.born || 'Unknown', 
                        died: iceCharacterData[0]?.died || 'Unknown', 
                        aliases: iceCharacterData[0]?.aliases || [], 
                        familyCrest: 'URL_OF_FAMILY_CREST' 
                    };

                    // Obtener múltiples personajes
                    const thronesApiUrl = 'https://thronesapi.com/api/v2/Characters';

                    https.get(thronesApiUrl, (response) => {
                        let multipleContent = "";

                        response.on("data", (data) => {
                            multipleContent += data;
                        }).on("end", () => {
                            const characters = JSON.parse(multipleContent);

                            const iceAndFirePromises = characters.map(character => {
                                const iceAndFireUrl = `https://anapioficeandfire.com/api/characters?name=${encodeURIComponent(character.fullName)}`;
                                return new Promise((resolve, reject) => {
                                    https.get(iceAndFireUrl, (response) => {
                                        let iceContent = "";
                                        response.on("data", (data) => {
                                            iceContent += data;
                                        }).on("end", () => {
                                            const iceCharacterData = JSON.parse(iceContent);
                                            const mergedCharacter = {
                                                ...character,
                                                born: iceCharacterData[0]?.born || 'Unknown',
                                                died: iceCharacterData[0]?.died || 'Unknown',
                                                aliases: iceCharacterData[0]?.aliases || [],
                                                familyCrest: 'URL_OF_FAMILY_CREST',
                                            };
                                            resolve(mergedCharacter);
                                        }).on("error", reject);
                                    }).on("error", reject);
                                });
                            });

                            Promise.all(iceAndFirePromises).then(mergedCharacters => {
                                characterList = mergedCharacters;

                                characterList.forEach(character => {
                                    character.family = families[character.family] || 'Unknown';
                                });

                                console.log(characterList);
                                var familyArr = new Set(Object.values(families));
                                res.render("fake", { single: mergedCharacter, characters: mergedCharacters, contador, page, families: familyArr });
                            }).catch(error => {
                                console.error("Error fetching data from Ice and Fire API", error);
                                res.status(500).send("Error fetching data");
                            });
                        }).on("error", (e) => {
                            console.error("Error fetching Thrones API data", e);
                            res.status(500).send("Error fetching data");
                        });
                    });
                }).on("error", (e) => {
                    console.error("Error:", e);
                    res.status(500).send("Error fetching data");
                });
            });
        }).on("error", (e) => {
            console.error("Error:", e);
            res.status(500).send("Error fetching data");
        });
    });
});


app.get('/search', (req, res) => {
    var name = req.query.search; 
    if (!name) {
        return res.status(400).json({ error: 'q te pasa busca algo bien' });
    }

    const url = `https://thronesapi.com/api/v2/Characters`;

    https.get(url, (response) => {
        let content = "";

        response.on("data", (data) => {
            content += data;
        }).on("end", () => {
            const characterData = JSON.parse(content);
           
            if (!characterData || characterData.length === 0) {
                return res.render("error", { message: 'No se encontraron personajes.' });
            }

            // Buscar personaje en la API de Thrones por nombre
            const foundCharacter = characterData.find(character =>
                character.firstName.toLowerCase() === name.toLowerCase() ||
                character.lastName.toLowerCase() === name.toLowerCase() ||
                character.fullName.toLowerCase() === name.toLowerCase()
            );

            if (!foundCharacter) {
                return res.render("error", { message: 'Personaje no encontrado.' });
            }

            // Detalles del personaje en la API de Thrones
            const characterId = foundCharacter.id;
            const characterUrl = `https://thronesapi.com/api/v2/Characters/${characterId}`;

            https.get(characterUrl, (response) => {
                let characterDetailContent = "";

                response.on("data", (data) => {
                    characterDetailContent += data;
                }).on("end", () => {
                    const characterDetail = JSON.parse(characterDetailContent);

                    // Ahora buscar en la API de Ice and Fire (opcional)
                    const iceAndFireUrl = `https://anapioficeandfire.com/api/characters?name=${encodeURIComponent(characterDetail.fullName)}`;

                    https.get(iceAndFireUrl, (response) => {
                        let iceContent = "";

                        response.on("data", (data) => {
                            iceContent += data;
                        }).on("end", () => {
                            let iceCharacterData = [];
                            try {
                                iceCharacterData = JSON.parse(iceContent);
                            } catch (e) {
                                console.error("Error al parsear datos de Ice and Fire:", e);
                            }

                            // Si no existe el personaje en Ice and Fire, manejarlo graciosamente
                            const characterFound = iceCharacterData.find(character => character.name && character.name.toLowerCase() === characterDetail.fullName.toLowerCase()) || {};

                            // Fusionar datos de ambas APIs
                            const mergedCharacter = {
                                imageUrl: characterDetail.imageUrl,
                                id: characterDetail.id,
                                firstName: characterDetail.firstName,
                                lastName: characterDetail.lastName,
                                fullName: characterDetail.fullName,
                                title: characterDetail.title,
                                family: characterDetail.family,
                                born: characterFound.born || 'Unknown',  // Si no existe, "Unknown"
                                died: characterFound.died || 'Unknown',  // Si no existe, "Unknown"
                                aliases: characterFound.aliases || [],  // Si no existe, vacío
                                familyCrest: 'URL_OF_FAMILY_CREST' // Puede ser un campo por defecto si no lo tienes
                            };

                            // Renderizar la página con los datos del personaje fusionados
                            res.render("personaje", { characterData: mergedCharacter });
                        }).on("error", (e) => {
                            console.error("Error en la API de Ice and Fire:", e);
                            // En caso de error, solo mostrar los datos de la API de Thrones
                            const mergedCharacter = {
                                imageUrl: characterDetail.imageUrl,
                                id: characterDetail.id,
                                firstName: characterDetail.firstName,
                                lastName: characterDetail.lastName,
                                fullName: characterDetail.fullName,
                                title: characterDetail.title,
                                family: characterDetail.family,
                                born: 'Unknown',
                                died: 'Unknown',
                                aliases: [],
                                familyCrest: 'URL_OF_FAMILY_CREST'
                            };
                            res.render("personaje", { characterData: mergedCharacter });
                        });
                    });
                }).on("error", (e) => {
                    console.error("Error en la API de Thrones:", e);
                    res.status(500).json({ error: 'Error en la API de Thrones.' });
                });
            });
        }).on("error", (e) => {
            console.error("Error:", e);
            res.status(500).json({ error: 'Error en la búsqueda de personajes.' });
        });
    });
});



app.get('/nex', (req, res) => {
    if (contador < 52) {  
        contador += 1;
    }
    res.redirect('/');
});


app.get('/prev', (req, res) => {
    if (contador > 0) {
        contador -= 1;
    }
    res.redirect('/');
});



app.get('/next', (req, res) => {
    page += 1;
    res.redirect('/');
});

app.get('/previous', (req, res) => {
    if (page > 0) {
        page -= 1;
    }
    res.redirect('/');
});