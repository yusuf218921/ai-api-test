import axios from "axios";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

const API_KEY = process.env.API_KEY;
const API_HOST = process.env.DEEPSEEK_API_HOST;
const DEFAULT_PROMPT = process.env.DEFAULT_PROMPT;

const messages = [];
let messageCount = 0;
const MAX_MESSAGES = 5;

const tokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

const callAPI = async (data) => {
  try {
    const response = await axios({
      method: "POST",
      url: "https://deepseek-v31.p.rapidapi.com/",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": API_HOST,
        "Content-Type": "application/json",
      },
      data: data,
    });

    const usage = response.data.usage;
    tokenUsage.promptTokens += usage.prompt_tokens;
    tokenUsage.completionTokens += usage.completion_tokens;
    tokenUsage.totalTokens += usage.total_tokens;

    return response.data;
  } catch (error) {
    console.error("API isteği başarısız:", error.message);
    return null;
  }
};

export const deepSeekV3Test = async (rl) => {
  const askQuestion = async (question) => {
    return (await rl.question(question)).trim();
  };

  let useCustomPrompt = await askQuestion(
    "Kendi system prompt’unuzu girmek ister misiniz? (E/H): "
  );

  let systemPrompt = DEFAULT_PROMPT;
  if (useCustomPrompt.toLowerCase() === "e") {
    systemPrompt = await askQuestion("Lütfen system prompt’unuzu girin: ");
  }

  messages.push({ role: "system", content: systemPrompt });

  console.clear();
  console.log(
    "Chat başlatıldı. Mesajınızı girin (Toplam 5 mesaj hakkınız var):\n"
  );

  while (messageCount < MAX_MESSAGES) {
    let userMessage = await askQuestion("Kullanıcı: ");
    messages.push({ role: "user", content: userMessage });

    let data = { model: "deepseek-v3", messages: messages };
    let apiResponse = await callAPI(data);

    if (!apiResponse) {
      console.log("⚠️ API yanıtı alınamadı, bir hata oluştu.");
      continue;
    }

    const assistantMessages = JSON.parse(
      apiResponse.choices[0].message.content
    );
    for (const msg of assistantMessages) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log(`Anlat Kanka: ${msg}`);
    }

    messages.push(apiResponse.choices[0].message);
    messageCount++;
  }

  console.log("\n===============================");
  console.log("💡 Sohbet tamamlandı. İşte token kullanımı:");
  console.log(`📌 Toplam Prompt Token: ${tokenUsage.promptTokens}`);
  console.log(`📌 Toplam Completion Token: ${tokenUsage.completionTokens}`);
  console.log(`📌 Toplam Token: ${tokenUsage.totalTokens}`);
  console.log("===============================\n");

  console.log("Uygulama kapatılıyor...");
};
