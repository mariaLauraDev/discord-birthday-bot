const dotenv = require('dotenv');
dotenv.config();
const { Client, GatewayIntentBits } = require("discord.js");
const cron = require('node-cron');
const  firebase = require("firebase-admin");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const firebaseServiceAccount = require("./firebaseCredentials");
firebase.initializeApp({
  credential: firebase.credential.cert(firebaseServiceAccount),
  databaseURL: process.env.DATABASE_URL
});
const db = firebase.database();

client.on('ready', () => {
    console.log(`Bot iniciado com sucesso! Nome do bot: ${client.user.tag}`);
    let channel = client.channels.cache.get(process.env.GUILD_ID);
    channel.send('Olá, esta é uma mensagem enviada pelo bot ao iniciar o script.');
});

client.on('messageCreate', message => {
    if (message.content === '!comandos') {
    message.reply('**Comandos disponíveis:** \n!niver -> Adicionar novo aniversário, ex.: !niver Laura 14/12 \n!excluir -> Excluir aniversário pelo nome, ex.: !excluir Laura \n!listar -> Listar todos os aniversários cadastrados');
    }
});

client.on('messageCreate', message => {
    if (message.content.startsWith('!niver')) {
      let birthday = message.content.split(" ").slice(1).join(" ");
      let name = birthday.split(" ")[0];
      let date = birthday.split(" ")[1];
      db.ref('birthdays').child(`${name}`).set({ name, date });
      message.reply(`O aniversário de ${name} foi adicionado com sucesso ao banco de dados.`);
    }
});

client.on('messageCreate', message => {
    if (message.content === '!listar') {
      db.ref('birthdays').once('value', snapshot => {
        let birthdays = snapshot.val();
        let messageText = '**Aniversários cadastrados:** \n';
        for (let key in birthdays) {
          messageText += `${birthdays[key].name} - ${birthdays[key].date}\n`;
        }
        message.reply(messageText);
      });
    }
});

client.on('messageCreate', message => {
    if (message.content.startsWith('!excluir')) {
      let birthdayToDelete = message.content.split(" ").slice(1).join(" ");
      db.ref('birthdays').once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
          if (childSnapshot.val().name === birthdayToDelete) {
            db.ref(`birthdays/${childSnapshot.key}`).remove();
            message.reply(`Aniversário excluído com sucesso: ${birthdayToDelete}`);
          }
        });
      });
    }
});  

cron.schedule("0 36 21 * * *", () => {
    let today = new Date();
    let currentMonth = today.getMonth() + 1;
    let currentDay = today.getDate();

    db.ref('birthdays').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
        let birthdayPerson = childSnapshot.val();
        let birthdayMonth = parseInt(birthdayPerson.date.split("/")[1]);
        let birthdayDay = parseInt(birthdayPerson.date.split("/")[0]);

        if (birthdayMonth === currentMonth && birthdayDay === currentDay) {
            client.channels.cache.get(process.env.GUILD_ID).send(`@everyone, hoje é aniversário do(a) ${birthdayPerson.name}. Parabenize-o(a) por mais um ano de vida! :confetti_ball: :tada: :clap_tone2:`);
        }
        });
    });
});

client.login(process.env.DISCORD_TOKEN);
