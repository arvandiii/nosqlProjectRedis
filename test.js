const vorpal = require("vorpal")();
const api = require("./api");
const { table } = require("table");

let userPhoneNumber = null;

const data = [["0A", "0B", "0C"], ["1A", "1B", "1C"], ["2A", "2B", "2C"]];
const output = table(data);

const validatePhoneNumber = phoneNumber =>
  typeof phoneNumber === "string" && phoneNumber.length === 4;

vorpal.command("login <phoneNumber>").action((args, callback) => {
  const { phoneNumber: rawPhoneNumber } = args;
  const phoneNumber = String(rawPhoneNumber);

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
  api.sendMessage(userPhoneNumber, chatId, text, false).then(callback);
});

vorpal.command("join <chatId>").action((args, callback) => {
  const { chatId } = args;
  api.join(userPhoneNumber, chatId).then(callback);
});

vorpal
  .command("createGroup <name> <phoneNumbers...>")
  .action((args, callback) => {
    const { name, phoneNumbers } = args;
    api.createGroup(userPhoneNumber, name, phoneNumbers).then(callback);
  });

vorpal.command("createPrivate <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  api.createPrivate(userPhoneNumber, phoneNumber).then(callback);
});

vorpal.command("getMessages <chatId>").action((args, callback) => {
  const { chatId } = args;
  api.getMessages(userPhoneNumber, chatId).then(callback);
});

vorpal.command("getChats").action((args, callback) => {
  api.getChats(userPhoneNumber).then(callback);
});

vorpal.command("getContacts [str]").action((args, callback) => {
  const { str } = args;
  api.getContacts(userPhoneNumber, str || "").then(callback);
});

vorpal.command("addContact <phoneNumber> <name>").action((args, callback) => {
  const { phoneNumber, name } = args;
  api.addContact(userPhoneNumber, phoneNumber, name).then(callback);
});

vorpal.command("removeContact <phoneNumber>").action((args, callback) => {
  const { phoneNumber } = args;
  api.removeContact(userPhoneNumber, phoneNumber).then(callback);
});

vorpal.delimiter("app$").show();
