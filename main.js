import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";
import { chatCompletionApiTest } from "./openAiApiTest.js";

const rl = readline.createInterface({ input, output });
dotenv.config();

console.log("Test edeceğiniz yapay zekayı Seçin");
console.log("1) ChatGPT-4o");
console.log("2) ChatGPT-4o mini");

const selection = await rl.question("Seçiminizi yapın (1-2): ");

switch (selection) {
  case "1":
    await chatCompletionApiTest(rl, "gpt-4o");
    break;
  case "2":
    await chatCompletionApiTest(rl, "gpt-4o-mini");
    break;
  default:
    console.log("Geçersiz seçim! Lütfen 1-5 arasında bir değer girin.");
}

rl.close();
