const express = require('express');
const app = express();
const https = require("https");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));//load the files that must be public like img, css js etc
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
var contador = 0;


app.listen(3000, () => {
    console.log(" on port 3000");
  });
  
  app.get('/', (req, res) => {
    var url = `https://thronesapi.com/api/v2/Characters/${contador}`;
    https.get(url, (response) => {
        var content = "";

        response.on("data", (data) => {
            content += data;
        }).on("end", () => {
            var jsonObj = JSON.parse(content);
            // Renderizar la página con los datos del personaje
            res.render("fake", { character: jsonObj, contador });
        }).on("error", (e) => {
            console.error("Error:", e);
        });
    });
});

app.get('/next', (req, res) => {
    if (contador < 52) {  
        contador += 1;
    }
    res.redirect('/');
});


app.get('/previous', (req, res) => {
    if (contador > 0) {
        contador -= 1;
    }
    res.redirect('/');
});