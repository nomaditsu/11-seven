// Bilingual ingredient / allergen dictionary used for the back-of-pack text.
// Short keys keep the SKU database compact.
const I = (en, th) => ({ en, th });
export const ING = {
  water: I('Water', 'น้ำ'), sugar: I('Sugar', 'น้ำตาลทราย'), salt: I('Salt', 'เกลือ'), oil: I('Vegetable oil', 'น้ำมันพืช'),
  palm: I('Palm oil', 'น้ำมันปาล์ม'), potato: I('Potato', 'มันฝรั่ง'), wheat: I('Wheat flour', 'แป้งสาลี'), rice: I('Rice', 'ข้าว'),
  ricef: I('Rice flour', 'แป้งข้าวเจ้า'), tapioca: I('Tapioca starch', 'แป้งมันสำปะหลัง'), corn: I('Corn', 'ข้าวโพด'), cornst: I('Corn starch', 'แป้งข้าวโพด'),
  soy: I('Soybean', 'ถั่วเหลือง'), soysauce: I('Soy sauce', 'ซีอิ๊วขาว'), egg: I('Egg', 'ไข่'), eggyolk: I('Salted egg yolk', 'ไข่แดงเค็ม'),
  milk: I('Milk', 'นม'), milkp: I('Milk powder', 'นมผง'), cream: I('Cream', 'ครีม'), cheese: I('Cheese', 'ชีส'), butter: I('Butter', 'เนย'),
  cocoa: I('Cocoa', 'โกโก้'), choc: I('Chocolate', 'ช็อกโกแลต'), vanilla: I('Vanilla flavour', 'กลิ่นวานิลลา'), yeast: I('Yeast', 'ยีสต์'),
  msg: I('Flavour enhancer (MSG)', 'ผงชูรส'), garlic: I('Garlic', 'กระเทียม'), onion: I('Onion', 'หอมหัวใหญ่'), chili: I('Chilli', 'พริก'),
  lemongrass: I('Lemongrass', 'ตะไคร้'), galangal: I('Galangal', 'ข่า'), kaffir: I('Kaffir lime leaf', 'ใบมะกรูด'), lime: I('Lime', 'มะนาว'),
  tamarind: I('Tamarind', 'มะขาม'), fishsauce: I('Fish sauce', 'น้ำปลา'), shrimp: I('Shrimp', 'กุ้ง'), shrimppaste: I('Shrimp paste', 'กะปิ'),
  squid: I('Squid', 'ปลาหมึก'), fish: I('Fish', 'ปลา'), pork: I('Pork', 'หมู'), porkfloss: I('Pork floss', 'หมูหยอง'), chicken: I('Chicken', 'ไก่'), beef: I('Beef', 'เนื้อวัว'),
  basil: I('Holy basil', 'กะเพรา'), seaweed: I('Seaweed', 'สาหร่าย'), sesame: I('Sesame', 'งา'), peanut: I('Peanut', 'ถั่วลิสง'),
  almond: I('Almond', 'อัลมอนด์'), cashew: I('Cashew nut', 'เม็ดมะม่วงหิมพานต์'), coconutmilk: I('Coconut milk', 'กะทิ'), coconut: I('Coconut', 'มะพร้าว'),
  mango: I('Mango', 'มะม่วง'), pandan: I('Pandan', 'ใบเตย'), taro: I('Taro', 'เผือก'), pumpkin: I('Pumpkin', 'ฟักทอง'), honey: I('Honey', 'น้ำผึ้ง'),
  lemon: I('Lemon', 'มะนาวเหลือง'), orange: I('Orange juice', 'น้ำส้ม'), apple: I('Apple', 'แอปเปิล'), grape: I('Grape', 'องุ่น'),
  strawberry: I('Strawberry', 'สตรอว์เบอร์รี'), lychee: I('Lychee', 'ลิ้นจี่'), pineapple: I('Pineapple', 'สับปะรด'), watermelon: I('Watermelon', 'แตงโม'),
  papaya: I('Green papaya', 'มะละกอดิบ'), tomato: I('Tomato', 'มะเขือเทศ'), carrot: I('Carrot', 'แครอท'), cabbage: I('Cabbage', 'กะหล่ำปลี'), veg: I('Vegetables', 'ผัก'),
  greentea: I('Green tea', 'ชาเขียว'), tea: I('Tea', 'ชา'), thaitea: I('Thai tea', 'ชาไทย'), coffee: I('Coffee', 'กาแฟ'), caffeine: I('Caffeine', 'คาเฟอีน'),
  taurine: I('Taurine', 'ทอรีน'), inositol: I('Inositol', 'อิโนซิทอล'), vitb: I('Vitamins B', 'วิตามินบี'), vitc: I('Vitamin C', 'วิตามินซี'),
  citric: I('Citric acid', 'กรดซิตริก'), preserv: I('Preservative', 'สารกันเสีย'), sweet: I('Sweetener', 'สารให้ความหวาน'), colour: I('Colour', 'สี'),
  flavour: I('Flavouring', 'แต่งกลิ่นรส'), emuls: I('Emulsifier', 'สารอิมัลซิไฟเออร์'), stab: I('Stabiliser', 'สารให้ความคงตัว'), gelatin: I('Gelatin', 'เจลาติน'),
  pectin: I('Pectin', 'เพกติน'), co2: I('Carbon dioxide', 'คาร์บอนไดออกไซด์'), caramel: I('Caramel colour', 'สีคาราเมล'), malt: I('Malt', 'มอลต์'),
  barley: I('Barley', 'ข้าวบาร์เลย์'), hops: I('Hops', 'ฮอปส์'), mint: I('Mint', 'สะระแหน่'), menthol: I('Menthol', 'เมนทอล'), camphor: I('Camphor', 'การบูร'),
  eucalyptus: I('Eucalyptus oil', 'น้ำมันยูคาลิปตัส'), oats: I('Oats', 'ข้าวโอ๊ต'), starch: I('Modified starch', 'แป้งดัดแปร'), yogurt: I('Yoghurt culture', 'เชื้อโยเกิร์ต'),
  whey: I('Whey protein', 'เวย์โปรตีน'), leaven: I('Raising agent', 'ผงฟู'), spice: I('Spices', 'เครื่องเทศ'), curry: I('Curry paste', 'พริกแกง'),
  tomyum: I('Tom yum seasoning', 'เครื่องปรุงรสต้มยำ'), nori: I('Nori seasoning', 'ผงปรุงรสสาหร่าย'), cheeseseason: I('Cheese seasoning', 'ผงปรุงรสชีส'),
  bbq: I('BBQ seasoning', 'ผงปรุงรสบาร์บีคิว'), sourcream: I('Sour cream & onion seasoning', 'ผงปรุงรสซาวครีมหัวหอม'), brine: I('Brine', 'น้ำเกลือ'),
  oliveoil: I('Olive oil', 'น้ำมันมะกอก'), mayo: I('Mayonnaise', 'มายองเนส'), ham: I('Ham', 'แฮม'), tuna: I('Tuna', 'ปลาทูน่า'), sausage: I('Sausage', 'ไส้กรอก'),
  bread: I('Bread', 'ขนมปัง'), vitamins: I('Vitamins & minerals', 'วิตามินและแร่ธาตุ'), electrolyte: I('Electrolytes', 'เกลือแร่'), alcohol: I('Ethanol', 'เอทานอล'),
  neutral: I('Neutral spirit', 'สุรากลั่น'), molasses: I('Molasses', 'กากน้ำตาล'), ginseng: I('Ginseng extract', 'สารสกัดโสม'), aloe: I('Aloe vera', 'ว่านหางจระเข้'),
  chrysanthemum: I('Chrysanthemum', 'ดอกเก๊กฮวย'), longan: I('Longan', 'ลำไย'), jelly: I('Konjac jelly', 'วุ้นบุก'), sticky: I('Glutinous rice', 'ข้าวเหนียว'),
  starchsyrup: I('Glucose syrup', 'น้ำเชื่อมกลูโคส'), fructose: I('Fructose syrup', 'น้ำเชื่อมฟรุกโตส'), sodiumb: I('Sodium bicarbonate', 'โซเดียมไบคาร์บอเนต'),
  surfactant: I('Surfactants', 'สารลดแรงตึงผิว'), fluoride: I('Fluoride', 'ฟลูออไรด์'), silica: I('Silica', 'ซิลิกา'), glycerin: I('Glycerin', 'กลีเซอรีน'),
  perfume: I('Fragrance', 'น้ำหอม'), zinc: I('Zinc pyrithione', 'ซิงก์ไพริไธโอน'), paraffin: I('Paraffin', 'พาราฟิน'), petro: I('Petroleum jelly', 'ปิโตรเลียมเจลลี'),
  paracetamol: I('Paracetamol 500 mg', 'พาราเซตามอล 500 มก.'), cotton: I('Cotton', 'ฝ้าย'), pulp: I('Virgin pulp', 'เยื่อกระดาษบริสุทธิ์'),
  bleach: I('Sodium hypochlorite', 'โซเดียมไฮโปคลอไรต์'), enzyme: I('Enzymes', 'เอนไซม์'), zincox: I('Zinc oxide', 'ซิงค์ออกไซด์'), talc: I('Talc', 'ทัลคัม'),
};
export const ALLERGEN = {
  wheat: { en: 'wheat / gluten', th: 'ข้าวสาลี/กลูเตน' }, milk: { en: 'milk', th: 'นม' }, egg: { en: 'egg', th: 'ไข่' }, soy: { en: 'soy', th: 'ถั่วเหลือง' },
  peanut: { en: 'peanut', th: 'ถั่วลิสง' }, nuts: { en: 'tree nuts', th: 'ถั่วเปลือกแข็ง' }, shrimp: { en: 'shrimp / crustacean', th: 'กุ้ง/สัตว์น้ำมีเปลือก' },
  fish: { en: 'fish', th: 'ปลา' }, squid: { en: 'mollusc (squid)', th: 'หอย/หมึก' }, sesame: { en: 'sesame', th: 'งา' }, sulphite: { en: 'sulphites', th: 'ซัลไฟต์' },
};
export function ingredientText(keys, code) {
  return keys.map((k) => (ING[k] ? ING[k][code] : k)).join(code === 'th' ? ' ' : ', ').replace(/^./, (c) => c);
}
export function allergenText(keys, code) {
  return keys.map((k) => (ALLERGEN[k] ? ALLERGEN[k][code] : k)).join(', ');
}
