// imports
var csv = require("fast-csv");

const
    builder = require('botbuilder'),
    restify = require('restify');

// atributs
var fichier_csv = [];
var colonne_theme = [];
var colonne_music = [];
var colonne_place = [];
var json = {};
var prestataire = [];
var boutique = [];
var logoBoutique = [];
var prestataire_csv = [];

// fonctions
/*
Mehtode permettant de charger le fichier csv
wedding.csv et initilisant l'attribut fichier_csv
*/
function csv_chargement() {
    csv
        .fromPath("wedding.csv", {
            objectMode:true,
            delimiter: ";",
            headers: true
        })
        .on("data", function(data){

            console.log(data);

            fichier_csv.push(data);

            recuperation_infos(fichier_csv);
        })
        .on("end", function(){
            console.log("done chargement du fichier csv");
        });
}

//recuperation infos
// methode permettant de recuperer les infos
// d'un fichier de colonnes en particulier
// et initialisaant des tableaux
function recuperation_infos(fichier) {

    for (var i = 0; i < fichier.length; i++) {
        if (fichier[i]['theme'] && !colonne_theme.includes(fichier[i]['theme'])) {
            colonne_theme.push(fichier[i]['theme']);
        }

        if (fichier[i]['music'] && !colonne_music.includes(fichier[i]['music'])) {
            colonne_music.push(fichier[i]['music']);
        }

         if (fichier[i]['place'] && !colonne_place.includes(fichier[i]['place'])) {
            colonne_place.push(fichier[i]['place']);
        }

    }
}

function recherche_prestataire (fichier, theme, place, mois) {

  console.log(theme + " " + place + " " + mois);


    for (var i = 0; i < fichier.length; i++) {

        if (mois) {
            if (fichier[i]['theme'] === theme && fichier[i]['place'] === place && mois ===  fichier[i]['date']) {
                prestataire.push(fichier[i]['prestataire']);
                boutique.push(fichier[i]['Boutique']);
                logoBoutique.push(fichier[i]['logoboutique']);
            }
        } else {
            if (fichier[i]['theme'] === theme && fichier[i]['place'] === place) {

                prestataire.push(fichier[i]['prestataire'] + ' ' + fichier[i]['date']);
                boutique.push(fichier[i]['Boutique']);
                logoBoutique.push(fichier[i]['logoboutique']);
            }
        }


    }

}

function prestataire_csv_chargement() {
    csv
        .fromPath("prestataire.csv", {
            objectMode:true,
            delimiter: ";",
            headers: true
        })
        .on("data", function(data){

            console.log(data);

            prestataire_csv.push(data);


        })
        .on("end", function(){
            console.log("done chargement du fichier csv perstataire");
        });
}

const
    server = restify.createServer();
server.listen(3978, () => {
    console.log('Listening on port 3978');
    csv_chargement();
    prestataire_csv_chargement();
});

const
    connector = new builder.ChatConnector({
        appId: '5ca242ba-33c7-411e-a441-569d0ff0b3b0',
        appPassword: '8te2RFBCfXB0a4gntEPRkbZ'
    });
const
    bot = new builder.UniversalBot(connector);
server.post('/', connector.listen());


// Appel du bot d'initialization
bot.dialog('/', [(session) => {
    builder.Prompts.text(session, 'Hello, I am your bot wedding planner. What is your name ?');
},
    (session, results) => {
        session.userData.name = results.response;
        session.send('Hello %s, I can help you to plane your wedding: the dress, the suit, the place and activities',session.userData.name  );
        session.beginDialog('/theme');
    }
])
;

// Appel du bot theme
bot.dialog('/theme', [
    (session) => {

        builder.Prompts.choice(session, "Let s start with the theme of your wedding. We have 3 themes. What do you want to choose ?", colonne_theme);

    },
    (session, results) => {
        session.send(
            'Nice choice ! The %s theme is a great atmosphere for a wedding',results.response.entity);
        session.userData.theme = results.response.entity;
        session.beginDialog('/date');
    }
]);

// Appel du bot date
bot.dialog('/date', [
    (session) => {
        builder.Prompts.confirm(session, 'Do you have a wedding period ? ( yes/no)');
    },
    (session, results) => {

        if (results.response) {
            session.userData.hasWeddingPeriod = 'yes';
            session.send(
                'Very well, so let\'s see when you\'ll get married'
            );
            session.beginDialog('/month');
        } else {
            session.userData.hasWeddingPeriod = 'no';
            session.send(
                'Don t worry, you will tell you dates to get married according to your wedding desires'
            );
            session.beginDialog('/music');
        }
    }
])
;


// Appel du bot date
bot.dialog('/month', [
    (session) => {
        builder.Prompts.text(session, 'What is the month of your wedding? ( give the number between 1 and 12 !)');
    },
    (session, results) => {

        if (results.response >0 && results.response <13 ) {
            session.userData.month = results.response;
            session.beginDialog('/music');
        }
        else {
            session.send(
                'Please enter the number of the month'
            );
            session.beginDialog('/month');
        }
    }
])
;



// Appel du bot music
bot.dialog('/music', [
   (session) => {

        builder.Prompts.choice(session, "It’s time to choose the music. What do you want ?", colonne_music);

    },
    (session, results) => {
        session.send(
            'Very good choice ! With %s the atmosphere is guarenteed', results.response.entity
        );
        session.userData.music = results.response.entitys;
        session.beginDialog('/place');
    }

]);
// Bot Place 

bot.dialog('/place',[
   (session) => {
       builder.Prompts.number(session,'How many people do you want to invit ?');
   },

   (session, results) => {
       session.userData.nbGuest = results.response;
       session.send('Nice ! you have %d guests ',session.userData.nbGuest );
      builder.Prompts.choice(session, "It’s time to choose your place. What kind of place do you want ?", colonne_place);
   },
   (session, results) => {
       session.userData.typeOfPlace = results.response.entity;
       session.send('Nice ! your choice is an %s place ',session.userData.typeOfPlace );
       session.beginDialog('/dress');
   }
]);


bot.dialog('/dress', [  
 function (session) {
               // Ask the user to You choice an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Boheme dress")
                    .text("This is the perfect wedding dress if you are tall and you have: An X-shaped morphology or A morphology in 8.")
                    .images([
                        builder.CardImage.create(session, "http://marie-laporte.fr/wp-content/uploads/2016/06/canelle-2N2A6203-marie-laporte-creatrice-robe-mariee-2017.jpg")
                            .tap(builder.CardAction.showImage(session, "http://marie-laporte.fr/wp-content/uploads/2016/06/canelle-2N2A6203-marie-laporte-creatrice-robe-mariee-2017.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.imBack(session, "You choice:Boheme dress", "I want this")
                    ]),
                new builder.HeroCard(session)
                    .title("Siren dress")
                    .text("It is a form of wedding dress ideal if you are tall and you have: A morphology in X or A morphology in 8.")
                    .images([
                        builder.CardImage.create(session, "http://imgjy.com/NW0723/m/7.jpg")
                            .tap(builder.CardAction.showImage(session, "http://imgjy.com/NW0723/m/7.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.imBack(session, "You choice:Siren dress", "I want this")
                    ]),
                new builder.HeroCard(session)
                    .title("Princess dress")
                    .text("This is the perfect wedding dress if you are tall and you have:A morphology in A or A V-shaped morphology.")
                    .images([
                        builder.CardImage.create(session, "http://www.persun.fr/img/WBCE1766/v/1.jpg")
                            .tap(builder.CardAction.showImage(session, "http://www.persun.fr/img/WBCE1766/v/1.jpg"))
                    ])
                    .buttons([
                        builder.CardAction.imBack(session, "You choice:Princess dress", "I want this")
                    ])
            ]);
        builder.Prompts.choice(session, msg, "You choice:Boheme dress|You choice:Siren dress|You choice:Princess dress");
    },
    function (session, results) {
        if (results.response) {
            var action, item;
            var kvPair = results.response.entity.split(':');
            switch (kvPair[0]) {
                case 'You choice':
                    action = 'choice';
                    break;
            }
            switch (kvPair[1]) {
                case 'Boheme dress':
                    item = "Boheme dress";
                    break;
                case 'Siren dress':
                    item = "Siren dress";
                    break;
                case 'Princess dress':
                    item = "Princess dress";
                    break;
            }
            session.userData.dressstyle =item;
           // session.send('You %s "%s"', action, item);
             session.beginDialog('/color');
        } else {
            session.endDialog("You canceled.");
        }
    }    
]);

bot.dialog('/color', [
  (session) => {
    builder.Prompts.text(session, 'Tell me which color do you prefer ?');
  },
  (session, results) => {
    session.send(
      'You have good taste ! A %s  %s', 
      results.response, session.userData.dressstyle
    );
    session.beginDialog('/proposition');
   }
]);

bot.dialog('/proposition', [
    (session) => {
        builder.Prompts.text(session, 'i ll propose you prestataires. please enter a letter to confirm');
        //console.log("avec date outdoor african result attendu 2");
        recherche_prestataire(prestataire_csv, session.userData.theme, session.userData.typeOfPlace, session.userData.month);
        console.log( prestataire[0] + " avec date outdoor african result attendu 2");
    },
    (session, results) => {

        console.log(prestataire);
        if (prestataire.length > 0) {

            var s = "";

            for ( var i = 0; i < prestataire.length; i++) {
                s = s.concat(prestataire[i] + " ");
                var proposition = new builder.Message(session)
                    .textFormat(builder.TextFormat.plain)
                    .attachments([
                        new builder.HeroCard(session)
                            .title(prestataire[i])
                            .images([
                                builder.CardImage.create(session,logoBoutique[i])
                                    .tap(builder.CardAction.showImage(session,logoBoutique[i]))
                            ])

                            .buttons([
                        builder.CardAction.imBack(session, "", "I want this")
                    ])
                    ]);
                session.send(proposition);

            }
            session.beginDialog('/end');
        } else {
            session.send("aucun presta a cette data");
        }
        //session.endDialog();
    }
])
;


bot.dialog('/end', [
  (session) => {
    builder.Prompts.confirm(session, 'Ready to resume your choice ? ');
  },
  (session, results) => {
      if (results.response) {

          session.send(
              'For your wedding on month number %s,in the %s theme. You decide to invite %d guests at an %s place ',session.userData.month, session.userData.theme, session.userData.nbGuest, session.userData.typeOfPlace);
          session.send(
              'I think we have everything for your wedding dream. Here is all service provider to be well dressed, welcome your guest in a nice place with friendly ambiance, Good bye !'

          );
      }
      else{
          session.send(
              'I think we have everything for your wedding dream. Here is all service provider to be well dressed, welcome your guest in a nice place with friendly ambiance, Good bye'
          );
      }
    session.endDialog();
  }
]);
