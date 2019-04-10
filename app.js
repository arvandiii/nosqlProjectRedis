const Redis = require("ioredis");
const uuid = require("uuid/v4");
const bluebird = require("bluebird");

const redis = new Redis();

let userPhoneNumber = null;

const login = phoneNumber => {
  userPhoneNumber = phoneNumber;
};

const sendMessage = async (chatId, text, isFromApp) => {
  const messageId = uuid();
  const now = Date.now();

  const message = {
    sender: isFromApp ? null : userPhoneNumber,
    chatId,
    date: now,
    id: messageId,
    text
  };

  // ye message sakhtim
  await redis.set(`msg:${messageId}`, JSON.stringify(message));

  // message ro ezafe konim be message haye chat
  await redis.zadd(`chat:msgs:${chatId}`, now, messageId);

  // mikhaym safeye chate hameye ozv ha ro update konim
  const members = await redis.smembers(`members:${chatId}`);
  await bluebird.map(members, async member => {
    await redis.zadd(`user:chats:${member}`, now, chatId);
  });
};

const join = async chatId => {
  // ozve gorohesh konim
  await redis.sadd(`members:${chatId}`, userPhoneNumber);

  // begim folani join shod
  await sendMessage(chatId, `${userPhoneNumber} joined group`, true);
};

const createGroup = async (phoneNumbers, groupName) => {
  const chatId = uuid();

  // aval ye goroh ba in nam besazim baraye in chatId
  await redis.set(`chat:info:${chatId}`, `gp:${groupName}`);

  // hameye adama ro add konim be group
  await bluebird.map(phoneNumbers, async phoneNumber => {
    await redis.sadd(`members:${chatId}`, phoneNumber);
  });

  // begim goroh sakhte shod
  await sendMessage(chatId, `group created by ${userPhoneNumber}`, true);
};

const createPrivate = async phoneNumber => {
  const chatId = uuid();

  // baraye in chatId ye obj misazim k bege esmesh chie
  await redis.set(
    `chat:info:${chatId}`,
    `pv:${userPhoneNumber}:${phoneNumber}`
  );

  // members addeshon mikardim
  await redis.sadd(`members:${chatId}`, phoneNumber, userPhoneNumber);

  // payam midim k folani chat ro shoro kard
  await sendMessage(chatId, `${userPhoneNumber} started chat`, true);
};

const getMessages = async chatId => {
  const messageIds = await redis.zrevrange(`chat:msgs:${chatId}`, 0, -1);
  const messages = await bluebird.map(messageIds, async messageId => {
    return JSON.parse(await redis.get(`msg:${messageId}`));
  });

  // bayad last seen ro avaz konim

  return messages;
};

const getChats = async () => {
  const chatIds = await redis.zrevrange(`user:chats:${userPhoneNumber}`, 0, -1);
  const chats = await bluebird.map(chatIds, async chatId => {
    const chatName = await redis.get(`chat:info:${chatId}`);
    return {
      chatName,
      chatId
    };
  });
  return chats;
};

const getContacts = namePattern => {};
const addContact = (phoneNumber, name) => {};
const removeContact = phoneNumber => {};

module.exports = {
  login,
  join,
  sendMessage,
  getMessages,
  getChats,
  createPrivate,
  createGroup
};
