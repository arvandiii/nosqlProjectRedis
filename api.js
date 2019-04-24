const Redis = require("ioredis");
const uuid = require("uuid/v4");
const bluebird = require("bluebird");
const md5 = require("md5");

const redis = new Redis();
const error = msg => `\x1b[31m${msg}\x1b[0m`;

const sendMessage = async (sender, chatId, text) => {
  const messageId = uuid();
  const now = Date.now();

  const message = {
    sender,
    chatId,
    date: now,
    id: messageId,
    text
  };

  if (sender) {
    // check konim k chat vojod dashte bashe
    const exists = await redis.exists(`chat:msgs:${chatId}`);
    if (!exists) {
      return error("chat is not valid");
    }

    // check konim k aya taraf ozve chat hast ya na
    const isMember = await redis.sismember(`members:${chatId}`, sender);
    if (!isMember) {
      return error("you are not allowed to send message to this chat");
    }
  }

  // ye message sakhtim
  await redis.set(`msg:${messageId}`, JSON.stringify(message));

  // message ro ezafe konim be message haye chat
  await redis.zadd(`chat:msgs:${chatId}`, now, messageId);

  // mikhaym safeye chate hameye ozv ha ro update konim
  const members = await redis.smembers(`members:${chatId}`);
  await bluebird.map(members, async member => {
    await redis.zadd(`user:chats:${member}`, now, chatId);
  });

  return "message sent";
};

const join = async (userPhoneNumber, chatId) => {
  // check konim k chat vojod dashte bashe
  const exists = await redis.exists(`chat:msgs:${chatId}`);
  if (!exists) {
    return error("chat is not valid");
  }

  // ozve gorohesh konim
  await redis.sadd(`members:${chatId}`, userPhoneNumber);

  // begim folani join shod
  await sendMessage(null, chatId, `${userPhoneNumber} joined group`);

  return "group is joined";
};

const createGroup = async (userPhoneNumber, groupName, phoneNumbers) => {
  const chatId = uuid();

  // aval ye goroh ba in nam besazim baraye in chatId
  await redis.set(`chat:info:${chatId}`, `gp:${groupName}`);

  // khodesh ro add kon be group
  await redis.sadd(`members:${chatId}`, userPhoneNumber);

  // hameye adama ro add konim be group
  await bluebird.map(phoneNumbers, async phoneNumber => {
    await redis.sadd(`members:${chatId}`, phoneNumber);
  });

  // begim goroh sakhte shod
  await sendMessage(null, chatId, `group created by ${userPhoneNumber}`);

  return "group created";
};

const createPrivate = async (userPhoneNumber, phoneNumber) => {
  const chatId = uuid();

  // baraye in chatId ye obj misazim k bege esmesh chie
  await redis.set(
    `chat:info:${chatId}`,
    `pv:${userPhoneNumber}:${phoneNumber}`
  );

  // members addeshon mikardim
  await redis.sadd(`members:${chatId}`, phoneNumber, userPhoneNumber);

  // payam midim k folani chat ro shoro kard
  await sendMessage(null, chatId, `${userPhoneNumber} started chat`);

  return "private chat started";
};

const getMessages = async (userPhoneNumber, chatId) => {
  // check konim k chat vojod dashte bashe
  const exists = await redis.exists(`chat:msgs:${chatId}`);
  if (!exists) {
    return error("chat is not valid");
  }

  // check konim k aya taraf ozve chat hast ya na
  const isMember = await redis.sismember(`members:${chatId}`, userPhoneNumber);
  if (!isMember) {
    return error("you are not allowed to send message to this chat");
  }

  const messageIds = await redis.zrevrange(`chat:msgs:${chatId}`, 0, -1);

  const lastSeen = await redis.get(`lastSeen:${userPhoneNumber}`);

  const messages = await bluebird.map(messageIds, async messageId => {
    const msg = JSON.parse(await redis.get(`msg:${messageId}`));
    Object.assign(msg, { hasSeen: lastSeen ? msg.date < lastSeen : false });
    return msg;
  });

  // bayad last seen ro avaz konim
  await redis.set(`lastSeen:${userPhoneNumber}`, Date.now());

  return JSON.stringify(messages, null, 4);
};

const getChats = async userPhoneNumber => {
  const chatIds = await redis.zrevrange(`user:chats:${userPhoneNumber}`, 0, -1);
  const chats = await bluebird.map(chatIds, async chatId => {
    const rawChatName = await redis.get(`chat:info:${chatId}`);
    const chatType = rawChatName.split(":")[0];
    const chatName =
      chatType === "gp"
        ? rawChatName.replace("gp:", "")
        : rawChatName
            .replace("pv:", "")
            .replace(userPhoneNumber, "")
            .replace(":", "");
    const [lastMessageId] = await redis.zrevrange(`chat:msgs:${chatId}`, 0, 1);

    const lastMessage = await JSON.parse(
      await redis.get(`msg:${lastMessageId}`)
    );
    return {
      chatType,
      chatName,
      chatId,
      lastMessage
    };
  });
  return JSON.stringify(chats, null, 4);
};

const getContacts = async (userPhoneNumber, str) => {
  const contacts = await redis.hscan(
    `contacts:name:${userPhoneNumber}`,
    0,
    "match",
    `*${str}*`
  );
  return JSON.stringify(contacts, null, 4);
};

const addContact = async (userPhoneNumber, phoneNumber, name) => {
  //phoneNumber taraf ra darim. ham name ra darim. bayad add konim.
  await redis.hset(`contacts:number:${userPhoneNumber}`, phoneNumber, name);
  await redis.hset(`contacts:name:${userPhoneNumber}`, name, phoneNumber);

  return "contact added";
};

const removeContact = async (userPhoneNumber, phoneNumber) => {
  const exists = await redis.exists(`contacts:number:${userPhoneNumber}`);
  if (!exists) {
    return error("contact is not valid");
  }

  // avval name e phoneNumber ra yeja save mikonim. bad az har do ta type hazf mikonim satre marbutaro :|
  const name = await redis.hget(
    `contacts:number:${userPhoneNumber}`,
    phoneNumber
  );
  await redis.hdel(`contacts:number:${userPhoneNumber}`, phoneNumber);
  await redis.hdel(`contacts:name:${userPhoneNumber}`, name);
  return "contact removed";
};

const register = async (userPhoneNumber, pass) => {
  await redis.set(`pass:${userPhoneNumber}`, md5(pass));
  console.log("inja", `pass:${userPhoneNumber}`, md5(pass));
  return "registerd";
};

const checkPass = async (userPhoneNumber, pass) => {
  const passHash = await redis.get(`pass:${userPhoneNumber}`);
  console.log(passHash, pass);
  return passHash == md5(pass);
};

module.exports = {
  register,
  checkPass,
  join,
  sendMessage,
  getMessages,
  getChats,
  createPrivate,
  createGroup,
  addContact,
  getContacts,
  removeContact
};
