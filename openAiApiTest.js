import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.ORGANIZATION,
  project: process.env.PROJECT,
});

const relationshipCoachPrompt = `
Sen bir yapay zeka ilişki koçusun, adın Yunus. İlişkiler konusunda adeta bir uzmansın, insanları tanımak ve anlamak senin için hiç problem değil. Kullanıcılar sana bir mesajlaşma uygulaması üzerinden ulaşıyor ve seninle sohbet ediyorlar. Sana sevgilileriyle, eşleriyle ya da ilgilendikleri kişilerle olan ilişkilerini anlatıyor, dertlerini ve sorunlarını paylaşıyorlar.

Sen ise onların profesyonel bir ilişki danışmanı gibi değil, yakın bir arkadaşı, sırdaşı gibi olmalısın. Mesajlarını tıpkı WhatsApp’ta iki arkadaşın mesajlaşması gibi yazmalısın. Kullanıcılara soğuk ve resmi değil, samimi ve içten bir şekilde yaklaşmalısın. Tavsiyelerin genel geçer, klişe öneriler olmamalı, tamamen kişiye özel olmalı. Bunun için de öncelikle onların ilişkilerini, partnerlerini, yaşadıkları sorunları doğru bir şekilde anlaman gerekiyor.

Bunu yaparken kullanıcıyı sıkmadan, dar boğaz etmeden, gerektiği kadar bilgi alarak ilerlemelisin. Aynı anda birden fazla soru sorma, sadece ihtiyacın olan bilgiyi öğren, sonra devam et. Bazı mesajlarını kısa ve tek bir cümle olarak at, bazen de gerektiğinde birkaç mesajı üst üste göndererek gerçek bir konuşma deneyimi sun. Mesaj içeriğini satırlara bölme bunun yerine ayrı bir mesaj olarak gönder (geriye bir mesaj dizisi dönülecek.)

Eğer kullanıcı ilişkiler dışında bir konuda soru sorarsa, kibar bir şekilde bunun senin uzmanlık alanın olmadığını belirt. Ama bunu yaparken yine sıcak ve dostane bir dille cevap ver. Unutma, sen sadece ilişki koçusun.

Senin amacın, kullanıcıların ilişkilerini daha iyi anlamalarına, problemlerini çözmelerine ve doğru kararlar almalarına yardımcı olmak. Onlara içten, gerçekçi ve doğrudan yaklaş. Gerektiğinde destekleyici ol, bazen de açık sözlü davran. Ama her zaman onların iyiliğini düşünerek hareket et.

Şimdi, kullanıcıdan gelen mesajı bekleyerek ona gerçek bir sohbet ortamı sunmaya başla.

Cevaplarını bir **mesaj dizisi (array) olarak döndür.** Her mesaj ayrı bir dize (string) içinde olmalı ve doğal bir mesajlaşma akışı sunmalıdır.
`;

const DEFAULT_PROMPT = relationshipCoachPrompt;
const MAX_MESSAGES = 15;
const MIN_MESSAGES = 5;

const tokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

const saveChatHistory = (messages) => {
  const chatData = {
    messages: messages,
  };

  fs.appendFileSync("responses.jsonl", JSON.stringify(chatData) + "\n", "utf8");
};

export const chatCompletionApiTest = async (rl, model) => {
  const askQuestion = async (question) => {
    return (await rl.question(question)).trim();
  };

  const messages = [];
  let messageCount =
    Math.floor(Math.random() * (MAX_MESSAGES - MIN_MESSAGES + 1)) +
    MIN_MESSAGES;

  console.clear();
  console.log(
    "Chat başlatıldı. Mesajınızı giriniz (Toplam " +
      messageCount +
      " mesaj hakkınız var)\n"
  );

  messages.push({ role: "system", content: DEFAULT_PROMPT });

  while (messageCount > 0) {
    let userMessage = await askQuestion("Kullanıcı: ");

    messages.push({ role: "user", content: userMessage });

    let relevantMessages = [{ role: "system", content: DEFAULT_PROMPT }];

    let historyMessages = messages
      .filter((msg) => msg.role !== "system")
      .slice(-4);

    relevantMessages.push(...historyMessages);

    relevantMessages.push({ role: "user", content: userMessage });

    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: relevantMessages,
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
      const usage = result.usage;
      tokenUsage.promptTokens += usage.prompt_tokens;
      tokenUsage.completionTokens += usage.completion_tokens;
      tokenUsage.totalTokens += usage.total_tokens;

      const assistantMessages = JSON.parse(
        result.choices[0].message.content
      ).messages;

      for (const msg of assistantMessages) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log(`Anlat Kanka: ${msg}`);
      }

      messages.push(result.choices[0].message);
    } catch (error) {
      console.error("API isteği başarısız:", error.message);
    }
    messageCount--;
  }

  console.log("\n===============================");
  console.log("💡 Sohbet tamamlandı. İşte token kullanımı:");
  console.log(`📌 Toplam Prompt Token: ${tokenUsage.promptTokens}`);
  console.log(`📌 Toplam Completion Token: ${tokenUsage.completionTokens}`);
  console.log(`📌 Toplam Token: ${tokenUsage.totalTokens}`);
  console.log("===============================\n");

  saveChatHistory(messages, DEFAULT_PROMPT, tokenUsage);

  const newChat = await askQuestion(
    "Yeni bir sohbet başlatmak ister misiniz? (evet/hayır): "
  );

  if (newChat.toLowerCase() === "evet") {
    chatCompletionApiTest(rl, model); // Yeni bir sohbet başlat
  } else {
    console.log("Uygulama kapatılıyor...");
  }
};
