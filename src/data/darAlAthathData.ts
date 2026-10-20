export interface DarProduct {
  id: string;
  title: string;
  price: number;
  category: 'صالونات' | 'غرف نوم' | 'طاولات وكراسي' | 'خزائن وديكور';
  image: string;
  description: string;
  dimensions?: string;
  inStock: boolean;
}

export interface DarBotLog {
  id: string;
  sender: 'visitor' | 'owner' | 'admin' | 'bot';
  text: string;
  time: string;
}

export interface DarShop {
  id: number;
  name: string;
  ownerName?: string;
  phone: string;
  whatsapp?: string;
  wilaya: string;
  address?: string;
  package: 'bronze' | 'silver' | 'gold' | 'diamond';
  points: number;
  freeTrialDays: number;
  isOpen: boolean;
  isPinned: boolean;
  coverImage: string;
  images: string[];
  products: DarProduct[];
  botName: string;
  botGreeting: string;
  botCustomInstructions?: string;
  botLogs?: DarBotLog[];
  createdAt: number;
}

export interface DarReceiptRecord {
  id: string;
  shopId: number;
  shopName: string;
  shopPhone: string;
  paymentMethod: 'baridimob' | 'chargily' | 'ccp';
  serviceNameAr: string;
  selectedPoints: number;
  expectedAmount: number;
  detectedAmount: number;
  awardedPoints: number;
  awardedPackageId: 'bronze' | 'silver' | 'gold' | 'diamond';
  awardedPackageLabel: string;
  recipientRip: string;
  transactionId: string;
  receiptImage?: string;
  status: 'verified_by_bot' | 'approved_by_admin' | 'rejected';
  botVerdict: string;
  createdAt: string;
}

export interface DarChatMessage {
  id: string;
  from: 'visitor' | 'shop' | 'admin' | 'bot';
  senderLabel: string;
  text: string;
  time: string;
  productRef?: string;
}

export const OFFICIAL_DAR_CONFIG = {
  siteTitle: 'دار الأثاث',
  siteSubtitle: 'دليل محلات الأثاث - الجزائر',
  githubUrl: 'https://chifablida-create.github.io/dar-al-athath/',
  githubRepo: 'chifablida-create/dar-al-athath',
  rip: '00799999000122089353',
  ccpNumber: '0012208935',
  ccpCle: '53',
  accountHolder: 'AMEUR',
  adminPhone: '0798797662',
  baridiMobPhone: '0798797662',
  chargilyPhone: '0798797662',
  defaultAdminPass: 'admin123'
};

export const DAR_WILAYAS_58: string[] = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان',
  'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'عين صالح', 'عين قزام', 'تقرت', 'جانت',
  'المغير', 'المنيعة'
];

export const DAR_PACKAGES = [
  {
    id: 'bronze' as const,
    label: 'برونزي',
    color: '#CD7F32',
    bgLight: '#FDF6EE',
    desc: 'بداية • 50 نقطة',
    pts: 50,
    amount: 2500,
    price: '2500 دج',
    popular: false
  },
  {
    id: 'silver' as const,
    label: 'فضي',
    color: '#71717A',
    bgLight: '#F4F4F5',
    desc: 'نشط • 100 نقطة',
    pts: 100,
    amount: 4500,
    price: '4500 دج',
    popular: true
  },
  {
    id: 'gold' as const,
    label: 'ذهبي',
    color: '#C19A6B',
    bgLight: '#FFF8EE',
    desc: 'مميز ★ • 200 نقطة',
    pts: 200,
    amount: 8000,
    price: '8000 دج',
    popular: false
  },
  {
    id: 'diamond' as const,
    label: 'ماسي',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    desc: 'قمة 💎 • 500 نقطة',
    pts: 500,
    amount: 18000,
    price: '18000 دج',
    popular: false
  }
];

export const DAR_POINTS_TIERS = [
  { pts: 50, amount: 2500, price: '2500 دج', pkgId: 'bronze' as const, pkgLabel: 'برونزي', popular: false },
  { pts: 100, amount: 4500, price: '4500 دج', pkgId: 'silver' as const, pkgLabel: 'فضي', popular: true },
  { pts: 200, amount: 8000, price: '8000 دج', pkgId: 'gold' as const, pkgLabel: 'ذهبي', popular: false },
  { pts: 500, amount: 18000, price: '18000 دج', pkgId: 'diamond' as const, pkgLabel: 'ماسي', popular: false }
];

// Create realistic architectural showroom & furniture SVG data URIs (100% offline-resilient, zero broken URLs)
function createShowroomPhotoSvg(
  title: string,
  subtitle: string,
  theme: 'royal_salon' | 'modern_living' | 'bedroom_luxury' | 'dining_wood' | 'majlis_gold' | 'wardrobe_oak',
  priceBadge?: string
): string {
  const palettes = {
    royal_salon: { wall: '#2B2117', floor: '#E8DDD0', accent: '#C19A6B', sofa: '#F5E6C8', wood: '#8B5A2B' },
    modern_living: { wall: '#1E293B', floor: '#E2E8F0', accent: '#38BDF8', sofa: '#F8FAFC', wood: '#64748B' },
    bedroom_luxury: { wall: '#31251B', floor: '#EDE0D4', accent: '#D4A373', sofa: '#FAEDCD', wood: '#7F5539' },
    dining_wood: { wall: '#27201C', floor: '#E6CCB2', accent: '#DDA15E', sofa: '#FEFAE0', wood: '#9C6644' },
    majlis_gold: { wall: '#3B1F1E', floor: '#F3E5D8', accent: '#E09F3E', sofa: '#FFF3B0', wood: '#9E2A2B' },
    wardrobe_oak: { wall: '#262626', floor: '#E5E5E5', accent: '#C19A6B', sofa: '#FAFAFA', wood: '#A37B52' }
  };
  const p = palettes[theme] || palettes.royal_salon;

  let furnitureIllustration = '';
  if (theme === 'royal_salon' || theme === 'majlis_gold') {
    furnitureIllustration = `
      <!-- Chandelier -->
      <line x1="400" y1="0" x2="400" y2="55" stroke="${p.accent}" stroke-width="3"/>
      <circle cx="400" cy="70" r="24" fill="${p.accent}" opacity="0.25"/>
      <circle cx="400" cy="70" r="12" fill="#FFF8E7"/>
      <!-- Wall Frame -->
      <rect x="260" y="95" width="280" height="115" rx="8" fill="none" stroke="${p.accent}" stroke-width="2.5" opacity="0.6"/>
      <rect x="275" y="108" width="250" height="89" rx="4" fill="${p.accent}" opacity="0.12"/>
      <!-- Royal Sofa -->
      <rect x="145" y="255" width="510" height="115" rx="28" fill="${p.sofa}" stroke="${p.wood}" stroke-width="5"/>
      <rect x="115" y="290" width="55" height="95" rx="18" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="630" y="290" width="55" height="95" rx="18" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="155" y="330" width="490" height="50" rx="12" fill="${p.floor}" stroke="${p.wood}" stroke-width="4"/>
      <!-- Cushions -->
      <rect x="195" y="280" width="75" height="52" rx="12" fill="${p.accent}"/>
      <rect x="362" y="278" width="76" height="54" rx="12" fill="${p.accent}"/>
      <rect x="530" y="280" width="75" height="52" rx="12" fill="${p.accent}"/>
      <!-- Coffee Table -->
      <rect x="270" y="400" width="260" height="22" rx="8" fill="${p.wood}"/>
      <rect x="295" y="422" width="14" height="36" rx="4" fill="${p.accent}"/>
      <rect x="491" y="422" width="14" height="36" rx="4" fill="${p.accent}"/>
    `;
  } else if (theme === 'bedroom_luxury') {
    furnitureIllustration = `
      <!-- Headboard -->
      <rect x="210" y="150" width="380" height="160" rx="20" fill="${p.accent}" stroke="${p.wood}" stroke-width="5"/>
      <!-- Tufting lines -->
      <line x1="305" y1="150" x2="305" y2="310" stroke="${p.wall}" stroke-width="2" opacity="0.35"/>
      <line x1="400" y1="150" x2="400" y2="310" stroke="${p.wall}" stroke-width="2" opacity="0.35"/>
      <line x1="495" y1="150" x2="495" y2="310" rx="2" stroke="${p.wall}" stroke-width="2" opacity="0.35"/>
      <!-- Pillows -->
      <rect x="245" y="255" width="135" height="48" rx="14" fill="#FFFFFF"/>
      <rect x="420" y="255" width="135" height="48" rx="14" fill="#FFFFFF"/>
      <!-- Mattress & Bed Frame -->
      <rect x="185" y="298" width="430" height="90" rx="16" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="175" y="365" width="450" height="42" rx="10" fill="${p.wood}"/>
      <!-- Nightstands -->
      <rect x="95" y="315" width="68" height="88" rx="8" fill="${p.wood}" stroke="${p.accent}" stroke-width="2"/>
      <rect x="637" y="315" width="68" height="88" rx="8" fill="${p.wood}" stroke="${p.accent}" stroke-width="2"/>
    `;
  } else if (theme === 'dining_wood') {
    furnitureIllustration = `
      <!-- Pendant Lights -->
      <line x1="330" y1="0" x2="330" y2="85" stroke="${p.accent}" stroke-width="2.5"/>
      <circle cx="330" cy="95" r="18" fill="${p.accent}"/>
      <line x1="470" y1="0" x2="470" y2="85" stroke="${p.accent}" stroke-width="2.5"/>
      <circle cx="470" cy="95" r="18" fill="${p.accent}"/>
      <!-- Dining Chairs Back -->
      <rect x="215" y="235" width="70" height="125" rx="14" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="315" y="235" width="70" height="125" rx="14" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="415" y="235" width="70" height="125" rx="14" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <rect x="515" y="235" width="70" height="125" rx="14" fill="${p.sofa}" stroke="${p.wood}" stroke-width="4"/>
      <!-- Solid Wood Table -->
      <rect x="160" y="315" width="480" height="28" rx="10" fill="${p.wood}" stroke="${p.accent}" stroke-width="2"/>
      <rect x="200" y="343" width="22" height="105" rx="5" fill="${p.wood}"/>
      <rect x="578" y="343" width="22" height="105" rx="5" fill="${p.wood}"/>
    `;
  } else {
    furnitureIllustration = `
      <!-- Modern Wall Unit & L-Sofa -->
      <rect x="180" y="105" width="440" height="110" rx="10" fill="${p.wood}" opacity="0.35"/>
      <rect x="130" y="265" width="540" height="110" rx="22" fill="${p.sofa}" stroke="${p.accent}" stroke-width="4"/>
      <rect x="460" y="325" width="210" height="95" rx="20" fill="${p.sofa}" stroke="${p.accent}" stroke-width="4"/>
      <rect x="175" y="285" width="85" height="50" rx="10" fill="${p.accent}"/>
      <rect x="300" y="285" width="85" height="50" rx="10" fill="${p.accent}"/>
      <rect x="200" y="395" width="210" height="24" rx="10" fill="${p.wood}"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 540" width="800" height="540">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.wall}"/>
        <stop offset="100%" stop-color="#1A1410"/>
      </linearGradient>
      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.floor}"/>
        <stop offset="100%" stop-color="#C9B8A3"/>
      </linearGradient>
    </defs>
    <!-- Showroom Wall -->
    <rect x="0" y="0" width="800" height="365" fill="url(#wallGrad)"/>
    <!-- Showroom Floor -->
    <rect x="0" y="365" width="800" height="175" fill="url(#floorGrad)"/>
    <line x1="0" y1="365" x2="800" y2="365" stroke="${p.accent}" stroke-width="3"/>
    <!-- Ambient Spotlight -->
    <ellipse cx="400" cy="220" rx="330" ry="160" fill="${p.accent}" opacity="0.12"/>
    ${furnitureIllustration}
    <!-- Top Storefront Signboard -->
    <rect x="24" y="20" width="752" height="62" rx="16" fill="#1A130D" fill-opacity="0.86" stroke="${p.accent}" stroke-width="2"/>
    <text x="748" y="48" text-anchor="end" fill="#FFFFFF" font-family="Tajawal, system-ui, sans-serif" font-weight="900" font-size="22">${title}</text>
    <text x="748" y="70" text-anchor="end" fill="${p.accent}" font-family="Tajawal, system-ui, sans-serif" font-weight="700" font-size="14">${subtitle}</text>
    ${
      priceBadge
        ? `<rect x="40" y="32" width="165" height="38" rx="12" fill="${p.accent}"/>
           <text x="122" y="57" text-anchor="middle" fill="#1A130D" font-family="Tajawal, system-ui, sans-serif" font-weight="900" font-size="17">${priceBadge}</text>`
        : `<rect x="40" y="32" width="175" height="38" rx="12" fill="${p.accent}" fill-opacity="0.2" stroke="${p.accent}" stroke-width="1.5"/>
           <text x="127" y="56" text-anchor="middle" fill="#FFF8EE" font-family="Tajawal, system-ui, sans-serif" font-weight="800" font-size="14">معرض دار الأثاث 🇩🇿</text>`
    }
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Client-side helper to compress real uploaded photos from shop owners so they save reliably in localStorage & server
export async function compressUploadedShopImage(file: File, maxWidth = 960, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawDataUrl = String(ev.target?.result || '');
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const INITIAL_DAR_SHOPS: DarShop[] = [
  {
    id: 1,
    name: 'شفة البليدة للأثاث الراقي',
    ownerName: 'عميروش - شفة البليدة',
    phone: '0798797662',
    whatsapp: '0798797662',
    wilaya: 'البليدة',
    address: 'الطريق الوطني رقم 4، الشفة، ولاية البليدة',
    package: 'diamond',
    points: 500,
    freeTrialDays: 15,
    isOpen: true,
    isPinned: true,
    coverImage: createShowroomPhotoSvg(
      'معرض شفة البليدة للأثاث الراقي',
      'البليدة • صالونات ملكية وغرف نوم خشب الزان الحر',
      'royal_salon'
    ),
    images: [
      createShowroomPhotoSvg('واجهة معرض شفة البليدة للأثاث', 'الشفة - البليدة • صالونات وغرف نوم', 'royal_salon'),
      createShowroomPhotoSvg('صالون ملكي لويس الخامس عشر', 'خشب زان محفور يدوياً • 7 مقاعد', 'majlis_gold', '165,000 دج'),
      createShowroomPhotoSvg('غرفة نوم ملكية كينغ سايز', 'خشب زان + خزانة 6 أبواب بمرايا', 'bedroom_luxury', '210,000 دج'),
      createShowroomPhotoSvg('طاولة طعام 8 كراسي فاخرة', 'خشب الزان الطبيعي المدهون', 'dining_wood', '98,000 دج'),
      createShowroomPhotoSvg('صالون عصري زاوية L-Shape', 'قماش أنتيتاش تركي عالي الكثافة', 'modern_living', '128,000 دج'),
      createShowroomPhotoSvg('خزانة ملابس + كومود ومرايا', 'تفصيل حسب الطلب بجميع المقاسات', 'wardrobe_oak', '85,000 دج')
    ],
    products: [
      {
        id: 'p-blida-1',
        title: 'صالون ملكي شفة البليدة 7 مقاعد + طاولة وسط',
        price: 165000,
        category: 'صالونات',
        image: createShowroomPhotoSvg('صالون ملكي شفة البليدة 7 مقاعد', 'خشب زان أصلي • قماش مخمل ملكي مضاد للبقع', 'royal_salon', '165,000 دج'),
        description: 'صالون جزائري فاخر مصنع في ورشات الشفة بالبليدة من خشب الزان الحر وإسفنج D36 عالي الكثافة مع ضمان 5 سنوات.',
        dimensions: '3.20م × 2.60م (7 مقاعد + طاولة)',
        inStock: true
      },
      {
        id: 'p-blida-2',
        title: 'غرفة نوم عرسان كاملة (سرير كينغ + خزانة 6 أبواب)',
        price: 210000,
        category: 'غرف نوم',
        image: createShowroomPhotoSvg('غرفة نوم عرسان كاملة - شفة البليدة', 'سرير مبطن + خزانة 6 أبواب + كوافوز + 2 طاولات ليل', 'bedroom_luxury', '210,000 دج'),
        description: 'غرفة نوم متكاملة بتصميم عصري فخم مع إضاءة LED مدمجة وسكك سحب هيدروليكية صامتة.',
        dimensions: 'خزانة عرض 2.60م • سرير 1.80×2.00م',
        inStock: true
      },
      {
        id: 'p-blida-3',
        title: 'طاولة أكل خشب الزان 8 كراسي منجدة',
        price: 98000,
        category: 'طاولات وكراسي',
        image: createShowroomPhotoSvg('طاولة أكل خشب الزان 8 كراسي', 'تشطيب جوزي طبيعي مع كراسي مريحة جداً', 'dining_wood', '98,000 دج'),
        description: 'طاولة سفرة متينة قابلة للتمديد مع 8 كراسي مبطنة بقماش سهل التنظيف.',
        dimensions: '2.20م × 1.00م',
        inStock: true
      },
      {
        id: 'p-blida-4',
        title: 'صالون مودرن زاوية L-Shape قماش أنتيتاش',
        price: 128000,
        category: 'صالونات',
        image: createShowroomPhotoSvg('صالون مودرن زاوية L-Shape', 'متوفر بـ 12 لون حسب طلب الزبون', 'modern_living', '128,000 دج'),
        description: 'صالون عصري مريح جداً مع صندوق تخزين سفلي وإمكانية فتحه كسرير إضافي للضيوف.',
        dimensions: '2.95م × 2.15م',
        inStock: true
      }
    ],
    botName: 'روبوت شفة البليدة الذكي',
    botGreeting: 'مرحباً بك في معرض شفة البليدة للأثاث الراقي! أنا روبوت المحل، أساعدك في معرفة أسعار الصالونات وغرف النوم وحساب التوصيل إلى ولايتك وتنفيذ أوامر صاحب المحل فوراً.',
    createdAt: Date.now() - 100000
  },
  {
    id: 2,
    name: 'مفروشات الجزائر العاصمة',
    ownerName: 'الحاج كريم - القبة',
    phone: '0555123456',
    whatsapp: '0555123456',
    wilaya: 'الجزائر',
    address: 'شارع العقيد عميروش، القبة، الجزائر العاصمة',
    package: 'diamond',
    points: 500,
    freeTrialDays: 15,
    isOpen: true,
    isPinned: true,
    coverImage: createShowroomPhotoSvg(
      'معرض مفروشات الجزائر العاصمة',
      'الجزائر • أطقم صالونات حديثة وديكور منزلي متكامل',
      'modern_living'
    ),
    images: [
      createShowroomPhotoSvg('معرض مفروشات الجزائر العاصمة', 'القبة - الجزائر • صالونات عصرية', 'modern_living'),
      createShowroomPhotoSvg('صالون إيطالي مودرن 6 مقاعد', 'تصميم أوروبي فاخر', 'modern_living', '154,000 دج'),
      createShowroomPhotoSvg('وحدة تلفاز حائطية بخشب البلوط', 'مع إضاءة مخفية وأدراج', 'wardrobe_oak', '62,000 دج'),
      createShowroomPhotoSvg('غرفة نوم مودرن رمادي وذهبي', 'خشب MDF إسباني عالي الجودة', 'bedroom_luxury', '185,000 دج')
    ],
    products: [
      {
        id: 'p-alg-1',
        title: 'صالون إيطالي مودرن 6 مقاعد (3+2+1)',
        price: 154000,
        category: 'صالونات',
        image: createShowroomPhotoSvg('صالون إيطالي مودرن 6 مقاعد', 'قماش بوكليه فاخر وأرجل معدنية ذهبية', 'modern_living', '154,000 دج'),
        description: 'طقم صالون عصري بتصميم إيطالي أنيق مناسب للشقق والفيلات الحديثة مع ضمان الجودة.',
        dimensions: 'كنبة 3 مقاعد + كنبة مقعدين + فوتوي',
        inStock: true
      },
      {
        id: 'p-alg-2',
        title: 'مكتبة وطاولة تلفاز حائطية مودرن LED',
        price: 62000,
        category: 'خزائن وديكور',
        image: createShowroomPhotoSvg('مكتبة وطاولة تلفاز حائطية LED', 'خشب أوك طبيعي مع رخام صناعي', 'wardrobe_oak', '62,000 دج'),
        description: 'طقم ديكور تلفاز كامل يشمل الطاولة السفلية والرفوف المعلقة مع التركيب.',
        dimensions: 'عرض 2.40م × ارتفاع 1.90م',
        inStock: true
      },
      {
        id: 'p-alg-3',
        title: 'غرفة نوم كابتونيه فاخرة 5 قطع',
        price: 185000,
        category: 'غرف نوم',
        image: createShowroomPhotoSvg('غرفة نوم كابتونيه فاخرة 5 قطع', 'خزانة ألمنيوم وزجاج عاكس + سرير مبطن', 'bedroom_luxury', '185,000 دج'),
        description: 'غرفة نوم عصرية بأبواب سحاب (كوليس) توفر المساحة وتضفي فخامة على الغرفة.',
        dimensions: 'خزانة 2.40م + سرير 1.60×2.00م',
        inStock: true
      }
    ],
    botName: 'روبوت مفروشات العاصمة',
    botGreeting: 'أهلاً بك في مفروشات الجزائر العاصمة! اسألني عن أي بضاعة أو مقاس أو تواصل مع صاحب المحل مباشرة عبر الشات والهاتف وواتساب.',
    createdAt: Date.now() - 200000
  },
  {
    id: 3,
    name: 'صالونات وهران العصرية',
    ownerName: 'ياسين الوهراني',
    phone: '0770987654',
    whatsapp: '0770987654',
    wilaya: 'وهران',
    address: 'حي العقيد لطفي، وهران',
    package: 'silver',
    points: 100,
    freeTrialDays: 15,
    isOpen: true,
    isPinned: false,
    coverImage: createShowroomPhotoSvg(
      'صالونات وهران العصرية',
      'وهران • غرف نوم وصالونات تركية ومغاربية',
      'bedroom_luxury'
    ),
    images: [
      createShowroomPhotoSvg('معرض صالونات وهران العصرية', 'حي العقيد لطفي - وهران', 'bedroom_luxury'),
      createShowroomPhotoSvg('صالون مغاربي عصري بالذهبي', 'تفصيل حسب مساحة الصالون', 'majlis_gold', '139,000 دج'),
      createShowroomPhotoSvg('غرفة نوم أطفال وشباب بسريرين', 'خشب متين وألوان مبهجة', 'wardrobe_oak', '115,000 دج')
    ],
    products: [
      {
        id: 'p-oran-1',
        title: 'صالون وهراني ملكي مطرز بالذهبي',
        price: 139000,
        category: 'صالونات',
        image: createShowroomPhotoSvg('صالون وهراني ملكي مطرز', 'سداري خشب منقوش + مضارب إسفنج ممتاز', 'majlis_gold', '139,000 دج'),
        description: 'صالون تقليدي وعصري يجمع بين الأصالة والراحة مع طاولة وسط مزخرفة.',
        dimensions: 'تفصيل حسب المقاس بالمتر',
        inStock: true
      },
      {
        id: 'p-oran-2',
        title: 'غرفة نوم أطفال بسريرين ومكتب دراسة',
        price: 115000,
        category: 'غرف نوم',
        image: createShowroomPhotoSvg('غرفة نوم أطفال بسريرين ومكتب', 'خزانة + سريرين + مكتب + كومود', 'wardrobe_oak', '115,000 دج'),
        description: 'غرفة أطفال عملية جداً بمواد آمنة وصحية وتشطيب مقاوم للخدش.',
        dimensions: 'سريرين 90×190سم + خزانة 3 أبواب',
        inStock: true
      }
    ],
    botName: 'روبوت صالونات وهران',
    botGreeting: 'مرحباً بك في صالونات وهران العصرية! أنا روبوت المحل لخدمتك في اختيار الأثاث والتواصل الفوري.',
    createdAt: Date.now() - 300000
  },
  {
    id: 4,
    name: 'أثاث سطيف الفاخر',
    ownerName: 'عبد النور السطايفي',
    phone: '0661122334',
    whatsapp: '0661122334',
    wilaya: 'سطيف',
    address: 'حي بومرشي، سطيف',
    package: 'gold',
    points: 200,
    freeTrialDays: 15,
    isOpen: true,
    isPinned: false,
    coverImage: createShowroomPhotoSvg(
      'أثاث سطيف الفاخر',
      'سطيف • طاولات طعام وغرف نوم وصالونات',
      'dining_wood'
    ),
    images: [
      createShowroomPhotoSvg('معرض أثاث سطيف الفاخر', 'سطيف • جودة وإتقان', 'dining_wood'),
      createShowroomPhotoSvg('طقم طاولة سفرة 6 كراسي', 'خشب الزان الطبيعي', 'dining_wood', '79,000 دج'),
      createShowroomPhotoSvg('خزانة أحذية ومدخل مرايا', 'تصميم عصري أنيق', 'wardrobe_oak', '34,000 دج')
    ],
    products: [
      {
        id: 'p-setif-1',
        title: 'طاولة سفرة سطايفية 6 كراسي خشب زان',
        price: 79000,
        category: 'طاولات وكراسي',
        image: createShowroomPhotoSvg('طاولة سفرة 6 كراسي خشب زان', 'متوفرة باللون الأبيض والذهبي أو الجوزي', 'dining_wood', '79,000 دج'),
        description: 'طاولة طعام عائلية أنيقة بسطح مقاوم للحرارة والرطوبة وكراسي مبطنة.',
        dimensions: '1.80م × 0.95م',
        inStock: true
      },
      {
        id: 'p-setif-2',
        title: 'مدخل منزل (كونسول + مرايا + خزانة أحذية)',
        price: 34000,
        category: 'خزائن وديكور',
        image: createShowroomPhotoSvg('مدخل منزل كونسول ومرايا', 'تسع حتى 18 زوج أحذية', 'wardrobe_oak', '34,000 دج'),
        description: 'قطعة ديكور عملية وجميلة لمدخل البيت مع مرآة مشطوفة.',
        dimensions: 'عرض 1.20م × ارتفاع 1.95م',
        inStock: true
      }
    ],
    botName: 'روبوت أثاث سطيف',
    botGreeting: 'أهلاً بك في معرض أثاث سطيف الفاخر! تصفح البضائع كزائر وتواصل معنا بضغطة زر.',
    createdAt: Date.now() - 400000
  },
  {
    id: 5,
    name: 'موبيليا قسنطينة',
    ownerName: 'سفيان القسنطيني',
    phone: '0799112233',
    whatsapp: '0799112233',
    wilaya: 'قسنطينة',
    address: 'المدينة الجديدة علي منجلي، قسنطينة',
    package: 'bronze',
    points: 50,
    freeTrialDays: 15,
    isOpen: true,
    isPinned: false,
    coverImage: createShowroomPhotoSvg(
      'موبيليا قسنطينة - علي منجلي',
      'قسنطينة • صالونات تقليدية وعصرية وخزائن',
      'majlis_gold'
    ),
    images: [
      createShowroomPhotoSvg('معرض موبيليا قسنطينة', 'علي منجلي - قسنطينة', 'majlis_gold'),
      createShowroomPhotoSvg('صالون قسنطيني تقليدي وعصري', 'قماش المجبود والقطيفة', 'royal_salon', '148,000 دج')
    ],
    products: [
      {
        id: 'p-const-1',
        title: 'صالون قسنطيني فاخر 7 مقاعد بالقطيفة',
        price: 148000,
        category: 'صالونات',
        image: createShowroomPhotoSvg('صالون قسنطيني فاخر 7 مقاعد', 'خشب محفور مع طاولة نحاسية/خشبية', 'royal_salon', '148,000 دج'),
        description: 'صالون يجمع بين الفخامة القسنطينية والراحة العصرية مع إمكانية اختيار لون القماش.',
        dimensions: '7 مقاعد كاملة + 2 طاولات',
        inStock: true
      }
    ],
    botName: 'روبوت موبيليا قسنطينة',
    botGreeting: 'مرحباً بك في موبيليا قسنطينة! أنا روبوت المحل لمساعدتك في كل استفسار.',
    createdAt: Date.now() - 500000
  }
];
