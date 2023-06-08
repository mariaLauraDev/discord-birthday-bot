const dotenv = require('dotenv');
dotenv.config();
const { Client, GatewayIntentBits } = require("discord.js");
const cron = require('node-cron');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot, doc, setDoc,  limit, query, where, orderBy } = require('firebase/firestore');
const firebaseCredentials = require("./firebaseCredentials");

const express = require('express');
const app = express();

const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const firebaseApp = initializeApp(firebaseCredentials);
const firestoreDb = getFirestore(firebaseApp);
const birthdaysCol = collection(firestoreDb, 'birthdays');

discordClient.on('ready', () => {
    console.log(`Bot iniciado com sucesso! Nome do bot: ${discordClient.user.tag}`);
    let channel = discordClient.channels.cache.get(process.env.GUILD_ID);
    // channel.send('Olá, esta é uma mensagem enviada pelo bot ao iniciar o script.');
});

discordClient.on('messageCreate', message => {
    if (message.content === '!comandos') {
        message.reply('**Comandos disponíveis:** \n!niver -> Adicionar novo aniversário, ex.: !niver <Laura Alves> 14/12/1999 \n!excluir -> Excluir aniversário pelo nome, ex.: !excluir Laura \n!listar -> Listar todos os aniversários cadastrados \n!atualizar -> Atualiza um aniversário existente, ex.: !atualizar <Laura Alves> 15/12/1999');
    }
});

discordClient.on('messageCreate', message => {
    if (message.content.startsWith('!niver')) {
        let regex = /<([^>]+)>/g;
        let matches = regex.exec(message.content);

        if (!matches || matches.length < 2) {
            message.reply("Por favor, forneça um nome válido entre '<...>' seguido da data no formato DD/MM/AAAA.");
            return;
        }

        let name = matches[1].trim();
        let dateIndex = message.content.indexOf('>', matches[0].length);
        let date = message.content.substring(dateIndex + 1).trim();

        const docRef = doc(birthdaysCol);
        const data = { name, date };

        setDoc(docRef, data)
            .then(() => {
                message.reply(`O aniversário de ${name} foi adicionado com sucesso ao banco de dados.`);
            })
            .catch((error) => {
                console.error("Erro ao adicionar aniversário:", error);
                message.reply("Ocorreu um erro ao adicionar o aniversário. Por favor, tente novamente mais tarde.");
            });
    }
});

discordClient.on('messageCreate', message => {
    if (message.content === '!listar') {
        onSnapshot(collection(firestoreDb, 'birthdays'), (snapshot) => {
            let messageText = '**Aniversários cadastrados:** \n';
            snapshot.forEach((doc) => {
                const { name, date } = doc.data();
                messageText += `${name} - ${date}\n`;
            });
            message.reply(messageText);
        });
    }
});


//nao funciona
// discordClient.on('messageCreate', message => {
//   if (message.content.startsWith('!excluir')) {
//       let nameToDelete = message.content.split(" ").slice(1).join(" ");
//       const q = query(birthdaysCol, where("name", "==", nameToDelete));
//       getDocs(q)
//           .then((snapshot) => {
//               const matchingDocs = [];
//               snapshot.forEach((doc) => {
//                   const { name } = doc.data();
//                   if (name === nameToDelete) {
//                       matchingDocs.push(doc);
//                   }
//               });

//               if (matchingDocs.length === 0) {
//                   message.reply(`Não foi encontrado um aniversário cadastrado para o nome: ${nameToDelete}`);
//                   return;
//               }

//               if (matchingDocs.length === 1) {
//                   deleteDoc(matchingDocs[0].ref)
//                       .then(() => {
//                           message.reply(`Aniversário excluído com sucesso: ${nameToDelete}`);
//                       })
//                       .catch((error) => {
//                           console.error("Erro ao excluir aniversário:", error);
//                           message.reply("Ocorreu um erro ao excluir o aniversário. Por favor, tente novamente mais tarde.");
//                       });
//               }

//               if (matchingDocs.length > 1) {
//                   let messageText = `Foram encontrados múltiplos aniversários para o nome: ${nameToDelete}. Informe o sobrenome completo para excluir:\n`;
//                   matchingDocs.forEach((doc, index) => {
//                       const { name } = doc.data();
//                       messageText += `${index + 1}. ${name}\n`;
//                   });
//                   messageText += "Responda com o número correspondente para confirmar a exclusão.";

//                   const filter = (response) => {
//                       return response.author.id === message.author.id && !isNaN(response.content) && parseInt(response.content) <= matchingDocs.length;
//                   };

//                   message.reply(messageText)
//                       .then(() => {
//                           message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ['time'] })
//                               .then((collected) => {
//                                   const selectedNumber = parseInt(collected.first().content);
//                                   const selectedDoc = matchingDocs[selectedNumber - 1];
//                                   deleteDoc(selectedDoc.ref)
//                                       .then(() => {
//                                           message.reply(`Aniversário excluído com sucesso: ${selectedDoc.data().name}`);
//                                       })
//                                       .catch((error) => {
//                                           console.error("Erro ao excluir aniversário:", error);
//                                           message.reply("Ocorreu um erro ao excluir o aniversário. Por favor, tente novamente mais tarde.");
//                                       });
//                               })
//                               .catch(() => {
//                                   message.reply("Tempo de resposta expirado. A exclusão foi cancelada.");
//                               });
//                       });
//               }
//           })
//           .catch((error) => {
//               console.error("Erro ao buscar aniversário:", error);
//               message.reply("Ocorreu um erro ao buscar o aniversário. Por favor, tente novamente mais tarde.");
//           });
//   }
// });

//nao funciona
// discordClient.on('messageCreate', message => {
//     if (message.content.startsWith('!atualizar')) {
//         let regex = /<([^>]+)>/g;
//         let matches = regex.exec(message.content);

//         if (!matches || matches.length < 2) {
//             message.reply("Por favor, forneça um nome válido entre '<...>' seguido da nova data no formato DD/MM/AAAA.");
//             return;
//         }

//         let name = matches[1].trim();
//         let dateIndex = message.content.indexOf('>', matches[0].length);
//         let date = message.content.substring(dateIndex + 1).trim();

//         const q = query(birthdaysCol, where("name", "==", name), limit(1));
//         getDocs(q)
//             .then((snapshot) => {
//                 snapshot.forEach((doc) => {
//                     updateDoc(doc.ref, { date })
//                         .then(() => {
//                             message.reply(`Aniversário atualizado com sucesso: ${name} - ${date}`);
//                         })
//                         .catch((error) => {
//                             console.error("Erro ao atualizar aniversário:", error);
//                             message.reply("Ocorreu um erro ao atualizar o aniversário. Por favor, tente novamente mais tarde.");
//                         });
//                 });
//             })
//             .catch((error) => {
//                 console.error("Erro ao buscar aniversário:", error);
//                 message.reply("Ocorreu um erro ao buscar o aniversário. Por favor, tente novamente mais tarde.");
//             });
//     }
// });

cron.schedule("34 13 * * *", () => {
  let today = new Date();
  console.log("Verificando aniversários para o dia:", today.toLocaleDateString());
  let currentMonth = today.getMonth() + 1;
  console.log("currentMonth", currentMonth);
  let currentDay = today.getDate();
  console.log("currentDay", currentDay);

  console.log("birthdaysCol",birthdaysCol)

  onSnapshot(collection(firestoreDb, 'birthdays'), (snapshot) => {
    snapshot.forEach((doc) => {
        const { name, date } = doc.data();
        let birthdayMonth = parseInt(date.split("/")[1]);
        let birthdayDay = parseInt(date.split("/")[0]);
        console.log('name', name);
        console.log("date", date);
        console.log("birthdayMonth", birthdayMonth);
        console.log("birthdayDay", birthdayDay);
        console.log("currentMonth === birthdayMonth", currentMonth === birthdayMonth);

        if (birthdayMonth === currentMonth && birthdayDay === currentDay) {
            discordClient.channels.cache.get(process.env.GUILD_ID).send(`@everyone, hoje é aniversário do(a) ${name}. Parabenize-o(a) por mais um ano de vida! :confetti_ball: :tada: :clap_tone2:`);
        }
    });
  });
});

discordClient.login(process.env.DISCORD_TOKEN);
const port = 3000;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
