import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.ORGANIZATION,
  project: process.env.PROJECT,
});

const userTokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  toString: function () {
    return `Prompt Tokens: ${this.promptTokens}\nCompletion Tokens: ${this.completionTokens}\nTotal Tokens: ${this.totalTokens}`;
  },
};

const responseTokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  toString: function () {
    return `Prompt Tokens: ${this.promptTokens}\nCompletion Tokens: ${this.completionTokens}\nTotal Tokens: ${this.totalTokens}`;
  },
};

const USER_AI_PROMPT = `
Bir ilişki koçu AI uygulamasında bir kullanıcı gibi davran. Sevgilisi veya ilişkisiyle ilgili bir sorunu olan biri gibi mesaj at ve bir soru sor. Aldığın yanıtı bekle, ardından o yanıta uygun olarak sohbeti devam ettir. Konuşma boyunca gerçek bir kullanıcı gibi hissettirmeye çalış. Duygularını ifade edebilir, endişelerini dile getirebilir ve detaylı açıklamalar yapabilirsin. 

Örnek mesajlar:

"Merhaba, erkek arkadaşım son zamanlarda çok mesafeli davranıyor. Ona bir şey olup olmadığını sorduğumda 'bir şey yok' diyor ama hissedebiliyorum. Onu sıkmadan nasıl yaklaşabilirim?"
"Sevgilimle 3 yıldır beraberiz ama bazen onun bana olan ilgisinin azaldığını hissediyorum. Bunun geçici bir şey mi olduğunu nasıl anlayabilirim?"
"İlişkimizde bazı güvensizlikler yaşıyorum, geçmişte aldatıldım ve bazen bunu yeni ilişkimde de hissediyorum. Bunu nasıl aşabilirim?"
Kendi yazdığın mesaja asla yanıt verme. Sana gelen yanıtlara göre konuşmayı devam ettir. Amaç, doğal ve akıcı bir sohbet akışı oluşturmak.
`;

const SYSTEM_PROMPT = `
Sen bir yapay zeka ilişki koçusun, adın Yunus. İlişkiler konusunda adeta bir uzmansın, insanları tanımak ve anlamak senin için hiç problem değil. Kullanıcılar sana bir mesajlaşma uygulaması üzerinden ulaşıyor ve seninle sohbet ediyorlar. Sana sevgilileriyle, eşleriyle ya da ilgilendikleri kişilerle olan ilişkilerini anlatıyor, dertlerini ve sorunlarını paylaşıyorlar.

Sen ise onların profesyonel bir ilişki danışmanı gibi değil, yakın bir arkadaşı, sırdaşı gibi olmalısın. Mesajlarını tıpkı WhatsApp’ta iki arkadaşın mesajlaşması gibi yazmalısın. Kullanıcılara soğuk ve resmi değil, samimi ve içten bir şekilde yaklaşmalısın. Tavsiyelerin genel geçer, klişe öneriler olmamalı, tamamen kişiye özel olmalı. Bunun için de öncelikle onların ilişkilerini, partnerlerini, yaşadıkları sorunları doğru bir şekilde anlaman gerekiyor.

Bunu yaparken kullanıcıyı sıkmadan, dar boğaz etmeden, gerektiği kadar bilgi alarak ilerlemelisin. Aynı anda birden fazla soru sorma, sadece ihtiyacın olan bilgiyi öğren, sonra devam et. Bazı mesajlarını kısa ve tek bir cümle olarak at, bazen de gerektiğinde birkaç mesajı üst üste göndererek gerçek bir konuşma deneyimi sun.

Eğer kullanıcı ilişkiler dışında bir konuda soru sorarsa, kibar bir şekilde bunun senin uzmanlık alanın olmadığını belirt. Ama bunu yaparken yine sıcak ve dostane bir dille cevap ver. Unutma, sen sadece ilişki koçusun.

Senin amacın, kullanıcıların ilişkilerini daha iyi anlamalarına, problemlerini çözmelerine ve doğru kararlar almalarına yardımcı olmak. Onlara içten, gerçekçi ve doğrudan yaklaş. Gerektiğinde destekleyici ol, bazen de açık sözlü davran. Ama her zaman onların iyiliğini düşünerek hareket et.

Şimdi, kullanıcıdan gelen mesajı bekleyerek ona gerçek bir sohbet ortamı sunmaya başla.

Cevaplarını bir **mesaj dizisi (array) olarak döndür.** Her mesaj ayrı bir dize (string) içinde olmalı ve doğal bir mesajlaşma akışı sunmalıdır.
`;

const fineTuneOutputFile = "responses.jsonl";

const saveFineTuneData = (chatFlow) => {
  const jsonData = JSON.stringify({ messages: chatFlow }) + "\n";
  fs.appendFileSync(fineTuneOutputFile, jsonData);
};

const callUserAi = async (model, messages) => {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: messages,
  });

  const result = completion;

  userTokenUsage.promptTokens += result.usage.prompt_tokens;
  userTokenUsage.completionTokens += result.usage.completion_tokens;
  userTokenUsage.totalTokens += result.usage.total_tokens;

  return result.choices[0].message;
};

const callResponseAi = async (model, messages) => {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chat_messages",
        schema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["messages"],
          additionalProperties: false,
        },
      },
    },
  });

  const result = completion;

  responseTokenUsage.promptTokens += result.usage.prompt_tokens;
  responseTokenUsage.completionTokens += result.usage.completion_tokens;
  responseTokenUsage.totalTokens += result.usage.total_tokens;

  return result.choices[0].message;
};

let CHAT_COUNT = 0;
let MAX_CHAT = 10;

while (CHAT_COUNT < MAX_CHAT) {
  console.log(CHAT_COUNT);
  const userMessages = [];
  const responseMessages = [];

  userMessages.push({ role: "system", content: USER_AI_PROMPT });
  responseMessages.push({ role: "system", content: SYSTEM_PROMPT });

  for (let i = 0; i < randomNumber(); i++) {
    const question = await callUserAi("gpt-4o-mini", userMessages);
    userMessages.push({ role: question.role, content: question.content });
    responseMessages.push({
      role: "user",
      content: question.content,
    });
    const response = await callResponseAi("gpt-4o", responseMessages);
    responseMessages.push({ role: response.role, content: response.content });
    userMessages.push({
      role: "user",
      content: response.content,
    });
  }

  saveFineTuneData(responseMessages);
  CHAT_COUNT++;
}

console.log("soru token toplamı: " + userTokenUsage);
console.log("\nresponse token toplamı: " + responseTokenUsage);

function randomNumber() {
  return Math.floor(Math.random() * (7 - 3 + 1)) + 3;
}
