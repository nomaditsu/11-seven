// Shopping-list missions (RPG side quests). A goal is satisfied by buying any SKU matching cats/ids.
const T = (en, th) => ({ en, th });
export const QUESTS = [
  {
    id: 'midnight', reward: 20,
    title: T('Midnight snack run', 'ออกไปซื้อของกินดึกๆ'),
    desc: T('It is late and your stomach is growling. Grab the classic Bangkok late-night combo.', 'ดึกแล้วท้องร้อง คว้าชุดของกินดึกสุดคลาสสิกของคนกรุงเทพฯ'),
    goals: [
      { cats: ['noodle', 'cupnoodle'], label: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป') },
      { cats: ['chips', 'seaweed', 'nuts'], label: T('A crunchy snack', 'ขนมกรุบกรอบ') },
      { cats: ['soda', 'tea', 'water', 'juice', 'energy', 'sport'], label: T('Something to drink', 'เครื่องดื่ม') },
    ],
  },
  {
    id: 'breakfast', reward: 20,
    title: T('Bangkok breakfast', 'อาหารเช้าสไตล์กรุงเทพฯ'),
    desc: T('Commuters keep it quick: something hot, something milky, something baked.', 'คนกรุงเทพฯ กินเช้าแบบเร็วๆ ของร้อน ของนม และของอบ'),
    goals: [
      { cats: ['hot', 'meal'], label: T('A hot bite (bun, skewer, meal)', 'ของร้อนๆ (ซาลาเปา หมูปิ้ง ข้าวกล่อง)') },
      { cats: ['dairy', 'coffee', 'tea'], label: T('Milk, coffee or tea', 'นม กาแฟ หรือชา') },
      { cats: ['bakery', 'sandwich'], label: T('Bread or a sandwich', 'ขนมปังหรือแซนวิช') },
    ],
  },
  {
    id: 'souvenir', reward: 30,
    title: T('Souvenirs for home', 'ของฝากกลับบ้าน'),
    desc: T('Visitors love the uniquely Thai stuff at the 11 SEVEN. Fill your bag with local favourites.', 'นักท่องเที่ยวชอบของไทยๆ ที่อีเลฟเว่น เซเว่น ช้อปของเด็ดกลับบ้านกัน'),
    goals: [
      { cats: ['seaweed'], label: T('Crispy seaweed', 'สาหร่ายทอดกรอบ') },
      { cats: ['health'], label: T('An inhaler or balm', 'ยาดมหรือยาหม่อง') },
      { cats: ['nuts', 'chips'], label: T('A Thai-flavoured snack', 'ขนมรสไทยๆ') },
      { cats: ['tea', 'energy'], label: T('A Thai drink', 'เครื่องดื่มไทยๆ') },
    ],
  },
  {
    id: 'heat', reward: 15,
    title: T('Beat the heat', 'คลายร้อนกลางเมือง'),
    desc: T('Bangkok is 35 °C. Cool down properly.', 'กรุงเทพฯ ร้อน 35 องศา ต้องคลายร้อนให้สุด'),
    goals: [
      { cats: ['water', 'sport'], label: T('Cold water or sports drink', 'น้ำเย็นๆ หรือเกลือแร่') },
      { cats: ['icecream'], label: T('Ice cream', 'ไอศกรีม') },
      { cats: ['dessert', 'juice'], label: T('Fruit or juice', 'ผลไม้หรือน้ำผลไม้') },
    ],
  },
  {
    id: 'lunch', reward: 25,
    title: T('Proper lunch, microwaved', 'มื้อกลางวัน อุ่นให้ร้อน'),
    desc: T('A ready meal, a drink, and dessert — and say yes when the cashier asks “อุ่นไหมคะ?”.', 'ข้าวกล่อง เครื่องดื่ม ของหวาน และตอบรับเมื่อแคชเชียร์ถามว่า “อุ่นไหมคะ?”'),
    goals: [
      { cats: ['meal'], label: T('A ready meal', 'อาหารพร้อมทาน') },
      { cats: ['soda', 'tea', 'juice', 'water', 'dairy'], label: T('A drink', 'เครื่องดื่ม') },
      { cats: ['dessert', 'icecream', 'bakery'], label: T('Something sweet', 'ของหวาน') },
    ],
  },
];
