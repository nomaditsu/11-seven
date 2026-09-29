// Conversations with the people in the store. English first, then romanised Thai, then Thai script.
// A node is { say, choices?, give?, end? }. `give` (once per save) is one of:
//   { discover: skuId }  adds a product to the Snack Book      { cash: n }  a few baht      { ach: id }  an achievement
// A choice is { t: text, to: nodeId | null (leave) }.
const T = (en, th, rom) => ({ en, th, rom });

const THANKS = T('Thanks!', 'ขอบคุณ!', 'kɔ̀ɔp-kun');
const ASK = T('Ask something else', 'ถามเรื่องอื่น', 'tǎam rʉ̂ang ʉ̀ʉn');
const BYE = T('Goodbye', 'ลาก่อน', 'laa-gɔ̀ɔn');
const c = (t, to) => ({ t, to });
const leave = (node = 'bye') => c(THANKS, node);
const again = (node = 'hello') => c(ASK, node);

export const PEOPLE = {
  cashier: {
    name: T('Khun Fon', 'คุณฝน', 'kun fǒn'), role: T('Cashier', 'แคชเชียร์', 'kɛ́ɛt-chia'), face: 'cashier', voice: { p: 1.25, r: 1.0 }, start: 'hello', canPay: true,
    nodes: {
      hello: { say: T('Sawasdee kha! Welcome to 11 SEVEN. Anything I can help with?', 'สวัสดีค่ะ ยินดีต้อนรับสู่อีเลฟเว่น เซเว่นค่ะ มีอะไรให้ช่วยไหมคะ', 'sà-wàt-dii kâ, yin-dii dtɔ̂ɔn-ráp sùu ii-lép-wên sé-wên kâ, mii à-rai hâi chûai mǎi ká'),
        choices: [c(T('What is popular tonight?', 'คืนนี้อะไรขายดี', 'kʉʉn-níi à-rai kǎai dii'), 'pop'), c(T('Where is the hot food?', 'ของร้อนอยู่ตรงไหน', 'kɔ̌ɔng rɔ́ɔn yùu dtrong nǎi'), 'hot'), c(T('Any tips for a visitor?', 'มีเคล็ดลับสำหรับนักท่องเที่ยวไหม', 'mii klét-láp sǎm-ràp nák-tɔ̂ng-tîao mǎi'), 'tips')] },
      pop: { say: T('Crispy seaweed for the tourists, teriyaki toasties for everyone else. Try both!', 'สาหร่ายทอดกรอบสำหรับนักท่องเที่ยว ส่วนแซนด์วิชเทอริยากิสำหรับทุกคนค่ะ ลองทั้งสองอย่างเลยนะคะ', 'sǎa-rài tɔ̂ɔt-grɔ̀ɔp sǎm-ràp nák-tɔ̂ng-tîao, sùan sɛɛn-wít təə-rí-yaa-gì sǎm-ràp túk kon kâ, lɔɔng tháng sɔ̌ɔng yàang ləəi ná ká'),
        give: { discover: 'oni-seaweed' }, choices: [leave(), again()] },
      hot: { say: T('By the counter. The pork skewers with sticky rice are the best. Careful, it is hot!', 'ตรงเคาน์เตอร์ค่ะ หมูปิ้งข้าวเหนียวอร่อยที่สุด ระวังร้อนนะคะ', 'dtrong kao-dtə̂ə kâ, mǔu-bpîng kâao-nǐao à-rɔ̀i tîi-sùt, rá-wang rɔ́ɔn ná ká'),
        give: { discover: 'meal-pork-skewers-sticky-rice' }, choices: [leave(), again()] },
      tips: { say: T('Say yes when I ask if you want it heated. Bags cost a few baht, so bring your own if you can.', 'ถ้าฉันถามว่าอุ่นไหม ตอบว่าใช่ได้เลยค่ะ ส่วนถุงต้องเสียเงิน ถ้ามีถุงผ้าก็เอามานะคะ', 'tâa chǎn tǎam wâa ùn mǎi, dtɔ̀ɔp wâa châi dâai ləəi kâ, sùan tǔng dtɔ̂ng sǐa ngən, tâa mii tǔng pâa gɔ̂ɔ ao maa ná ká'), choices: [leave(), again()] },
      bye: { say: T('Come again, kha!', 'ไว้มาอีกนะคะ', 'wái maa ìik ná ká'), end: true },
    },
  },
  cashier2: {
    name: T('Khun Tan', 'คุณตั้น', 'kun dtân'), role: T('Hot food counter', 'เคาน์เตอร์ของร้อน', 'kao-dtə̂ə kɔ̌ɔng rɔ́ɔn'), face: 'cashier2', voice: { p: 0.85, r: 1.0 }, start: 'hello',
    nodes: {
      hello: { say: T('Hot food is fresh out of the warmer. Hungry?', 'ของร้อนเพิ่งออกจากตู้อุ่นครับ หิวไหมครับ', 'kɔ̌ɔng rɔ́ɔn pə̂ng ɔ̀ɔk jàak dtûu ùn kráp, hǐu mǎi kráp'),
        choices: [c(T('What do you recommend?', 'แนะนำอะไรดี', 'nɛ́-nam à-rai dii'), 'rec'), c(T('Just browsing', 'ดูเฉยๆ', 'duu chə̌əi-chə̌əi'), 'bye')] },
      rec: { say: T('The spicy basil pork rice. Ask for a fried egg on top, then heat it in the microwave for one minute.', 'ข้าวกะเพราหมู ขอไข่ดาวด้วย แล้วอุ่นไมโครเวฟหนึ่งนาทีครับ', 'kâao gà-prao mǔu, kɔ̌ɔ kài-daao dûai, lɛ́ɛo ùn mai-kroo-wéef nʉ̀ng naa-tii kráp'),
        give: { discover: 'meal-kaprao-pork' }, choices: [leave(), again()] },
      bye: { say: T('Enjoy your meal!', 'ทานให้อร่อยนะครับ', 'taan hâi à-rɔ̀i ná kráp'), end: true },
    },
  },
  student: {
    name: T('Ploy', 'พลอย', 'ploi'), role: T('Student', 'นักเรียน', 'nák-riian'), face: 'student', voice: { p: 1.45, r: 1.08 }, start: 'hello',
    nodes: {
      hello: { say: T('Ugh, exam tomorrow. I need something cold and sweet. Any ideas?', 'โอ๊ย พรุ่งนี้สอบ ต้องการของเย็นๆ หวานๆ มีไอเดียไหม', 'óoi, prûng-níi sɔ̀ɔp, dtɔ̂ng-gaan kɔ̌ɔng yen-yen wǎan-wǎan, mii ai-dia mǎi'),
        choices: [c(T('Try the Thai milk tea', 'ลองชานมไทยสิ', 'lɔɔng chaa-nom tai sì'), 'tea'), c(T('Good luck!', 'โชคดีนะ', 'chôok-dii ná'), 'bye')] },
      tea: { say: T('Cold Thai tea from the fridge, right? Thanks! Here is a tip: the 11 Café machine makes it fresh.', 'ชาไทยเย็นในตู้แช่ใช่ไหม ขอบคุณ! บอกให้นะ เครื่องอีเลฟเว่น คาเฟ่ชงสดด้วย', 'chaa-tai yen nai dtûu-chɛ̂ɛ châi mǎi, kɔ̀ɔp-kun! bɔ̀ɔk hâi ná, krʉ̂ang ii-lép-wên kaa-fê chong sòt dûai'),
        give: { discover: 'chatramue-thaitea' }, choices: [leave()] },
      bye: { say: T('You are the best. See you!', 'ใจดีที่สุดเลย แล้วเจอกัน', 'jai-dii tîi-sùt ləəi, lɛ́ɛo jəə gan'), end: true },
    },
  },
  office: {
    name: T('Khun Anon', 'คุณอนนท์', 'kun à-non'), role: T('Office worker', 'พนักงานออฟฟิศ', 'pá-nák-ngaan ɔ́p-fít'), face: 'office', voice: { p: 0.8, r: 1.0 }, start: 'hello',
    nodes: {
      hello: { say: T('Late meeting again. Coffee, a snack, then back to my desk.', 'ประชุมดึกอีกแล้ว กาแฟ ขนม แล้วกลับไปทำงาน', 'bprà-chum dùek ìik lɛ́ɛo, gaa-fɛɛ, kà-nǒm, lɛ́ɛo glàp bpai tam-ngaan'),
        choices: [c(T('Which coffee is good?', 'กาแฟตัวไหนดี', 'gaa-fɛɛ dtua nǎi dii'), 'coffee'), c(T('Do not work too hard', 'อย่าทำงานหนักเกินไปนะ', 'yàa tam-ngaan nàk gəən bpai ná'), 'bye')] },
      coffee: { say: T('The 11 Café iced Thai coffee bottle. Strong, sweet, and it survives the walk back.', 'กาแฟไทยเย็นอีเลฟเว่น คาเฟ่แบบขวด เข้มหวาน แถมถือเดินกลับออฟฟิศได้', 'gaa-fɛɛ tai yen ii-lép-wên kaa-fê bɛ̀ɛp kùat, kêm wǎan, tɛ̌ɛm mʉ̌ʉ dəən glàp ɔ́p-fít dâai'),
        give: { discover: 'allcafe-thaiicedcoffee' }, choices: [leave()] },
      bye: { say: T('Thanks. Time to face the inbox.', 'ขอบคุณ ไปสู้กับอีเมลต่อ', 'kɔ̀ɔp-kun, bpai sûu gàp ii-meen dtɔ̀ɔ'), end: true },
    },
  },
  tourist: {
    name: T('Alex', 'อเล็กซ์', 'à-lék'), role: T('Visitor', 'นักท่องเที่ยว', 'nák-tɔ̂ng-tîao'), face: 'tourist', voice: { p: 1.0, r: 1.0 }, start: 'hello',
    nodes: {
      hello: { say: T('Hi! First time in Thailand. What should I take home as a souvenir?', 'สวัสดี! มาไทยครั้งแรก ควรซื้ออะไรกลับบ้านเป็นของฝากดี', 'sà-wàt-dii! maa tai kráng-rɛ̂ɛk, kuan sʉ́ʉ à-rai glàp bâan bpen kɔ̌ɔng-fàak dii'),
        choices: [c(T('Crispy seaweed', 'สาหร่ายทอดกรอบ', 'sǎa-rài tɔ̂ɔt-grɔ̀ɔp'), 'sea'), c(T('Tiger Balm', 'ยาหม่องเสือ', 'yaa-mɔ̀ɔng sʉ̌a'), 'balm'), c(T('Just enjoy the trip!', 'สนุกกับการเที่ยวนะ', 'sà-nùk gàp gaan-tîao ná'), 'bye')] },
      sea: { say: T('Sold! I love crunchy things. Here, twenty baht for the tip.', 'ตกลง! ชอบของกรุบกรอบอยู่แล้ว นี่ ยี่สิบบาทเป็นค่าแนะนำ', 'dtòk-long! chɔ̂ɔp kɔ̌ɔng grùp-grɔ̀ɔp yùu lɛ́ɛo, nîi, yîi-sìp bàat bpen kâa nɛ́-nam'),
        give: { cash: 20 }, choices: [leave(), again()] },
      balm: { say: T('Ooh, the red one? My mum will love it. Thank you!', 'ตลับแดงเหรอ แม่ต้องชอบแน่ ขอบคุณนะ', 'dtà-làp dɛɛng rə̌ə? mɛ̂ɛ dtɔ̂ng chɔ̂ɔp nɛ̂ɛ, kɔ̀ɔp-kun ná'),
        give: { discover: 'tiger-balm-red' }, choices: [leave(), again()] },
      bye: { say: T('See you around!', 'แล้วเจอกันนะ', 'lɛ́ɛo jəə gan ná'), end: true },
    },
  },
  auntie: {
    name: T('Pa Noi', 'ป้าน้อย', 'bpâa nɔ́ɔi'), role: T('Auntie', 'คุณป้า', 'kun-bpâa'), face: 'auntie', voice: { p: 0.9, r: 0.88 }, start: 'hello',
    nodes: {
      hello: { say: T('Ooh, young one. Which noodle is not too spicy?', 'เอ้า หนู บะหมี่อันไหนไม่เผ็ดมากนะ', 'âo, nǔu, bà-mìi an nǎi mâi pèt mâak ná'),
        choices: [c(T('The creamy one is mild', 'ตัวครีมี่ไม่เผ็ดมากนะ', 'dtua khrii-mîi mâi pèt mâak ná'), 'mild'), c(T('Sorry, I am new here', 'ขอโทษ เพิ่งมาครั้งแรก', 'kɔ̌ɔ-tôot, pə̂ng maa kráng-rɛ̂ɛk'), 'bye')] },
      mild: { say: T('Good, good. You have a kind face. Take a sweet from my bag.', 'ดีๆ หน้าตาใจดีนะ เอาลูกอมในกระเป๋าไปกินสิ', 'dii-dii, nâa-dtaa jai-dii ná, ao lûuk-om nai grà-bpǎo bpai gin sì'),
        give: { discover: 'hichew-mango' }, choices: [c(T('Thank you, Auntie', 'ขอบคุณค่ะคุณป้า', 'kɔ̀ɔp-kun kâ kun-bpâa'), 'bye')] },
      bye: { say: T('Take care, dear.', 'ดูแลตัวเองนะจ๊ะ', 'duu-lɛɛ dtua-eeng ná já'), end: true },
    },
  },
  monk: {
    name: T('Luang Phi', 'หลวงพี่', 'lǔang pîi'), role: T('Monk', 'พระ', 'prá'), face: 'monk', voice: { p: 0.55, r: 0.78 }, start: 'hello',
    nodes: {
      hello: { say: T('Blessings on your night. Do not rush. The city will still be here.', 'ขอให้โชคดีในค่ำคืนนี้ ไม่ต้องรีบ เมืองยังอยู่ตรงนี้', 'kɔ̌ɔ hâi chôok-dii nai kâm-kʉʉn níi, mâi dtɔ̂ng rîip, mʉang yang yùu dtrong níi'),
        choices: [c(T('Any advice?', 'มีคำแนะนำไหมครับ', 'mii kam-nɛ́-nam mǎi kráp'), 'adv'), c(T('Wishing you well', 'ขอให้สุขสบายนะครับ', 'kɔ̌ɔ hâi sùk-sà-baai ná kráp'), 'bye')] },
      adv: { say: T('Buy something to share, and eat it slowly.', 'ซื้ออะไรไปแบ่งกันกิน แล้วกินช้าๆ', 'sʉ́ʉ à-rai bpai bɛ̀ng gan gin, lɛ́ɛo gin cháa-cháa'), choices: [c(T('Thank you', 'ขอบคุณครับ', 'kɔ̀ɔp-kun kráp'), 'bye')] },
      bye: { say: T('May you be well.', 'ขอให้สุขสบาย', 'kɔ̌ɔ hâi sùk-sà-baai'), end: true },
    },
  },
  rider: {
    name: T('Phi Chai', 'พี่ชัย', 'pîi chai'), role: T('Motorbike taxi', 'วินมอเตอร์ไซค์', 'win mɔɔ-dtəə-sai'), face: 'rider', voice: { p: 0.9, r: 1.05 }, start: 'hello',
    nodes: {
      hello: { say: T('Need a ride? Ten baht to the corner, twenty to the BTS. Or grab a cold drink first.', 'ไปไหมครับ หัวซอยสิบบาท ไปบีทีเอสยี่สิบ หรือซื้อของเย็นๆ ก่อนก็ได้', 'bpai mǎi kráp? hǔa-sɔɔi sìp bàat, bpai bii-tii-ét yîi-sìp, rʉ̌ʉ sʉ́ʉ kɔ̌ɔng yen-yen gɔ̀ɔn gɔ̂ɔ dâai'),
        choices: [c(T('What do riders drink?', 'พี่ดื่มอะไรตอนขับรถ', 'pîi dʉ̀ʉm à-rai dtɔɔn kàp rót'), 'drink'), c(T('No thanks, I will walk', 'ไม่เป็นไร เดินเอง', 'mâi bpen rai, dəən eeng'), 'bye')] },
      drink: { say: T('Cold sports drink. Sweat all day. Cheap and it works.', 'เครื่องดื่มเกลือแร่เย็นๆ เหงื่อออกทั้งวัน ถูกและได้ผล', 'krʉ̂ang-dʉ̀ʉm glʉa-rɛ̂ɛ yen-yen, ngʉ̀ʉa ɔ̀ɔk tháng wan, tùuk lɛ́ dâai pǒn'),
        give: { discover: 'pocari-500' }, choices: [leave(), again()] },
      bye: { say: T('Be safe!', 'ปลอดภัยนะครับ', 'bplɔ̀ɔt-pai ná kráp'), end: true },
    },
  },
  shopper: {
    name: T('Khun Tum', 'คุณต้ม', 'kun dtôm'), role: T('Shopper', 'ลูกค้า', 'lûuk-káa'), face: 'shopper', voice: { p: 1.0, r: 1.0 }, start: 'hello',
    nodes: {
      hello: { say: T('Do you know where the ice cream is? It is 35 degrees outside.', 'ไอศกรีมอยู่ตรงไหนรู้ไหม ข้างนอกร้อนตั้งสามสิบห้าองศา', 'ai-sà-griim yùu dtrong nǎi rúu mǎi, kâang-nɔ̂ɔk rɔ́ɔn dtâng sǎam-sìp-hâa ong-sǎa'),
        choices: [c(T('At the back, by the freezers', 'ข้างหลัง ตรงตู้แช่แข็ง', 'kâang-lǎng, dtrong dtûu-chɛ̂ɛ-kɛ̌ng'), 'ice'), c(T('Stay cool!', 'รักษาความเย็นนะ', 'rák-sǎa kwaam-yen ná'), 'bye')] },
      ice: { say: T('Perfect. Thai tea flavour, I hope. Thanks!', 'เยี่ยมเลย ขอรสชาไทยนะ ขอบคุณ!', 'yîam ləəi, kɔ̌ɔ rót chaa-tai ná, kɔ̀ɔp-kun'), give: { discover: 'swensens-thai-tea-pint' }, choices: [leave()] },
      bye: { say: T('Bye!', 'ไว้เจอกัน!', 'wái jəə gan'), end: true },
    },
  },
  ning: {
    name: T('Khun Ning', 'คุณหนิง', 'kun nǐng'), role: T('Regular', 'ขาประจำ', 'kǎa-bprà-jam'), face: 'office', voice: { p: 1.15, r: 1.0 }, start: 'hello',
    nodes: {
      hello: { say: T('I come here every night after work. The air-con is the best part.', 'มาที่นี่ทุกคืนหลังเลิกงาน แอร์เย็นสบายที่สุด', 'maa tîi-nîi túk kʉʉn lǎng lə̂ək-ngaan, ɛɛ yen sà-baai tîi-sùt'),
        choices: [c(T('What do you always buy?', 'ซื้ออะไรเป็นประจำ', 'sʉ́ʉ à-rai bpen bprà-jam'), 'fav'), c(T('Same here!', 'เหมือนกันเลย', 'mʉ̌an gan ləəi'), 'bye')] },
      fav: { say: T('A mango sticky rice cup and a cold water. Every night.', 'ข้าวเหนียวมะม่วงถ้วยหนึ่งกับน้ำเย็นๆ ทุกคืน', 'kâao-nǐao má-mûang tûai nʉ̀ng gàp náam yen-yen túk kʉʉn'), give: { discover: 'ss-mango-sticky-rice' }, choices: [leave()] },
      bye: { say: T('See you tomorrow night!', 'เจอกันพรุ่งนี้ตอนกลางคืนนะ', 'jəə gan prûng-níi dtɔɔn glaang-kʉʉn ná'), end: true },
    },
  },
  dog: {
    name: T('Lek', 'เล็ก', 'lék'), role: T('Soi dog', 'หมาซอย', 'mǎa sɔɔi'), face: 'dog', voice: null, start: 'hello',
    nodes: {
      hello: { say: T('*wags tail slowly, then goes back to sleep*', '*กระดิกหางช้าๆ แล้วหลับต่อ*', '*grà-dìk hǎang cháa-cháa, lɛ́ɛo làp dtɔ̀ɔ*'),
        choices: [c(T('Pet the dog', 'ลูบหัวหมา', 'lûup hǔa mǎa'), 'pet'), c(T('Let him sleep', 'ปล่อยให้นอน', 'bplɔ̀i hâi nɔɔn'), 'bye')] },
      pet: { say: T('Woof. (he leans into your hand)', 'โฮ่ง (มันเอนตัวเข้าหามือคุณ)', 'hôong (man eeng dtua kâo hǎa mʉʉ kun)'), give: { ach: 'dog' }, effect: 'dog', choices: [c(T('Good boy', 'เด็กดี', 'dèk-dii'), 'bye')] },
      bye: { say: T('*happy huff*', '*ฮึดฮัดอย่างมีความสุข*', '*hʉ́t-hát yàang mii kwaam-sùk*'), end: true },
    },
  },
};
export const PEOPLE_COUNT = Object.keys(PEOPLE).length;
