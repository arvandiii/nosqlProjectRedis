const vorpal = require("vorpal")();
const api = require("./api");
const { table } = require("table");

let userPhoneNumber = null;

const data = [["0A", "0B", "0C"], ["1A", "1B", "1C"], ["2A", "2B", "2C"]];
const output = table(data);

vorpal.command("login <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  userPhoneNumber = phoneNumber;
  callback();
});

vorpal.command("sendMessage <chatId> <text>").action((args, callback) => {
  const { chatId, text } = args;
  api.sendMessage(userPhoneNumber, chatId, text, false).then(() => {
    console.log("message sent");
    callback();
  });
});

vorpal.command("join <chatId>").action((args, callback) => {
  const { chatId } = args;
  api.join(userPhoneNumber, chatId).then(() => {
    console.log("joined chat");
    callback();
  });
});

vorpal
  .command("createGroup <name> <phoneNumbers...>")
  .action((args, callback) => {
    const { name, phoneNumbers } = args;
    api.createGroup(userPhoneNumber, name, phoneNumbers).then(() => {
      console.log("group created");
      callback();
    });
  });

vorpal.command("createPrivate <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  api.createPrivate(userPhoneNumber, phoneNumber).then(() => {
    console.log("private created");
    callback();
  });
});

vorpal.command("getMessages <chatId>").action((args, callback) => {
  const { chatId } = args;
  api.getMessages(userPhoneNumber, chatId).then(messages => {
    console.log(messages);
    callback();
  });
});

vorpal.command("getChats").action((args, callback) => {
  api.getChats(userPhoneNumber).then(chats => {
    console.log(chats);
    callback();
  });
});

vorpal.command("getContacts [str]").action((args, callback) => {
  const { str } = args;
  api.getContacts(userPhoneNumber, str || "").then(contacts => {
    console.log(contacts);
    callback();
  });
});

vorpal.command("addContact <phoneNumber> <name>").action((args, callback) => {
  const { phoneNumber, name } = args;
  api.addContact(userPhoneNumber, phoneNumber, name).then(() => {
    console.log("contact added");
    callback();
  });
});

vorpal.command("removeContact <phoneNumber>").action((args, callback) => {
    const { phoneNumber } = args;
    api.removeContact(userPhoneNumber, phoneNumber).then(() => {
      console.log("contact removed");
      callback();
    });
  });

vorpal.delimiter("app$").show();
