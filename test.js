const vorpal = require("vorpal")();
const api = require("./api");
const { table } = require("table");

let userPhoneNumber = null;

const data = [["0A", "0B", "0C"], ["1A", "1B", "1C"], ["2A", "2B", "2C"]];
const output = table(data);

const validatePhoneNumber = phoneNumber =>
  typeof phoneNumber === "string" && phoneNumber.length === 4;

vorpal
  .command("login")
  .option("-n, --phoneNumber <phoneNumber>")
  .types({ string: ["n", "phoneNumber"] })
  .action((args, callback) => {
    const {
      options: { phoneNumber }
    } = args;
    if (!validatePhoneNumber(phoneNumber)) {
      return callback("phone is not valid");
    }
    vorpal.delimiter(`app:${phoneNumber}$`);
    vorpal.ui.refresh();
    userPhoneNumber = phoneNumber;
    return callback("login successful");
  });

vorpal.command("sendMessage <chatId> <text>").action((args, callback) => {
  const { chatId, text } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.sendMessage(userPhoneNumber, chatId, text, false).then(callback);
});

vorpal.command("join <chatId>").action((args, callback) => {
  const { chatId } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.join(userPhoneNumber, chatId).then(callback);
});

vorpal
  .command("createGroup <name> <phoneNumbers...>")
  .action((args, callback) => {
    const { name, phoneNumbers } = args;
    if (!userPhoneNumber) {
      callback("login required");
    }
    api.createGroup(userPhoneNumber, name, phoneNumbers).then(callback);
  });

vorpal.command("createPrivate <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.createPrivate(userPhoneNumber, phoneNumber).then(callback);
});

vorpal.command("getMessages <chatId>").action((args, callback) => {
  const { chatId } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.getMessages(userPhoneNumber, chatId).then(callback);
});

vorpal.command("getChats").action((args, callback) => {
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.getChats(userPhoneNumber).then(callback);
});

vorpal.command("getContacts [str]").action((args, callback) => {
  const { str } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.getContacts(userPhoneNumber, str || "").then(callback);
});

vorpal.command("addContact <phoneNumber> <name>").action((args, callback) => {
  const { phoneNumber, name } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.addContact(userPhoneNumber, phoneNumber, name).then(callback);
});

vorpal.command("removeContact <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  if (!userPhoneNumber) {
    callback("login required");
  }
  api.removeContact(userPhoneNumber, phoneNumber).then(callback);
});

vorpal.delimiter("app$").show();
