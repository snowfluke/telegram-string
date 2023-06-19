const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const config = require('./config.json')

const input = require("input");
const showLog = (sign, text) =>
  console.log(`[${sign}] - [${text}]`);

const logger = {
  loading(text) {
    showLog("PROCESS", text);
  },
  info(text) {
    showLog("INFO", text);
  },
  done(text) {
    showLog("SUCCESS", text);
  },
  failed(text) {
    showLog("ERROR", text);
  },
};

let tempObj = [];
let acc = []
const run = async (id) => {
  let index = id
  for (let i = 0; i < acc.length; i++) {
    logger.info("Memulai proses");

    try {
      logger.loading(`Inisiasi klien ${i}`);
      const stringSession = new StringSession("");

      const client = new TelegramClient(
        stringSession,
        config.APP_ID,
        config.APP_HASH,
      );

      client.setLogLevel("none")
      let phoneNumber = acc[i][0];
      let username = acc[i][1];

      let obj = {
        id: index,
        username: username,
        phone: phoneNumber,
        address: acc[i][2],
        solana: "",
        trx: "",
        telegram: {
          string_session: "",
        },
        twitter: {
          "@tw": false,
          "#tw": false,
          "tw": false
        },
        discord: false
      };

      logger.loading(`Mengirimkan permintaan sesi ${i}`);

      await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () =>
          await input.text(
            `=> Masukkan password untuk ${i} [${username}/${phoneNumber}]: `
          ),
        phoneCode: async () =>
          await input.text(
            `=> Masukkan kode untuk ${i} [${username}/${phoneNumber}]: `
          ),
        onError: (err) =>
          logger.failed(
            `Terjadi kesalahan ${i} [${username}/${phoneNumber}]: ${err.message}`
          ),
      });

      obj.telegram.string_session = client.session.save();
      logger.done(`Berhasil menangkap sesi ${i}. [${username}/${phoneNumber}]`);
      tempObj.push(obj);
      index++;
      fs.writeFileSync("result.json", JSON.stringify(tempObj));
      client.disconnect();
    } catch (error) {
      console.log(error);
      logger.failed(`Terjadi kesalahan: ${error.msg}`);
    }
  }

  fs.writeFileSync("result.json", JSON.stringify(tempObj));
  logger.done("Berhasil melaksanakan tugas");
}

const init = async () =>{
  if(config.APP_ID || config.APP_HASH) return logger.failed("CONFIG MASIH KOSONG")
  let inputIndex = await input.text('=> Masukkan jumlah akun saat ini: ')

  if(isNaN(inputIndex)) return console.log('Jumlah akun harus angka')
  let id = Math.abs(inputIndex)
  
  logger.info('Format list: No tele,username,address-dst')
  logger.info('Contoh: +6231231,ade,0x123123-+62321,imam,0x43242')

  let inputList = await input.text("=> Masukkan list: ")
  if(inputList === 'reset'){
    fs.writeFileSync('result.json', '[]')
    console.log('[SUCCESS] Berhasil di reset')
    return
  }
  
  if(!inputList) return console.log('Inputan tidak valid')

  let filter1 = inputList.trim().split('-')
  if(!filter1) return console.log('Inputan tidak valid')

  let filter2 = filter1.map( el => el.split(','))
  if(filter2.some(el => el.length < 3)) return console.log('Inputan tidak valid')

  acc = filter2
  run(id)
}

init()