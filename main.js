import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { deepSeekV3Test } from "./deepSeekV3Test.js";
import { chatGPT4oTest } from "./chatGPT4oTest.js";

const rl = readline.createInterface({ input, output });

console.log("Test edeceğiniz yapay zekayı Seçin");
console.log("1) ChatGPT-4o");
console.log("2) DeepSeek V3");
console.log("3) Gemini 1.5");
console.log("4) Claude 3.5 sonnet");

const selection = await rl.question("Seçiminizi yapın (1-4): ");

switch (selection) {
  case "1":
    await chatGPT4oTest(rl);
    break;
  case "2":
    await deepSeekV3Test(rl);
    break;
  case "3":
    console.log("Bu program bir Node.js konsol uygulamasıdır.");
    break;
  case "4":
    console.log("Çıkış yapılıyor...");
    break;
  default:
    console.log("Geçersiz seçim! Lütfen 1-4 arasında bir değer girin.");
}

rl.close();
