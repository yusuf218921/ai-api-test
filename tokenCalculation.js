import { encoding_for_model } from "@dqbd/tiktoken";

async function hesaplaTokenSayisi(metin) {
  const encoder = encoding_for_model("gpt-4"); // GPT-4 token hesaplayıcıyı kullan
  const tokenler = encoder.encode(metin);
  return tokenler.length;
}

const metin = `
Bir ilişki koçu AI uygulamasında bir kullanıcı gibi davran. Sevgilisi veya ilişkisiyle ilgili bir sorunu olan biri gibi mesaj at ve bir soru sor. Aldığın yanıtı bekle, ardından o yanıta uygun olarak sohbeti devam ettir. Konuşma boyunca gerçek bir kullanıcı gibi hissettirmeye çalış. Duygularını ifade edebilir, endişelerini dile getirebilir ve detaylı açıklamalar yapabilirsin.

Örnek mesajlar:

"Merhaba, erkek arkadaşım son zamanlarda çok mesafeli davranıyor. Ona bir şey olup olmadığını sorduğumda 'bir şey yok' diyor ama hissedebiliyorum. Onu sıkmadan nasıl yaklaşabilirim?"
"Sevgilimle 3 yıldır beraberiz ama bazen onun bana olan ilgisinin azaldığını hissediyorum. Bunun geçici bir şey mi olduğunu nasıl anlayabilirim?"
"İlişkimizde bazı güvensizlikler yaşıyorum, geçmişte aldatıldım ve bazen bunu yeni ilişkimde de hissediyorum. Bunu nasıl aşabilirim?"
Kendi yazdığın mesaja asla yanıt verme. Sana gelen yanıtlara göre konuşmayı devam ettir. Amaç, doğal ve akıcı bir sohbet akışı oluşturmak.
`; // Buraya hesaplanacak metni gir

hesaplaTokenSayisi(metin).then((tokenSayisi) => {
  console.log(`Token Sayısı: ${tokenSayisi}`);
});
