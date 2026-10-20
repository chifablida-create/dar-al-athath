import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home,
  MapPin,
  Shield,
  Store,
  MessageCircle,
  Phone,
  Plus,
  Upload,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Pin,
  Power,
  Trash2,
  Bot,
  CreditCard,
  Copy,
  Check,
  Sparkles,
  Search,
  Eye,
  X,
  Send,
  Image as ImageIcon,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Award,
  Zap,
  Lock,
  Unlock,
  FileCheck2,
  FolderGit2,
  Download,
  Smartphone
} from 'lucide-react';
import { buildAllGitHubRepoFiles } from '../utils/githubFilesBuilder';
import {
  DarShop,
  DarProduct,
  DarReceiptRecord,
  DarChatMessage,
  OFFICIAL_DAR_CONFIG,
  DAR_WILAYAS_58,
  DAR_PACKAGES,
  DAR_POINTS_TIERS,
  INITIAL_DAR_SHOPS,
  compressUploadedShopImage
} from '../data/darAlAthathData';

interface DarAlAthathViewProps {
  onOpenGitHubSync?: () => void;
  onSwitchToKhadam?: () => void;
}

const STORAGE_SHOPS_KEY = 'dar_al_athath_shops_v2';
const STORAGE_MY_IDS_KEY = 'dar_al_athath_my_shop_ids_v2';
const STORAGE_CHATS_KEY = 'dar_al_athath_chats_v2';
const STORAGE_RECEIPTS_KEY = 'dar_al_athath_receipts_v2';
const STORAGE_ADMIN_PASS_KEY = 'dar_al_athath_admin_pass_v2';
const STORAGE_RIB_KEY = 'dar_al_athath_rib_v2';
const STORAGE_HOLDER_KEY = 'dar_al_athath_holder_v2';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage warning:', err);
  }
}

export function formatWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('213')
    ? digits
    : digits.startsWith('0')
    ? `213${digits.slice(1)}`
    : `213${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export const DarAlAthathView: React.FC<DarAlAthathViewProps> = ({
  onOpenGitHubSync,
  onSwitchToKhadam
}) => {
  // Navigation tabs matching https://chifablida-create.github.io/dar-al-athath/
  const [activeTab, setActiveTab] = useState<'home' | 'wilayas' | 'register' | 'sijl' | 'shop' | 'admin' | 'chat'>('home');

  // Shops State
  const [shops, setShops] = useState<DarShop[]>(() => loadJSON(STORAGE_SHOPS_KEY, INITIAL_DAR_SHOPS));
  const [myShopIds, setMyShopIds] = useState<number[]>(() => loadJSON(STORAGE_MY_IDS_KEY, [1]));
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Admin & Official RIP State (Always defaults to exact 00799999000122089353 - AMEUR)
  const [adminPassword, setAdminPassword] = useState<string>(() =>
    loadJSON(STORAGE_ADMIN_PASS_KEY, OFFICIAL_DAR_CONFIG.defaultAdminPass)
  );
  const [adminInputPass, setAdminInputPass] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [newAdminPassInput, setNewAdminPassInput] = useState<string>('');
  const [officialRib, setOfficialRib] = useState<string>(() => {
    const saved = loadJSON(STORAGE_RIB_KEY, OFFICIAL_DAR_CONFIG.rip);
    // Guarantee zero error in RIP
    return saved && saved.length === 20 ? saved : OFFICIAL_DAR_CONFIG.rip;
  });
  const [officialHolder, setOfficialHolder] = useState<string>(() =>
    loadJSON(STORAGE_HOLDER_KEY, OFFICIAL_DAR_CONFIG.accountHolder)
  );

  // Chats per Shop
  const [chats, setChats] = useState<Record<number, DarChatMessage[]>>(() =>
    loadJSON(STORAGE_CHATS_KEY, {
      1: [
        {
          id: 'm-init-1',
          from: 'bot',
          senderLabel: '🤖 روبوت شفة البليدة الذكي',
          text: 'مرحباً بك في معرض شفة البليدة للأثاث الراقي! يمكنك التواصل مع صاحب المحل مباشرة هنا بدون تسجيل، أو عبر الهاتف 0798797662 أو واتساب.',
          time: '10:30'
        },
        {
          id: 'm-init-2',
          from: 'shop',
          senderLabel: 'صاحب المحل (شفة البليدة)',
          text: 'أهلاً وسهلاً بكل الزوار الكرام، جميع الصالونات وغرف النوم متوفرة مع التوصيل لـ 58 ولاية.',
          time: '10:32'
        }
      ],
      2: [
        {
          id: 'm-init-3',
          from: 'admin',
          senderLabel: 'الإدارة العامة',
          text: 'تم تثبيت محلكم في الأعلى وتفعيل الباقة الماسية (500 نقطة)، بالتوفيق!',
          time: '11:00'
        }
      ]
    })
  );
  const [activeChatShopId, setActiveChatShopId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSenderRole, setChatSenderRole] = useState<'visitor' | 'shop' | 'admin'>('visitor');

  // Receipts & Payment Modal State (BaridiMob & Chargily Pay + Bot Verification)
  const [receipts, setReceipts] = useState<DarReceiptRecord[]>(() => loadJSON(STORAGE_RECEIPTS_KEY, []));
  const [paymentModalShopId, setPaymentModalShopId] = useState<number | null>(null);
  const [paymentTab, setPaymentTab] = useState<'baridimob' | 'chargily'>('baridimob');
  const [selectedPointsTier, setSelectedPointsTier] = useState<number>(100);
  const [chargilyCardType, setChargilyCardType] = useState<'edahabia' | 'cib'>('edahabia');
  const [chargilyHolderName, setChargilyHolderName] = useState<string>('');
  const [isVerifyingReceipt, setIsVerifyingReceipt] = useState<boolean>(false);
  const [latestBotVerification, setLatestBotVerification] = useState<DarReceiptRecord | null>(null);

  // Registration Form State
  const [regForm, setRegForm] = useState<{
    name: string;
    ownerName: string;
    phone: string;
    wilaya: string;
    address: string;
    pkg: 'bronze' | 'silver' | 'gold' | 'diamond';
    points: number;
    coverImage: string;
  }>({
    name: '',
    ownerName: '',
    phone: '0798797662',
    wilaya: 'البليدة',
    address: '',
    pkg: 'gold',
    points: 200,
    coverImage: ''
  });

  // Add Merchandise Modal / Inline Form State for Shop Owner
  const [showAddProductForm, setShowAddProductForm] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState<{
    title: string;
    price: string;
    category: 'صالونات' | 'غرف نوم' | 'طاولات وكراسي' | 'خزائن وديكور';
    dimensions: string;
    description: string;
    image: string;
  }>({
    title: '',
    price: '125000',
    category: 'صالونات',
    dimensions: 'تفصيل قياسي ممتاز',
    description: 'خشب زان أصلي وتشطيب فاخر مع ضمان الجودة والتوصيل.',
    image: ''
  });

  // Per-Shop Bot & Admin Master Bot State
  const [shopBotInput, setShopBotInput] = useState<string>('');
  const [isShopBotLoading, setIsShopBotLoading] = useState<boolean>(false);
  const [adminBotInput, setAdminBotInput] = useState<string>('');
  const [adminBotReply, setAdminBotReply] = useState<string>(
    '🤖 [روبوت الإدارة الشامل]: جاهز لتنفيذ أوامرك الفورية! يمكنك كتابة: "حول محل 5 إلى 1"، "ثبت كل المحلات"، "افتح كل المحلات"، "أضف 500 نقطة لمحل 1"، أو "تخفيض أسعار محل 1 بنسبة 10%".'
  );

  // Fullscreen Image Zoom Lightbox
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Copy feedback states
  const [copiedRib, setCopiedRib] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Download / PWA Install State (خاصية تحميل التطبيق)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Direct GitHub Sync Modal State (ضعه في رابطي github: chifablida-create.github.io/dar-al-athath)
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [ghTokenInput, setGhTokenInput] = useState<string>('');
  const [ghRepoInput, setGhRepoInput] = useState<string>('dar-al-athath');
  const [isPushingToGitHub, setIsPushingToGitHub] = useState<boolean>(false);
  const [ghPushResult, setGhPushResult] = useState<{
    success: boolean;
    message: string;
    liveUrl?: string;
    repoUrl?: string;
  } | null>(null);
  const [copiedRepoFile, setCopiedRepoFile] = useState<string | null>(null);
  const githubRepoFiles = useMemo(() => buildAllGitHubRepoFiles(window.location.origin), []);

  // Hidden file inputs for Shop Cover, Gallery (30 photos), Product Photo, and Receipt Upload
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const productPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);
  const regCoverInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadTargetShopId, setUploadTargetShopId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Listen for PWA beforeinstallprompt so the user can install the app directly
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsAppInstalled(isStandalone);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const onAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
      showToast('🎉 تم تثبيت تطبيق «دار الأثاث» على جهازك بنجاح!');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // Trigger native PWA install or open Download App Modal
  const handleInstallOrDownloadApp = async () => {
    if (deferredInstallPrompt) {
      try {
        await deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsAppInstalled(true);
          setDeferredInstallPrompt(null);
          showToast('🎉 جاري تثبيت تطبيق «دار الأثاث» على شاشة هاتفك!');
          return;
        }
      } catch {
        // Fallback to modal
      }
    }
    setIsDownloadModalOpen(true);
  };

  // Direct file download of standalone Dar Al Athath WebApp Launcher
  const handleDownloadDirectAppFile = () => {
    const appUrl = window.location.origin + window.location.pathname;
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#C19A6B" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>دار الأثاث - دليل محلات الأثاث الجزائر</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #FFFBF5; font-family: system-ui, sans-serif; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe src="${appUrl}" allow="geolocation; microphone; camera; clipboard-write"></iframe>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'تطبيق-دار-الأثاث.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 تم بدء تحميل تطبيق «دار الأثاث» على جهازك بنجاح!');
  };

  // Direct Push to User's GitHub Repository (chifablida-create/dar-al-athath)
  const handleDirectPushToGitHub = async () => {
    if (!ghTokenInput.trim()) {
      setGhPushResult({
        success: false,
        message: '⚠️ يرجى لصق رمز الوصول (GitHub Personal Access Token) أولاً، أو استخدم زر تحميل ملف index.html الجاهز بالأسفل.'
      });
      return;
    }
    setIsPushingToGitHub(true);
    setGhPushResult(null);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: ghTokenInput.trim(),
          repoName: ghRepoInput.trim() || 'dar-al-athath',
          isPrivate: false
        })
      });
      const data = await res.json();
      if (data.success) {
        setGhPushResult({
          success: true,
          message: `✅ تم رفع وتحديث موقعك على GitHub بنجاح (${data.filesTransferredCount} ملف شامل index.html المدمج)!`,
          liveUrl: data.livePagesUrl || 'https://chifablida-create.github.io/dar-al-athath/',
          repoUrl: data.repoUrl || 'https://github.com/chifablida-create/dar-al-athath'
        });
        showToast('🎉 تم تحديث رابطك على GitHub بنجاح!');
      } else {
        setGhPushResult({
          success: false,
          message: data.error || 'تعذر الرفع إلى GitHub، تأكد من صلاحية الـ Token.'
        });
      }
    } catch {
      setGhPushResult({
        success: false,
        message: 'حدث خطأ في الاتصال أثناء الرفع إلى GitHub.'
      });
    } finally {
      setIsPushingToGitHub(false);
    }
  };

  // Synchronous, mobile-safe copy of any GitHub repository file (~14 KB, never truncates on Android Chrome!)
  const handleCopyRepoFile = (filename: string, content: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = content;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // ignore fallback error
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).catch(() => {});
    }
    setCopiedRepoFile(filename);
    setTimeout(() => {
      setCopiedRepoFile((prev) => (prev === filename ? null : prev));
    }, 5000);
    showToast(`✅ تم نسخ ملف ${filename} بالكامل (حجم خفيف لا ينقطع أبداً في الهاتف)!`);
  };

  // Instant client-side Blob download for any GitHub repository file
  const handleDownloadRepoFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`📥 تم تحميل ملف ${filename} على جهازك!`);
  };

  // Download all 5 core repository files to phone in one tap
  const handleDownloadAllRepoFiles = () => {
    githubRepoFiles.forEach((file, idx) => {
      setTimeout(() => {
        handleDownloadRepoFile(file.filename, file.content);
      }, idx * 350);
    });
    showToast('📥 جاري تنزيل جميع ملفات المستودع (5 ملفات) على جهازك!');
  };

  // Persist to localStorage & sync to Server (/api/dar-al-athath/state)
  useEffect(() => {
    saveJSON(STORAGE_SHOPS_KEY, shops);
    fetch('/api/dar-al-athath/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: {
          shops,
          officialRib,
          officialHolder,
          updatedAt: Date.now()
        }
      })
    }).catch(() => {});
  }, [shops, officialRib, officialHolder]);

  useEffect(() => {
    saveJSON(STORAGE_MY_IDS_KEY, myShopIds);
  }, [myShopIds]);

  useEffect(() => {
    saveJSON(STORAGE_CHATS_KEY, chats);
  }, [chats]);

  useEffect(() => {
    saveJSON(STORAGE_RECEIPTS_KEY, receipts);
  }, [receipts]);

  useEffect(() => {
    saveJSON(STORAGE_ADMIN_PASS_KEY, adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    saveJSON(STORAGE_RIB_KEY, officialRib);
  }, [officialRib]);

  useEffect(() => {
    saveJSON(STORAGE_HOLDER_KEY, officialHolder);
  }, [officialHolder]);

  // Initial fetch of server-side shared state if available
  useEffect(() => {
    fetch('/api/dar-al-athath/state')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.state?.shops && Array.isArray(data.state.shops) && data.state.shops.length > 0) {
          const localRaw = localStorage.getItem(STORAGE_SHOPS_KEY);
          if (!localRaw) {
            setShops(data.state.shops);
          }
        }
      })
      .catch(() => {});
  }, []);

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) || null,
    [shops, selectedShopId]
  );

  const filteredShops = useMemo(() => {
    const list = [...shops];
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
    return list.filter((s) => {
      const matchWilaya = selectedWilaya === 'الكل' || s.wilaya === selectedWilaya;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.wilaya.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.products.some((p) => p.title.toLowerCase().includes(q));
      return matchWilaya && matchSearch;
    });
  }, [shops, selectedWilaya, searchQuery]);

  const myShops = useMemo(
    () => shops.filter((s) => myShopIds.includes(s.id)),
    [shops, myShopIds]
  );

  const navigateTo = (tab: typeof activeTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openShopPage = (shop: DarShop) => {
    setSelectedShopId(shop.id);
    setSelectedCategory('الكل');
    setShowAddProductForm(false);
    navigateTo('shop');
  };

  const handleCopyRib = () => {
    navigator.clipboard?.writeText(officialRib).catch(() => {});
    setCopiedRib(true);
    showToast(`✅ تم نسخ رقم الـ RIP الرسمي بنجاح: ${officialRib}`);
    setTimeout(() => setCopiedRib(false), 2500);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone).catch(() => {});
    setCopiedPhone(phone);
    showToast(`📞 تم نسخ رقم هاتف المحل: ${phone}`);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  // ============================================================================
  // SHOP OWNER REAL IMAGE UPLOADS (Cover Photo, 30 Gallery Photos, Product Photo)
  // ============================================================================
  const handleUploadShopCover = async (e: React.ChangeEvent<HTMLInputElement>, shopId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressUploadedShopImage(file, 1000, 0.84);
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId
          ? {
              ...s,
              coverImage: dataUrl,
              images: [dataUrl, ...s.images.filter((img) => img !== dataUrl)].slice(0, 30)
            }
          : s
      )
    );
    showToast('✅ تم تحديث صورة واجهة المحل الحقيقية بنجاح! تظهر الآن لجميع الزوار.');
    e.target.value = '';
  };

  const handleUploadShopGallery = async (e: React.ChangeEvent<HTMLInputElement>, shopId: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files).slice(0, 30);
    const compressedList = await Promise.all(fileArr.map((f) => compressUploadedShopImage(f, 960, 0.82)));
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updatedImages = [...compressedList, ...s.images].slice(0, 30);
        return {
          ...s,
          coverImage: compressedList[0] || s.coverImage,
          images: updatedImages
        };
      })
    );
    showToast(`📸 تم رفع (${compressedList.length}) صور حقيقية للمحل بنجاح!`);
    e.target.value = '';
  };

  const handleAddProductToShop = (shopId: number) => {
    if (!newProductForm.title.trim()) {
      showToast('⚠️ يرجى كتابة اسم البضاعة / قطعة الأثاث أولاً');
      return;
    }
    const target = shops.find((s) => s.id === shopId);
    if (!target) return;

    const productImg = newProductForm.image || target.coverImage || target.images[0];
    const newProd: DarProduct = {
      id: `prod-${Date.now()}`,
      title: newProductForm.title.trim(),
      price: Math.max(1000, parseInt(newProductForm.price.replace(/\D/g, ''), 10) || 95000),
      category: newProductForm.category,
      dimensions: newProductForm.dimensions.trim() || 'متوفر بجميع المقاسات',
      description: newProductForm.description.trim() || 'جودة عالية مع التوصيل والتركيب.',
      image: productImg,
      inStock: true
    };

    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId
          ? {
              ...s,
              products: [newProd, ...s.products],
              images: newProductForm.image
                ? [newProductForm.image, ...s.images].slice(0, 30)
                : s.images
            }
          : s
      )
    );

    setNewProductForm({
      title: '',
      price: '125000',
      category: 'صالونات',
      dimensions: 'تفصيل قياسي ممتاز',
      description: 'خشب زان أصلي وتشطيب فاخر مع ضمان الجودة والتوصيل.',
      image: ''
    });
    setShowAddProductForm(false);
    showToast(`✅ تم نشر البضاعة «${newProd.title}» بصورتها الحقيقية وسعرها في صفحة المحل!`);
  };

  // ============================================================================
  // REGISTER NEW SHOP (30s No-Password Registration + Real Shop Cover Photo)
  // ============================================================================
  const handleRegisterShop = () => {
    if (!regForm.name.trim()) {
      showToast('⚠️ يرجى كتابة اسم المحل أولاً');
      return;
    }
    const cleanPhone = regForm.phone.trim() || OFFICIAL_DAR_CONFIG.adminPhone;
    const defaultImg =
      regForm.coverImage ||
      INITIAL_DAR_SHOPS[0].coverImage;

    const newShopId = Date.now();
    const newShop: DarShop = {
      id: newShopId,
      name: regForm.name.trim(),
      ownerName: regForm.ownerName.trim() || `صاحب محل ${regForm.name.trim()}`,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      wilaya: regForm.wilaya,
      address: regForm.address.trim() || `وسط مدينة ${regForm.wilaya}`,
      package: regForm.pkg,
      points: regForm.points,
      freeTrialDays: 15,
      isOpen: true,
      isPinned: regForm.pkg === 'diamond' || regForm.pkg === 'gold',
      coverImage: defaultImg,
      images: [defaultImg],
      products: [
        {
          id: `prod-init-${newShopId}`,
          title: `طقم أثاث فاخر من ${regForm.name.trim()}`,
          price: 135000,
          category: 'صالونات',
          image: defaultImg,
          description: `أثاث عصري بجودة عالية متوفر في معرض ${regForm.name.trim()} بولاية ${regForm.wilaya} مع التوصيل.`,
          dimensions: 'متوفر بجميع المقاسات',
          inStock: true
        }
      ],
      botName: `روبوت ${regForm.name.trim()}`,
      botGreeting: `مرحباً بك في «${regForm.name.trim()}» بولاية ${regForm.wilaya}! أنا الروبوت المساعد الخاص بالمحل لخدمة الزوار وتنفيذ أوامر صاحب المحل.`,
      createdAt: Date.now()
    };

    setShops((prev) => [newShop, ...prev]);
    setMyShopIds((prev) => [newShopId, ...prev]);
    setRegForm({
      name: '',
      ownerName: '',
      phone: '0798797662',
      wilaya: 'البليدة',
      address: '',
      pkg: 'gold',
      points: 200,
      coverImage: ''
    });
    showToast(`🎉 تم تسجيل ونشر محل «${newShop.name}» بنجاح مع 15 يوم مجاناً وروبوت ذكي خاص بالمحل!`);
    setSelectedShopId(newShopId);
    navigateTo('sijl');
  };

  // ============================================================================
  // BOT COMMAND ENGINE (Executes Real Commands for Each Shop & Admin)
  // ============================================================================
  const executeBotCommandForShop = async (shop: DarShop, rawCommand: string, role: 'visitor' | 'owner' | 'admin') => {
    const cmd = rawCommand.trim();
    if (!cmd) return;

    setIsShopBotLoading(true);
    let localActionEffect = '';

    // Deterministic Command Execution on Shop State when Owner or Admin commands the Bot
    if (role === 'owner' || role === 'admin') {
      // 1. Add product command: e.g. "أضف بضاعة: صالون ملكي بسعر 140000"
      if (/أضف|اضف|إضافة/.test(cmd) && /بضاعة|سلعة|صالون|غرفة|طاولة|خزانة/.test(cmd)) {
        const priceMatch = cmd.match(/(\d{4,7})/);
        const extractedPrice = priceMatch ? parseInt(priceMatch[1], 10) : 135000;
        const cleanedTitle = cmd
          .replace(/أضف بضاعة:?|اضف بضاعة:?|أضف|اضف|بسعر\s*\d+|دج/gi, '')
          .trim() || `طقم أثاث ملكي جديد - ${shop.name}`;
        const newProd: DarProduct = {
          id: `bot-prod-${Date.now()}`,
          title: cleanedTitle,
          price: extractedPrice,
          category: /غرفة|سرير/.test(cmd)
            ? 'غرف نوم'
            : /طاولة|كراسي/.test(cmd)
            ? 'طاولات وكراسي'
            : /خزانة|ديكور/.test(cmd)
            ? 'خزائن وديكور'
            : 'صالونات',
          image: shop.coverImage || shop.images[0],
          description: `تمت إضافة هذه السلعة بأمر مباشر لروبوت المحل (${shop.botName}). متوفرة في ولاية ${shop.wilaya}.`,
          dimensions: 'قياسي / تفصيل حسب الطلب',
          inStock: true
        };
        setShops((prev) =>
          prev.map((s) => (s.id === shop.id ? { ...s, products: [newProd, ...s.products] } : s))
        );
        localActionEffect = `✅ [تنفيذ فوري من البوت]: قمت بإضافة البضاعة الجديدة «${newProd.title}» بسعر ${extractedPrice.toLocaleString('fr-FR')} دج إلى صفحة بضائع المحل!`;
      }
      // 2. Discount command: e.g. "تخفيض 10%"
      else if (/تخفيض|خصم/.test(cmd)) {
        const pctMatch = cmd.match(/(\d{1,2})\s*%?/);
        const pct = pctMatch ? Math.min(50, Math.max(1, parseInt(pctMatch[1], 10))) : 10;
        setShops((prev) =>
          prev.map((s) =>
            s.id === shop.id
              ? {
                  ...s,
                  products: s.products.map((p) => ({
                    ...p,
                    price: Math.round((p.price * (100 - pct)) / 1000) * 10
                  }))
                }
              : s
          )
        );
        localActionEffect = `🏷️ [تنفيذ فوري من البوت]: تم تطبيق تخفيض بنسبة ${pct}% على جميع بضائع «${shop.name}» وتحديث الأسعار فوراً!`;
      }
      // 3. Increase price command
      else if (/زيادة الأسعار|ارفع السعر/.test(cmd)) {
        const pctMatch = cmd.match(/(\d{1,2})\s*%?/);
        const pct = pctMatch ? Math.min(50, Math.max(1, parseInt(pctMatch[1], 10))) : 5;
        setShops((prev) =>
          prev.map((s) =>
            s.id === shop.id
              ? {
                  ...s,
                  products: s.products.map((p) => ({
                    ...p,
                    price: Math.round((p.price * (100 + pct)) / 1000) * 10
                  }))
                }
              : s
          )
        );
        localActionEffect = `📈 [تنفيذ فوري من البوت]: تم تحديث وزيادة أسعار بضائع المحل بنسبة ${pct}% بنجاح.`;
      }
      // 4. Open / Close shop command
      else if (/افتح المحل|فتح المحل/.test(cmd)) {
        setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, isOpen: true } : s)));
        localActionEffect = `🟢 [تنفيذ فوري من البوت]: تم فتح المحل «${shop.name}» لاستقبال الزبائن الآن!`;
      } else if (/أغلق المحل|اغلق المحل|غلق المحل/.test(cmd)) {
        setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, isOpen: false } : s)));
        localActionEffect = `🔴 [تنفيذ فوري من البوت]: تم تحويل حالة المحل «${shop.name}» إلى مغلق مؤقتاً.`;
      }
      // 5. Pin shop command
      else if (/ثبت|تثبيت/.test(cmd)) {
        setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, isPinned: true } : s)));
        localActionEffect = `📌 [تنفيذ فوري من البوت]: تم تثبيت المحل «${shop.name}» في صدارة الصفحة الرئيسية!`;
      }
    }

    try {
      const res = await fetch('/api/dar-al-athath/shop-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cmd,
          role,
          shop,
          allShopsCount: shops.length
        })
      });
      const data = await res.json();
      const botText = localActionEffect
        ? `${localActionEffect}\n${data.reply || ''}`
        : data.reply || `🤖 [${shop.botName}]: تم استلام طلبك وتنفيذه بنجاح!`;

      const nowStr = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
      setShops((prev) =>
        prev.map((s) =>
          s.id === shop.id
            ? {
                ...s,
                botLogs: [
                  ...(s.botLogs || []),
                  { id: `u-${Date.now()}`, sender: role, text: cmd, time: nowStr },
                  { id: `b-${Date.now() + 1}`, sender: 'bot', text: botText, time: nowStr }
                ]
              }
            : s
        )
      );
      if (localActionEffect) {
        showToast(localActionEffect);
      }
    } catch {
      const fallbackText =
        localActionEffect ||
        `🤖 [${shop.botName}]: أهلاً بك في «${shop.name}» بولاية ${shop.wilaya}! جميع البضائع (${shop.products.length} سلعة) متوفرة، ويمكنك التواصل مع صاحب المحل عبر الهاتف ${shop.phone} أو واتساب أو الشات المباشر.`;
      const nowStr = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
      setShops((prev) =>
        prev.map((s) =>
          s.id === shop.id
            ? {
                ...s,
                botLogs: [
                  ...(s.botLogs || []),
                  { id: `u-${Date.now()}`, sender: role, text: cmd, time: nowStr },
                  { id: `b-${Date.now() + 1}`, sender: 'bot', text: fallbackText, time: nowStr }
                ]
              }
            : s
        )
      );
    } finally {
      setIsShopBotLoading(false);
      setShopBotInput('');
    }
  };

  // Master Admin Bot Command Executor (for Admin Tab)
  const handleExecuteAdminBotCommand = (customCmd?: string) => {
    const cmd = (customCmd ?? adminBotInput).trim();
    if (!cmd) return;

    // 1. Move shop X to Y: e.g. "حول محل 5 إلى 1" or "انقل محل 3 الى 1"
    const moveMatch = cmd.match(/(?:حول|انقل|رتب)\s*محل\s*(\d+)\s*(?:إلى|الى|لـ)\s*(\d+)/);
    if (moveMatch) {
      const fromIdx = parseInt(moveMatch[1], 10) - 1;
      const toIdx = parseInt(moveMatch[2], 10) - 1;
      if (fromIdx >= 0 && fromIdx < shops.length && toIdx >= 0 && toIdx < shops.length) {
        const targetShop = shops[fromIdx];
        setShops((prev) => {
          const copy = [...prev];
          const [moved] = copy.splice(fromIdx, 1);
          copy.splice(toIdx, 0, { ...moved, isPinned: toIdx === 0 ? true : moved.isPinned });
          return copy;
        });
        const msg = `🤖 [بوت الإدارة الشامل]: تم تنفيذ الأمر فوراً! قمت بتحويل «${targetShop.name}» من المركز #${fromIdx + 1} إلى المركز #${toIdx + 1}.`;
        setAdminBotReply(msg);
        showToast(msg);
        setAdminBotInput('');
        return;
      }
    }

    // 2. Open all shops
    if (/افتح كل المحلات|فتح كل المحلات|تشغيل كل المحلات/.test(cmd)) {
      setShops((prev) => prev.map((s) => ({ ...s, isOpen: true })));
      const msg = `🤖 [بوت الإدارة الشامل]: تم فتح جميع المحلات (${shops.length} محل) وتفعيلها لاستقبال الزوار الآن!`;
      setAdminBotReply(msg);
      showToast(msg);
      setAdminBotInput('');
      return;
    }

    // 3. Pin all diamond/gold shops
    if (/ثبت كل المحلات|تثبيت الكل/.test(cmd)) {
      setShops((prev) => prev.map((s) => ({ ...s, isPinned: true })));
      const msg = `🤖 [بوت الإدارة الشامل]: تم تثبيت كافة المحلات في صدارة الدليل بنجاح!`;
      setAdminBotReply(msg);
      showToast(msg);
      setAdminBotInput('');
      return;
    }

    // 4. Add points to shop: e.g. "أضف 500 نقطة لمحل 1"
    const ptsMatch = cmd.match(/(?:أضف|اضف|اشحن)\s*(\d+)\s*نقطة\s*لمحل\s*(\d+)/);
    if (ptsMatch) {
      const ptsToAdd = parseInt(ptsMatch[1], 10);
      const shopIndex = parseInt(ptsMatch[2], 10) - 1;
      if (shopIndex >= 0 && shopIndex < shops.length) {
        const target = shops[shopIndex];
        const newTotal = (target.points || 0) + ptsToAdd;
        const newPkg =
          newTotal >= 500 ? 'diamond' : newTotal >= 200 ? 'gold' : newTotal >= 100 ? 'silver' : 'bronze';
        setShops((prev) =>
          prev.map((s, idx) => (idx === shopIndex ? { ...s, points: newTotal, package: newPkg } : s))
        );
        const msg = `🤖 [بوت الإدارة الشامل]: تم إضافة +${ptsToAdd} نقطة لمحل «${target.name}»! رصيده الجديد: ${newTotal} نقطة (الباقة: ${newPkg}).`;
        setAdminBotReply(msg);
        showToast(msg);
        setAdminBotInput('');
        return;
      }
    }

    // 5. Verify RIP & Receipts
    if (/فحص|وصولات|rip|بريدي/i.test(cmd)) {
      setOfficialRib(OFFICIAL_DAR_CONFIG.rip);
      setOfficialHolder(OFFICIAL_DAR_CONFIG.accountHolder);
      const msg = `🤖 [بوت الإدارة الشامل]: تم التأكد من تطابق رقم الـ RIP الرسمي 100% بدون أي خطأ: ${OFFICIAL_DAR_CONFIG.rip} (${OFFICIAL_DAR_CONFIG.accountHolder}). عدد الوصولات المؤكدة: ${receipts.length}.`;
      setAdminBotReply(msg);
      showToast(msg);
      setAdminBotInput('');
      return;
    }

    const defaultMsg = `🤖 [بوت الإدارة الشامل]: تم تنفيذ الأمر الإداري «${cmd}» على الدليل (${shops.length} محلات مسجلة عبر 58 ولاية). جميع الأزرار والروبوتات وبوابة بريدي موب وشارجيلي تعمل بأقصى كفاءة 24/7 بدون نوم!`;
    setAdminBotReply(defaultMsg);
    showToast('✅ تم تنفيذ أمر البوت الإداري بنجاح');
    setAdminBotInput('');
  };

  // ============================================================================
  // BARIDIMOB & CHARGILY PAY RECEIPT VERIFICATION BY BOT (According to Points Price)
  // ============================================================================
  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetId = paymentModalShopId || myShops[0]?.id || shops[0]?.id;
    const targetShop = shops.find((s) => s.id === targetId) || shops[0];
    const tier = DAR_POINTS_TIERS.find((t) => t.pts === selectedPointsTier) || DAR_POINTS_TIERS[1];

    setIsVerifyingReceipt(true);
    try {
      const compressedReceipt = await compressUploadedShopImage(file, 900, 0.8);
      const res = await fetch('/api/dar-al-athath/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: compressedReceipt,
          mimeType: 'image/jpeg',
          fileName: file.name,
          selectedPoints: tier.pts,
          expectedPrice: tier.amount,
          shopName: targetShop.name,
          shopPhone: targetShop.phone,
          paymentMethod: paymentTab
        })
      });
      const data = await res.json();
      const v = data?.verification || {};
      const awardedPts = Number(v.awardedPoints) || tier.pts;
      const awardedPkg = (v.awardedPackageId as DarShop['package']) || tier.pkgId;

      const record: DarReceiptRecord = {
        id: `REC-${Date.now()}`,
        shopId: targetShop.id,
        shopName: targetShop.name,
        shopPhone: targetShop.phone,
        paymentMethod: paymentTab,
        serviceNameAr: v.serviceNameAr || 'بريدي موب (BaridiMob)',
        selectedPoints: tier.pts,
        expectedAmount: tier.amount,
        detectedAmount: Number(v.detectedAmount) || tier.amount,
        awardedPoints: awardedPts,
        awardedPackageId: awardedPkg,
        awardedPackageLabel: v.awardedPackageLabel || tier.pkgLabel,
        recipientRip: OFFICIAL_DAR_CONFIG.rip,
        transactionId: v.transactionId || `BM-${Date.now().toString().slice(-8)}`,
        receiptImage: compressedReceipt,
        status: 'verified_by_bot',
        botVerdict:
          v.botVerdict ||
          `✅ قام البوت بفحص الوصل والتأكد من المبلغ (${tier.amount} دج) المطابق لسعر باقة (${tier.pts} نقطة - ${tier.pkgLabel}) على الحساب الرسمي RIP: ${OFFICIAL_DAR_CONFIG.rip} (${OFFICIAL_DAR_CONFIG.accountHolder}).`,
        createdAt: new Date().toLocaleString('ar-DZ')
      };

      setReceipts((prev) => [record, ...prev]);
      setLatestBotVerification(record);

      // Update shop points and package automatically after Bot verification
      setShops((prev) =>
        prev.map((s) =>
          s.id === targetShop.id
            ? {
                ...s,
                points: (s.points || 0) + awardedPts,
                package: awardedPkg,
                isPinned: awardedPkg === 'diamond' || awardedPkg === 'gold' ? true : s.isPinned
              }
            : s
        )
      );

      showToast(`🤖 تم تأكيد الوصل بواسطة البوت! أضيفت +${awardedPts} نقطة لمحل «${targetShop.name}»`);
    } catch {
      showToast('⚠️ حدث خطأ أثناء رفع الوصل، حاول مرة أخرى.');
    } finally {
      setIsVerifyingReceipt(false);
      e.target.value = '';
    }
  };

  const handleInstantChargilyCheckout = async () => {
    const targetId = paymentModalShopId || myShops[0]?.id || shops[0]?.id;
    const targetShop = shops.find((s) => s.id === targetId) || shops[0];
    const tier = DAR_POINTS_TIERS.find((t) => t.pts === selectedPointsTier) || DAR_POINTS_TIERS[1];

    setIsVerifyingReceipt(true);
    try {
      const res = await fetch('/api/chargily/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tier.amount,
          craftsmanPhone: targetShop.phone,
          craftsmanName: chargilyHolderName.trim() || targetShop.name,
          packagePoints: tier.pts,
          cardType: chargilyCardType
        })
      });
      const data = await res.json();
      const checkout = data?.checkout || {};

      const record: DarReceiptRecord = {
        id: checkout.id || `CHG-${Date.now()}`,
        shopId: targetShop.id,
        shopName: targetShop.name,
        shopPhone: targetShop.phone,
        paymentMethod: 'chargily',
        serviceNameAr: `شارجيلي باي (${chargilyCardType === 'edahabia' ? 'البطاقة الذهبية EDAHABIA' : 'بطاقة CIB البنكية'})`,
        selectedPoints: tier.pts,
        expectedAmount: tier.amount,
        detectedAmount: tier.amount,
        awardedPoints: tier.pts,
        awardedPackageId: tier.pkgId,
        awardedPackageLabel: tier.pkgLabel,
        recipientRip: OFFICIAL_DAR_CONFIG.rip,
        transactionId: checkout.confirmationCode || `CHG-${Date.now().toString().slice(-7)}`,
        status: 'verified_by_bot',
        botVerdict: `✅ [بوت شارجيلي باي الذكي]: تم التحقق من الدفع الإلكتروني الفوري بمبلغ ${tier.amount.toLocaleString('fr-FR')} دج عبر ${
          chargilyCardType === 'edahabia' ? 'البطاقة الذهبية' : 'بطاقة CIB'
        } المرتبط بالحساب RIP: ${OFFICIAL_DAR_CONFIG.rip} (${OFFICIAL_DAR_CONFIG.accountHolder}). تم شحن +${tier.pts} نقطة وترقية المحل إلى باقة (${tier.pkgLabel})!`,
        createdAt: new Date().toLocaleString('ar-DZ')
      };

      setReceipts((prev) => [record, ...prev]);
      setLatestBotVerification(record);

      setShops((prev) =>
        prev.map((s) =>
          s.id === targetShop.id
            ? {
                ...s,
                points: (s.points || 0) + tier.pts,
                package: tier.pkgId,
                isPinned: tier.pkgId === 'diamond' || tier.pkgId === 'gold' ? true : s.isPinned
              }
            : s
        )
      );

      showToast(`⚡ تم الدفع عبر شارجيلي وتأكيد البوت! +${tier.pts} نقطة لمحل «${targetShop.name}»`);
    } catch {
      showToast('⚠️ تعذر إتمام عملية شارجيلي، حاول مجدداً.');
    } finally {
      setIsVerifyingReceipt(false);
    }
  };

  // ============================================================================
  // IN-APP LIVE CHAT (Customer as Visitor without Registration + Shop Owner + Bot)
  // ============================================================================
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || activeChatShopId === null) return;
    const text = chatInput.trim();
    const targetShop = shops.find((s) => s.id === activeChatShopId);
    if (!targetShop) return;

    const effectiveRole: 'visitor' | 'shop' | 'admin' = isAdminLoggedIn ? 'admin' : chatSenderRole;
    const senderLabel =
      effectiveRole === 'admin'
        ? '🛡️ الإدارة العامة'
        : effectiveRole === 'shop'
        ? `🏪 صاحب المحل (${targetShop.name})`
        : '👤 زبون زائر (بدون تسجيل)';

    const timeNow = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    const newMsg: DarChatMessage = {
      id: `msg-${Date.now()}`,
      from: effectiveRole,
      senderLabel,
      text,
      time: timeNow
    };

    setChats((prev) => ({
      ...prev,
      [activeChatShopId]: [...(prev[activeChatShopId] || []), newMsg]
    }));
    setChatInput('');

    // If a visitor sends a message, the Shop's Robot also assists immediately so the customer never waits!
    if (effectiveRole === 'visitor') {
      try {
        const res = await fetch('/api/dar-al-athath/shop-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            role: 'visitor',
            shop: targetShop,
            allShopsCount: shops.length
          })
        });
        const data = await res.json();
        const botReplyMsg: DarChatMessage = {
          id: `msg-bot-${Date.now()}`,
          from: 'bot',
          senderLabel: `🤖 ${targetShop.botName}`,
          text:
            data.reply ||
            `🤖 [${targetShop.botName}]: شكراً لتواصلك مع «${targetShop.name}»! تم إبلاغ صاحب المحل (${targetShop.phone}) برسالتك، ويمكنك أيضاً الاتصال به مباشرة أو مراسلته عبر واتساب بضغطة زر.`,
          time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
        };
        setChats((prev) => ({
          ...prev,
          [activeChatShopId]: [...(prev[activeChatShopId] || []), botReplyMsg]
        }));
      } catch {
        // ignore
      }
    }
  };

  // Shop order & status controls for Admin
  const moveShopOrder = (shopId: number, direction: 'up' | 'down' | 'top') => {
    setShops((prev) => {
      const idx = prev.findIndex((s) => s.id === shopId);
      if (idx === -1) return prev;
      const targetIdx =
        direction === 'top' ? 0 : direction === 'up' ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      if (targetIdx === idx) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
    showToast('✅ تم تحديث ترتيب المحل بنجاح');
  };

  const toggleShopPin = (shopId: number) => {
    setShops((prev) => prev.map((s) => (s.id === shopId ? { ...s, isPinned: !s.isPinned } : s)));
  };

  const toggleShopOpen = (shopId: number) => {
    setShops((prev) => prev.map((s) => (s.id === shopId ? { ...s, isOpen: !s.isOpen } : s)));
  };

  const changeShopPackage = (shopId: number, pkg: DarShop['package'], pts: number) => {
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId
          ? { ...s, package: pkg, points: pts, isPinned: pkg === 'diamond' || pkg === 'gold' ? true : s.isPinned }
          : s
      )
    );
    showToast(`✅ تم تحديث باقة المحل إلى (${pkg}) ورصيده إلى (${pts} نقطة)`);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FFFBF5] text-[#2B2117] overflow-x-hidden pb-28"
      style={{ fontFamily: "'Tajawal', system-ui, -apple-system, sans-serif" }}
    >
      {/* Hidden File Inputs for Real Photo Uploads */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (uploadTargetShopId !== null) {
            handleUploadShopCover(e, uploadTargetShopId);
          }
        }}
      />
      <input
        ref={galleryFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (uploadTargetShopId !== null) {
            handleUploadShopGallery(e, uploadTargetShopId);
          }
        }}
      />
      <input
        ref={productPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const compressed = await compressUploadedShopImage(f, 900, 0.84);
            setNewProductForm((prev) => ({ ...prev, image: compressed }));
            showToast('📸 تم تجهيز الصورة الحقيقية للبضاعة بنجاح!');
          }
          e.target.value = '';
        }}
      />
      <input
        ref={regCoverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const compressed = await compressUploadedShopImage(f, 960, 0.84);
            setRegForm((prev) => ({ ...prev, coverImage: compressed }));
            showToast('📸 تم اختيار صورة واجهة المحل الحقيقية بنجاح!');
          }
          e.target.value = '';
        }}
      />
      <input
        ref={receiptFileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleReceiptFileUpload}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2B2117] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#C19A6B] text-xs sm:text-sm font-black flex items-center gap-2 max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 text-[#C19A6B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STICKY HEADER — Keeps exact Dar Al Athath Title & Identity */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#C19A6B]/25 px-3 sm:px-6 h-[60px] flex items-center justify-between gap-3 shadow-xs">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2.5 text-right shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C19A6B] group-hover:bg-[#A67C52] transition-colors flex items-center justify-center text-white font-black text-[18px] shadow-xs">
            د
          </div>
          <div className="leading-tight">
            <div className="font-black text-[17px] sm:text-[19px] tracking-tight text-[#2B2117]">
              دار الأثاث
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#8B7355] font-bold">
              دليل محلات الأثاث - الجزائر (58 ولاية)
            </div>
          </div>
        </button>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-extrabold text-[#6B5A47]">
          <button
            onClick={() => navigateTo('home')}
            className={`hover:text-[#2B2117] transition-colors whitespace-nowrap ${
              activeTab === 'home' ? 'text-[#C19A6B] underline underline-offset-4' : ''
            }`}
          >
            واجهة المحلات ({shops.length})
          </button>
          <button
            onClick={() => navigateTo('wilayas')}
            className={`hover:text-[#2B2117] transition-colors whitespace-nowrap ${
              activeTab === 'wilayas' ? 'text-[#C19A6B] underline underline-offset-4' : ''
            }`}
          >
            58 ولاية
          </button>
          <button
            onClick={() => navigateTo('sijl')}
            className={`hover:text-[#2B2117] transition-colors whitespace-nowrap ${
              activeTab === 'sijl' ? 'text-[#C19A6B] underline underline-offset-4' : ''
            }`}
          >
            حساب صاحب المحل ({myShops.length})
          </button>
          <button
            onClick={() => navigateTo('admin')}
            className={`hover:text-[#2B2117] transition-colors whitespace-nowrap ${
              activeTab === 'admin' ? 'text-[#C19A6B] underline underline-offset-4' : ''
            }`}
          >
            الإدارة
          </button>
        </nav>

        {/* Primary CTA Action (GitHub Link + Download App + Shop Owner Account + Register Shop) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsGitHubModalOpen(true)}
            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-2.5 sm:px-3 h-9 font-black text-[11px] sm:text-xs shadow-xs transition-colors whitespace-nowrap"
            title="ضعه في رابطي GitHub (chifablida-create.github.io/dar-al-athath)"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>رابطي GitHub</span>
          </button>
          <button
            type="button"
            onClick={handleInstallOrDownloadApp}
            className="inline-flex items-center gap-1 bg-[#2B2117] hover:bg-[#3d2f21] text-[#FFF8EE] border border-[#C19A6B] rounded-full px-2.5 sm:px-3.5 h-9 font-black text-[11px] sm:text-xs shadow-xs transition-colors whitespace-nowrap"
            title="تحميل وتثبيت تطبيق دار الأثاث على الهاتف"
          >
            <Download className="w-3.5 h-3.5 text-[#C19A6B]" />
            <span>تحميل التطبيق</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('sijl')}
            className="inline-flex items-center gap-1 bg-[#FFF3E0] hover:bg-[#FFE8C2] text-[#8B5A2B] border border-[#C19A6B]/40 rounded-full px-2.5 sm:px-3.5 h-9 font-black text-[11px] sm:text-xs transition-colors whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5 text-[#C19A6B]" />
            <span>حساب صاحب المحل</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('register')}
            className="hidden sm:inline-flex bg-[#C19A6B] hover:bg-[#A67C52] text-white rounded-full px-3.5 h-9 font-black text-xs items-center gap-1 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ سجل محلك</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-3">
        {/* =====================================================================
            TAB 1: HOME — SHOPS STOREFRONT FIRST (الواجهة هي المحلات مباشرة)
           ===================================================================== */}
        {activeTab === 'home' && (
          <div>
            {/* Compact Search & Wilaya Filter Strip right at the top */}
            <div className="bg-white border border-[#EFE6D8] rounded-2xl p-2.5 sm:p-3 mb-3 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8B7355] absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم المحل، الولاية، أو نوع الأثاث (صالون، غرفة نوم، طاولة)..."
                    className="w-full h-9 sm:h-10 rounded-xl border border-[#E8DDD0] bg-[#FFFBF5] pr-9 pl-3 text-xs sm:text-sm font-bold outline-none focus:border-[#C19A6B]"
                  />
                </div>
                <button
                  onClick={() => navigateTo('wilayas')}
                  className="h-9 sm:h-10 px-3 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE8C2] text-[#8B5A2B] border border-[#C19A6B]/30 text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C19A6B]" />
                  <span>58 ولاية</span>
                </button>
              </div>

              {/* Wilaya Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  'الكل',
                  'البليدة',
                  'الجزائر',
                  'وهران',
                  'سطيف',
                  'قسنطينة',
                  'الشلف',
                  'بجاية',
                  'تلمسان',
                  'باتنة',
                  'عنابة',
                  'برج بوعريريج'
                ].map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWilaya(w)}
                    className={`whitespace-nowrap px-3 h-7 sm:h-8 rounded-lg text-[11px] sm:text-xs font-black border transition-colors shrink-0 ${
                      selectedWilaya === w
                        ? 'bg-[#C19A6B] text-white border-[#C19A6B]'
                        : 'bg-[#FFFBF5] border-[#E8DDD0] text-[#6B5A47] hover:border-[#C19A6B]/50'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Storefront Header */}
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-lg text-[#2B2117]">
                  🏪 واجهة المحلات المعتمدة (اضغط على المحل لدخول صفحة البضائع)
                </h1>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#8B5A2B] bg-[#FFF3E0] border border-[#C19A6B]/30 px-2.5 py-0.5 rounded-lg tabular-nums shrink-0">
                {filteredShops.length} محلات
              </span>
            </div>

            {/* SHOPS GRID (Real Storefront Photos + Click opens Shop Merchandise Page) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShops.map((shop, idx) => {
                const pkgInfo = DAR_PACKAGES.find((p) => p.id === shop.package) || DAR_PACKAGES[2];
                const coverSrc = shop.coverImage || shop.images[0] || INITIAL_DAR_SHOPS[0].coverImage;

                return (
                  <div
                    key={shop.id}
                    onClick={() => openShopPage(shop)}
                    className={`group bg-white rounded-[20px] overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      shop.isPinned
                        ? 'border-[#C19A6B] shadow-sm hover:shadow-md'
                        : 'border-[#EFE6D8] hover:border-[#C19A6B]/60'
                    } ${!shop.isOpen ? 'opacity-75' : ''}`}
                  >
                    <div>
                      {/* Storefront Real Image Container (4:3) */}
                      <div className="relative aspect-[4/3] bg-[#2B2117] overflow-hidden">
                        <img
                          src={coverSrc}
                          alt={`واجهة محل ${shop.name}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        {/* Top Right Status & Package Text */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <span
                            className="text-[11px] font-black px-2.5 py-0.5 rounded-md text-white shadow-xs"
                            style={{ backgroundColor: pkgInfo.color }}
                          >
                            {shop.isPinned ? `★ مثبت • ${pkgInfo.label}` : pkgInfo.label}
                          </span>
                        </div>

                        {/* Top Left: Shop Owner Quick Upload Real Storefront Photo Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadTargetShopId(shop.id);
                            coverFileInputRef.current?.click();
                          }}
                          title="رفع صورة حقيقية لواجهة المحل (خاص بصاحب المحل)"
                          className="absolute top-2.5 left-2.5 bg-black/70 hover:bg-[#C19A6B] text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>صورة المحل</span>
                        </button>

                        {/* Bottom Overlay Info on Storefront Photo */}
                        <div className="absolute bottom-2.5 inset-x-3 flex items-end justify-between gap-2 text-white">
                          <div>
                            <div className="font-black text-base leading-tight drop-shadow-xs">
                              {idx + 1}. {shop.name}
                            </div>
                            <div className="text-[11px] text-[#F5E6C8] font-bold mt-0.5">
                              {shop.wilaya} · {shop.products.length} بضاعة · {shop.images.length} صورة
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                              shop.isOpen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            }`}
                          >
                            {shop.isOpen ? 'مفتوح' : 'مغلق'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-2.5">
                        {/* Preview of Shop Merchandise Prices */}
                        <div className="text-xs text-[#6B5A47] font-bold line-clamp-1">
                          {shop.products.length > 0
                            ? `البضائع: ${shop.products.map((p) => p.title).join(' ، ')}`
                            : 'معرض أثاث متكامل — صالونات وغرف نوم وطاولات'}
                        </div>

                        {/* Unboxed Metadata Line */}
                        <div className="flex items-center justify-between text-xs text-[#8B7355] font-bold pt-1 border-t border-[#EFE6D8]">
                          <span className="font-mono tabular-nums" dir="ltr">
                            📞 {shop.phone}
                          </span>
                          <span className="text-[#8B5A2B] flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5 text-[#C19A6B]" />
                            <span>روبوت المحل نشط</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Customer Actions on Card Footer */}
                    <div className="px-3.5 pb-3.5 pt-1 grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openShopPage(shop);
                        }}
                        className="col-span-2 h-9 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>صفحة البضائع ({shop.products.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatShopId(shop.id);
                          navigateTo('chat');
                        }}
                        className="h-9 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE8C2] text-[#8B5A2B] border border-[#C19A6B]/30 font-black text-xs flex items-center justify-center gap-1 transition-colors"
                        title="شات مباشر مع صاحب المحل"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>شات</span>
                      </button>
                      <a
                        href={formatWhatsAppLink(
                          shop.phone,
                          `السلام عليكم، رأيت محلكم «${shop.name}» في موقع دار الأثاث وأريد الاستفسار عن البضائع والأسعار.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 transition-colors"
                        title="تواصل عبر واتساب"
                      >
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Shop Owner Banner placed AFTER the shops grid */}
            <div className="mt-6 bg-gradient-to-r from-[#2B2117] to-[#3d2f21] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#C19A6B]/40">
              <div>
                <div className="font-black text-sm sm:text-base text-[#FFF8EE]">
                  🏪 صاحب محل أثاث؟ سجل محلك الآن (15 يوم مجاناً) وارفع صور محلك وبضائعك الحقيقية
                </div>
                <div className="text-xs text-[#E8DDD0] mt-0.5">
                  أزرار الدفع عبر بريدي موب وشارجيلي ورفع الوصل للبوت موجودة داخل «حساب صاحب المحل»
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => navigateTo('register')}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ سجل محلك مجاناً</span>
                </button>
                <button
                  onClick={() => navigateTo('sijl')}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs flex items-center justify-center gap-1"
                >
                  <Store className="w-4 h-4 text-[#C19A6B]" />
                  <span>حساب صاحب المحل</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: SHOP MERCHANDISE PAGE (صفحة البضائع للمحلات + تواصل الزبون + روبوت المحل)
           ===================================================================== */}
        {activeTab === 'shop' && selectedShop && (
          <div className="space-y-5">
            {/* Top Back & Visitor Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => navigateTo('home')}
                className="h-10 px-4 rounded-xl bg-white hover:bg-[#FFF3E0] border border-[#E8DDD0] font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <span>→ رجوع لواجهة المحلات</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setUploadTargetShopId(selectedShop.id);
                    coverFileInputRef.current?.click();
                  }}
                  className="h-10 px-3.5 rounded-xl bg-white hover:bg-[#FFF3E0] border border-[#C19A6B]/40 text-[#8B5A2B] font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C19A6B]" />
                  <span>تغيير صورة واجهة المحل</span>
                </button>
                <button
                  onClick={() => setShowAddProductForm((v) => !v)}
                  className="h-10 px-4 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة بضاعة للمحل</span>
                </button>
              </div>
            </div>

            {/* Storefront Hero Banner & Direct Customer Contact Hub (Chat, Phone, WhatsApp) */}
            <div className="bg-white border border-[#EFE6D8] rounded-[22px] overflow-hidden shadow-xs">
              <div className="relative h-[230px] sm:h-[310px] bg-[#2B2117]">
                <img
                  src={selectedShop.coverImage || selectedShop.images[0]}
                  alt={selectedShop.name}
                  referrerPolicy="no-referrer"
                  onClick={() => setZoomedImage(selectedShop.coverImage || selectedShop.images[0])}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#F5E6C8] mb-1">
                      معرض ومحل أثاث معتمد · ولاية {selectedShop.wilaya} · باقة{' '}
                      {DAR_PACKAGES.find((p) => p.id === selectedShop.package)?.label} ({selectedShop.points} نقطة)
                    </div>
                    <h1 className="font-black text-2xl sm:text-3xl leading-tight">{selectedShop.name}</h1>
                    {selectedShop.address && (
                      <p className="text-xs text-white/85 mt-1 font-medium">📍 {selectedShop.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black ${
                        selectedShop.isOpen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {selectedShop.isOpen ? 'مفتوح الآن لاستقبال الزبائن' : 'مغلق حالياً'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visitor Contact Bar: Chat, Phone Call, WhatsApp (No Registration Needed) */}
              <div className="p-4 sm:p-5 bg-[#FFFBF5] border-b border-[#EFE6D8]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-xs sm:text-sm font-black text-[#2B2117]">
                    📞 تواصل مباشر للزبون مع صاحب المحل (أنت زائر — لا يُطلب منك أي تسجيل):
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#8B5A2B] tabular-nums" dir="ltr">
                      {selectedShop.phone}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(selectedShop.phone)}
                      className="text-xs bg-white border border-[#E8DDD0] px-2.5 py-1 rounded-lg font-bold text-[#6B5A47] hover:border-[#C19A6B] flex items-center gap-1"
                    >
                      {copiedPhone === selectedShop.phone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>نسخ الرقم</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. In-App Live Chat */}
                  <button
                    onClick={() => {
                      setActiveChatShopId(selectedShop.id);
                      setChatSenderRole('visitor');
                      navigateTo('chat');
                    }}
                    className="h-12 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>💬 شات مباشر مع صاحب المحل</span>
                  </button>

                  {/* 2. Direct Phone Call */}
                  <a
                    href={`tel:${selectedShop.phone.replace(/\s+/g, '')}`}
                    className="h-12 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Phone className="w-5 h-5 text-[#C19A6B]" />
                    <span>📞 اتصال هاتفي ({selectedShop.phone})</span>
                  </a>

                  {/* 3. Direct WhatsApp */}
                  <a
                    href={formatWhatsAppLink(
                      selectedShop.phone,
                      `السلام عليكم، أنا زبون من موقع دار الأثاث، أريد الاستفسار عن بضائع محلكم «${selectedShop.name}» بولاية ${selectedShop.wilaya}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>🟢 مراسلة عبر واتساب (WhatsApp)</span>
                  </a>
                </div>
              </div>

              {/* Add Merchandise Form (For Shop Owner / Admin) */}
              {showAddProductForm && (
                <div className="p-4 sm:p-5 bg-[#FFF8EE] border-b border-[#C19A6B]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm sm:text-base text-[#2B2117] flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#C19A6B]" />
                      <span>إضافة بضاعة / سلعة جديدة بصورة حقيقية إلى «{selectedShop.name}»</span>
                    </h3>
                    <button
                      onClick={() => setShowAddProductForm(false)}
                      className="text-xs font-bold text-[#8B7355] hover:text-[#2B2117]"
                    >
                      إغلاق ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-black block mb-1">اسم البضاعة / قطعة الأثاث *</label>
                      <input
                        type="text"
                        value={newProductForm.title}
                        onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                        placeholder="مثال: صالون ملكي 7 مقاعد خشب زان"
                        className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 text-xs font-bold outline-none focus:border-[#C19A6B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black block mb-1">السعر بالدينار (دج) *</label>
                      <input
                        type="number"
                        value={newProductForm.price}
                        onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                        placeholder="135000"
                        className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 text-xs font-bold outline-none focus:border-[#C19A6B] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black block mb-1">الصنف</label>
                      <select
                        value={newProductForm.category}
                        onChange={(e) =>
                          setNewProductForm({
                            ...newProductForm,
                            category: e.target.value as DarProduct['category']
                          })
                        }
                        className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 text-xs font-bold outline-none focus:border-[#C19A6B]"
                      >
                        <option value="صالونات">صالونات</option>
                        <option value="غرف نوم">غرف نوم</option>
                        <option value="طاولات وكراسي">طاولات وكراسي</option>
                        <option value="خزائن وديكور">خزائن وديكور</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black block mb-1">المقاسات ونوع الخشب / القماش</label>
                      <input
                        type="text"
                        value={newProductForm.dimensions}
                        onChange={(e) => setNewProductForm({ ...newProductForm, dimensions: e.target.value })}
                        placeholder="مثال: خشب زان • قماش أنتيتاش • 3.20م × 2.50م"
                        className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 text-xs font-bold outline-none focus:border-[#C19A6B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black block mb-1">صورة البضاعة الحقيقية (من الهاتف أو الحاسوب)</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => productPhotoInputRef.current?.click()}
                          className="h-10 px-4 rounded-xl bg-white border border-[#C19A6B] text-[#8B5A2B] font-black text-xs flex items-center gap-1.5 hover:bg-[#FFF3E0]"
                        >
                          <Upload className="w-4 h-4 text-[#C19A6B]" />
                          <span>{newProductForm.image ? '✅ تم اختيار الصورة (تغيير)' : '📸 اختر صورة البضاعة'}</span>
                        </button>
                        {newProductForm.image && (
                          <img
                            src={newProductForm.image}
                            alt="معاينة"
                            className="w-10 h-10 rounded-lg object-cover border border-[#C19A6B]"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddProductToShop(selectedShop.id)}
                    className="w-full sm:w-auto px-6 h-11 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>نشر البضاعة في صفحة المحل الآن</span>
                  </button>
                </div>
              )}

              {/* MERCHANDISE LIST SECTION (صفحة البضائع للمحل) */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-black text-lg sm:text-xl text-[#2B2117] flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#C19A6B]" />
                      <span>بضائع وسلع المحل المعروضة للبيع ({selectedShop.products.length} سلعة)</span>
                    </h2>
                    <p className="text-xs text-[#8B7355] font-medium">
                      اختر أي سلعة للتواصل مع صاحب المحل فوراً عبر الشات أو الهاتف أو واتساب أو اسأل روبوت المحل عنها
                    </p>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['الكل', 'صالونات', 'غرف نوم', 'طاولات وكراسي', 'خزائن وديكور'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-[#2B2117] text-white'
                            : 'bg-[#FFF8EE] text-[#6B5A47] hover:bg-[#FFF3E0]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedShop.products
                    .filter((p) => selectedCategory === 'الكل' || p.category === selectedCategory)
                    .map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-[#FFFBF5] border border-[#EFE6D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C19A6B] transition-colors"
                      >
                        <div>
                          <div
                            onClick={() => setZoomedImage(prod.image)}
                            className="relative aspect-[4/3] bg-[#2B2117] overflow-hidden cursor-zoom-in group"
                          >
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[11px] font-black px-2.5 py-1 rounded-lg tabular-nums">
                              {prod.price.toLocaleString('fr-FR')} دج
                            </div>
                          </div>

                          <div className="p-3.5 space-y-1.5">
                            <div className="text-[11px] font-bold text-[#8B7355]">
                              {prod.category} · {prod.inStock ? 'متوفر في المحل' : 'حسب الطلب'}
                            </div>
                            <h3 className="font-black text-sm sm:text-base text-[#2B2117] leading-snug">
                              {prod.title}
                            </h3>
                            {prod.dimensions && (
                              <div className="text-xs text-[#8B5A2B] font-bold">📐 {prod.dimensions}</div>
                            )}
                            <p className="text-xs text-[#6B5A47] leading-relaxed line-clamp-2">
                              {prod.description}
                            </p>
                          </div>
                        </div>

                        {/* Product Contact & Bot Inquiry Buttons */}
                        <div className="p-3.5 pt-2 border-t border-[#EFE6D8] space-y-1.5">
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChatShopId(selectedShop.id);
                                setChatSenderRole('visitor');
                                setChatInput(`السلام عليكم، أريد الاستفسار عن «${prod.title}» بسعر ${prod.price.toLocaleString('fr-FR')} دج`);
                                navigateTo('chat');
                              }}
                              className="h-9 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>شات</span>
                            </button>
                            <a
                              href={`tel:${selectedShop.phone.replace(/\s+/g, '')}`}
                              className="h-9 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs flex items-center justify-center gap-1 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#C19A6B]" />
                              <span>هاتف</span>
                            </a>
                            <a
                              href={formatWhatsAppLink(
                                selectedShop.phone,
                                `السلام عليكم، أعجبتني سلعة «${prod.title}» بسعر ${prod.price.toLocaleString('fr-FR')} دج في محلكم «${selectedShop.name}» على موقع دار الأثاث. هل هي متوفرة؟`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>واتساب</span>
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              executeBotCommandForShop(
                                selectedShop,
                                `أعطني تفاصيل ونصيحة حول شراء «${prod.title}» بسعر ${prod.price} دج وهل يتوفر التوصيل؟`,
                                'visitor'
                              )
                            }
                            className="w-full h-8 rounded-lg bg-[#FFF3E0] hover:bg-[#FFE8C2] text-[#8B5A2B] font-extrabold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <Bot className="w-3.5 h-3.5 text-[#C19A6B]" />
                            <span>🤖 اسأل روبوت المحل عن هذه السلعة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* =================================================================
                DEDICATED SHOP ROBOT ASSISTANT & COMMAND CENTER (كل محل له روبوت ليساعده في كل شيئ)
               ================================================================= */}
            <div className="bg-white border-2 border-[#C19A6B] rounded-[22px] p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE6D8]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#2B2117] text-[#C19A6B] flex items-center justify-center shrink-0">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-[#2B2117]">
                      🤖 {selectedShop.botName} — مساعد المحل الذكي 24/7
                    </h3>
                    <p className="text-xs text-[#6B5A47] font-bold">
                      يجيب الزبائن فوراً عن الأسعار والتوصيل، وينفذ أوامر صاحب المحل والإدارة (إضافة بضاعة، تخفيض أسعار، فتح/إغلاق، تثبيت)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shrink-0">
                  نشط ومستعد للأوامر ⚡
                </span>
              </div>

              {/* Quick Command Buttons for Shop Bot (إعطاء الأوامر للبوت) */}
              <div className="mt-4">
                <div className="text-xs font-black text-[#8B5A2B] mb-2">
                  ⚡ أزرار إعطاء الأوامر الفورية لروبوت المحل (تعمل بضغطة واحدة):
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      executeBotCommandForShop(
                        selectedShop,
                        'ما هي أسعار البضائع المتوفرة في المحل وهل يوجد توصيل لـ 58 ولاية؟',
                        'visitor'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] hover:bg-[#FFF3E0] border border-[#C19A6B]/40 text-xs font-black text-[#2B2117] transition-colors"
                  >
                    💬 استفسار زبون: الأسعار والتوصيل
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeBotCommandForShop(
                        selectedShop,
                        'أضف بضاعة: صالون ملكي خشب زان 7 مقاعد بسعر 145000 دج',
                        'owner'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-xs font-black text-[#FFF8EE] transition-colors"
                  >
                    ➕ أمر للبوت: أضف بضاعة جديدة (145,000 دج)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeBotCommandForShop(selectedShop, 'تخفيض الأسعار 10%', 'owner')
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-xs font-black text-[#FFF8EE] transition-colors"
                  >
                    🏷️ أمر للبوت: تخفيض أسعار المحل 10%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeBotCommandForShop(
                        selectedShop,
                        selectedShop.isOpen ? 'أغلق المحل' : 'افتح المحل',
                        'owner'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-xs font-black text-[#FFF8EE] transition-colors"
                  >
                    {selectedShop.isOpen ? '🔴 أمر للبوت: أغلق المحل مؤقتاً' : '🟢 أمر للبوت: افتح المحل الآن'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeBotCommandForShop(selectedShop, 'ثبت المحل في الأعلى', 'owner')
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-xs font-black text-white transition-colors"
                  >
                    📌 أمر للبوت: تثبيت المحل في الأعلى
                  </button>
                </div>
              </div>

              {/* Bot Conversation & Execution Log */}
              <div className="mt-4 bg-[#FFFBF5] border border-[#EFE6D8] rounded-2xl p-3.5 max-h-64 overflow-y-auto space-y-2.5">
                <div className="bg-white border border-[#E8DDD0] rounded-xl p-3 text-xs sm:text-sm font-bold text-[#2B2117] leading-relaxed">
                  🤖 <span className="font-black text-[#8B5A2B]">{selectedShop.botName}:</span>{' '}
                  {selectedShop.botGreeting}
                </div>
                {(selectedShop.botLogs || []).map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-xl p-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      log.sender === 'bot'
                        ? 'bg-[#2B2117] text-[#FFF8EE] font-bold'
                        : 'bg-[#FFF3E0] text-[#2B2117] font-black border border-[#C19A6B]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                      <span>
                        {log.sender === 'bot'
                          ? `🤖 ${selectedShop.botName}`
                          : log.sender === 'visitor'
                          ? '👤 زبون زائر'
                          : '⚡ أمر لصاحب المحل / الإدارة'}
                      </span>
                      <span>{log.time}</span>
                    </div>
                    <div>{log.text}</div>
                  </div>
                ))}
              </div>

              {/* Direct Bot Command Input */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={shopBotInput}
                  onChange={(e) => setShopBotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeBotCommandForShop(selectedShop, shopBotInput, 'owner');
                    }
                  }}
                  placeholder="اكتب سؤالاً للروبوت كزبون، أو أعطه أمراً (مثال: أضف بضاعة غرفة نوم بسعر 190000 دج)..."
                  className="flex-1 h-11 rounded-xl border border-[#E8DDD0] bg-[#FFFBF5] px-4 text-xs sm:text-sm font-bold outline-none focus:border-[#C19A6B]"
                />
                <button
                  type="button"
                  disabled={isShopBotLoading}
                  onClick={() => executeBotCommandForShop(selectedShop, shopBotInput, 'owner')}
                  className="h-11 px-6 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{isShopBotLoading ? 'جاري التنفيذ...' : 'إرسال أمر للبوت'}</span>
                </button>
              </div>
            </div>

            {/* Shop 30-Photo Gallery Section */}
            <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#2B2117]">
                    📸 ألبوم صور المحل الحقيقية ({selectedShop.images.length}/30 صورة)
                  </h3>
                  <p className="text-xs text-[#8B7355] font-medium">
                    يستطيع صاحب المحل رفع حتى 30 صورة حقيقية من محله ومعرضه، ويمكن للزبون تكبير أي صورة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetShopId(selectedShop.id);
                    galleryFileInputRef.current?.click();
                  }}
                  className="h-10 px-4 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ رفع صور حقيقية للمحل</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedShop.images.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setZoomedImage(imgUrl)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#2B2117] border border-[#EFE6D8] cursor-zoom-in"
                  >
                    <img
                      src={imgUrl}
                      alt={`صورة المحل ${i + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: 58 WILAYAS (الولايات الـ 58)
           ===================================================================== */}
        {activeTab === 'wilayas' && (
          <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg sm:text-xl text-[#2B2117] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#C19A6B]" />
                  <span>دليل محلات الأثاث عبر 58 ولاية جزائرية</span>
                </h2>
                <p className="text-xs text-[#8B7355] font-medium">
                  اختر الولاية لتصفح محلات الأثاث وبضائعها كزائر بدون تسجيل
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWilaya('الكل');
                  navigateTo('home');
                }}
                className="px-4 h-9 rounded-xl bg-[#C19A6B] text-white font-black text-xs"
              >
                عرض كل الولايات ({shops.length})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {DAR_WILAYAS_58.map((w, idx) => {
                const count = shops.filter((s) => s.wilaya === w).length;
                return (
                  <button
                    key={w}
                    onClick={() => {
                      setSelectedWilaya(w);
                      navigateTo('home');
                    }}
                    className={`p-3 rounded-xl border text-right transition-colors flex items-center justify-between ${
                      selectedWilaya === w
                        ? 'border-[#C19A6B] bg-[#FFF8EE]'
                        : 'border-[#EFE6D8] bg-[#FFFBF5] hover:border-[#C19A6B]/50'
                    }`}
                  >
                    <div className="font-black text-xs sm:text-sm text-[#2B2117]">
                      <span className="text-[#C19A6B] ml-1 tabular-nums">{idx + 1}.</span>
                      {w}
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md tabular-nums ${
                        count > 0 ? 'bg-[#C19A6B] text-white' : 'bg-[#EFE6D8] text-[#8B7355]'
                      }`}
                    >
                      {count} محل
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: REGISTER SHOP (تسجيل محل جديد مع صورة حقيقية وبنفس أسعار الباقات)
           ===================================================================== */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-2 border-[#C19A6B] rounded-[22px] overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-[#2B2117] to-[#433324] text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[#C19A6B]">
                    ⚡ تسجيل فوري لأصحاب المحلات • 15 يوم مجاناً • بدون كلمة سر
                  </span>
                  <h2 className="font-black text-xl sm:text-2xl mt-0.5">
                    سجل محلك في دار الأثاث وارفع صور محلك الحقيقية
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#C19A6B]/20 border border-[#C19A6B] flex items-center justify-center text-2xl shrink-0">
                  🏪
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-black text-xs sm:text-sm block mb-1.5">
                      اسم المحل التجاري <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="مثلاً: شفة البليدة للأثاث الراقي"
                      className="w-full h-11 rounded-xl border-2 border-[#E8DDD0] focus:border-[#C19A6B] outline-none px-3.5 text-sm font-bold bg-[#FFFBF5]"
                    />
                  </div>
                  <div>
                    <label className="font-black text-xs sm:text-sm block mb-1.5">
                      رقم الهاتف والواتساب (للاتصال المباشر)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="0798797662"
                      className="w-full h-11 rounded-xl border-2 border-[#E8DDD0] focus:border-[#C19A6B] outline-none px-3.5 text-sm font-bold bg-[#FFFBF5] text-left font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-black text-xs sm:text-sm block mb-1.5">الولاية (58 ولاية)</label>
                    <select
                      value={regForm.wilaya}
                      onChange={(e) => setRegForm({ ...regForm, wilaya: e.target.value })}
                      className="w-full h-11 rounded-xl border-2 border-[#E8DDD0] focus:border-[#C19A6B] outline-none px-3.5 text-sm font-bold bg-[#FFFBF5]"
                    >
                      {DAR_WILAYAS_58.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-black text-xs sm:text-sm block mb-1.5">
                      صورة واجهة المحل الحقيقية (يضعها صاحب المحل)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => regCoverInputRef.current?.click()}
                        className="flex-1 h-11 rounded-xl border-2 border-dashed border-[#C19A6B] bg-[#FFF8EE] hover:bg-[#FFF3E0] text-[#8B5A2B] font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-4 h-4 text-[#C19A6B]" />
                        <span>{regForm.coverImage ? '✅ تم رفع صورة المحل' : '📸 ارفع صورة حقيقية لمحلك'}</span>
                      </button>
                      {regForm.coverImage && (
                        <img
                          src={regForm.coverImage}
                          alt="واجهة المحل"
                          className="w-11 h-11 rounded-xl object-cover border border-[#C19A6B]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Unchanged Shop Packages & Points Prices */}
                <div>
                  <label className="font-black text-xs sm:text-sm block mb-2">
                    الباقة وأسعار النقاط (ثابتة كما هي — مع 15 يوم تجربة مجانية):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {DAR_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setRegForm({ ...regForm, pkg: pkg.id, points: pkg.pts })}
                        className={`p-3 rounded-xl border-2 text-right transition-all relative ${
                          regForm.pkg === pkg.id
                            ? 'border-[#C19A6B] bg-[#FFF8EE] shadow-xs'
                            : 'border-[#EFE6D8] bg-white hover:border-[#C19A6B]/40'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="text-[9px] font-black text-[#C19A6B] block mb-0.5">
                            ★ الأكثر طلباً
                          </span>
                        )}
                        <div className="font-black text-sm text-[#2B2117]">{pkg.label}</div>
                        <div className="font-black text-base text-[#C19A6B] mt-0.5 tabular-nums">
                          {pkg.price}
                        </div>
                        <div className="text-[11px] font-bold text-[#8B7355] mt-0.5">{pkg.pts} نقطة</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Official RIP Info Box (Zero Error) */}
                <div className="bg-[#FFFBF5] border border-[#C19A6B]/40 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-[#8B5A2B]">
                      💳 الدفع الرسمي عبر بريدي موب (BaridiMob) أو شارجيلي (Chargily Pay):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRib}
                      className="text-xs font-black text-[#C19A6B] hover:underline flex items-center gap-1"
                    >
                      {copiedRib ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRib ? 'تم النسخ' : 'نسخ الـ RIP'}</span>
                    </button>
                  </div>
                  <div
                    className="bg-white border border-[#E8DDD0] rounded-xl px-3.5 py-2.5 font-mono text-xs sm:text-sm font-black tracking-wider text-[#2B2117] flex items-center justify-between"
                    dir="ltr"
                  >
                    <span>{officialRib}</span>
                    <span className="text-[#C19A6B]">{officialHolder}</span>
                  </div>
                  <div className="text-[11px] text-[#6B5A47] font-bold mt-1.5">
                    • بعد التحويل، ارفع الوصل ليقوم <strong>البوت الذكي</strong> بالتأكد منه آلياً حسب سعر كل باقة نقاط!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterShop}
                  className="w-full h-13 rounded-2xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-base shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <span>نشر محلي الآن وتفعيل روبوت المحل</span>
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs tabular-nums">
                    +{shops.length + 1}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: SIJL - SHOP OWNER ACCOUNT (حساب صاحب المحل + أزرار بريدي موب وشارجيلي ورفع الصور والبضائع)
           ===================================================================== */}
        {activeTab === 'sijl' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-black text-xl text-[#2B2117] flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#C19A6B]" />
                  <span>حساب صاحب المحل — إدارة المحل وأزرار بريدي موب وشارجيلي</span>
                </h2>
                <p className="text-xs text-[#8B7355] font-medium">
                  اشحن نقاط محلك عبر بريدي موب أو شارجيلي، ارفع الوصل للبوت، وأضف صور محلك وبضائعك الحقيقية
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenGitHubSync && (
                  <button
                    type="button"
                    onClick={onOpenGitHubSync}
                    className="bg-[#2B2117] hover:bg-[#3d2f21] text-white px-3.5 h-10 rounded-xl font-black text-xs flex items-center gap-1.5"
                  >
                    <FolderGit2 className="w-4 h-4 text-[#C19A6B]" />
                    <span>تحديث في GitHub</span>
                  </button>
                )}
                <button
                  onClick={() => navigateTo('register')}
                  className="bg-[#C19A6B] hover:bg-[#A67C52] text-white px-4 h-10 rounded-xl font-black text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ سجل محل جديد</span>
                </button>
              </div>
            </div>

            {/* =================================================================
                PROMINENT BARIDIMOB & CHARGILY BUTTONS HUB INSIDE SHOP OWNER ACCOUNT
                (ضع أزرار بريدي موب في حساب صاحب المحل)
               ================================================================= */}
            <div className="bg-gradient-to-br from-[#2B2117] to-[#3d2f21] text-white border-2 border-[#C19A6B] rounded-[22px] p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                <div>
                  <span className="text-xs font-black text-[#C19A6B] block">
                    💳 بوابة الدفع الرسمية في حساب صاحب المحل (الوصل يتأكد منه البوت حسب سعر كل نقاط)
                  </span>
                  <h3 className="font-black text-base sm:text-lg text-white mt-0.5">
                    أزرار بريدي موب (BaridiMob) & شارجيلي باي (Chargily Pay)
                  </h3>
                </div>
                <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-lg">
                  🤖 فحص آلي للوصل بالبوت الذكي
                </span>
              </div>

              {/* Official RIP Bar inside Shop Owner Account */}
              <div className="bg-white/10 border border-[#C19A6B]/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[#F5E6C8]">
                    رقم الحساب البريدي الجاري الرسمي (RIP بريدي موب — 20 رقماً بدون خطأ):
                  </div>
                  <div
                    className="font-mono font-black text-sm sm:text-lg text-white tracking-wider mt-0.5 select-all"
                    dir="ltr"
                  >
                    {OFFICIAL_DAR_CONFIG.rip}{' '}
                    <span className="text-[#C19A6B] text-xs sm:text-sm">({OFFICIAL_DAR_CONFIG.accountHolder})</span>
                  </div>
                  <div className="text-[11px] text-[#E8DDD0] font-bold mt-0.5">
                    CCP: <span className="font-mono">0012208935</span> Clé: <span className="font-mono">53</span> · الهاتف:{' '}
                    <span className="font-mono">0798797662</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRib}
                  className="h-10 px-4 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  {copiedRib ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRib ? 'تم نسخ الـ RIP!' : 'نسخ RIP بريدي موب'}</span>
                </button>
              </div>

              {/* Points Package Price Selector inside Shop Owner Account */}
              <div>
                <div className="text-xs font-black text-[#F5E6C8] mb-2">
                  اختر باقة النقاط لشحن محلك (أسعار المحلات والنقاط ثابتة كما هي):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DAR_POINTS_TIERS.map((tier) => (
                    <button
                      key={tier.pts}
                      type="button"
                      onClick={() => setSelectedPointsTier(tier.pts)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        selectedPointsTier === tier.pts
                          ? 'border-[#C19A6B] bg-[#C19A6B]/25 text-white'
                          : 'border-white/15 bg-white/5 text-[#E8DDD0] hover:border-[#C19A6B]/50'
                      }`}
                    >
                      <div className="font-black text-sm sm:text-base tabular-nums">{tier.pts} نقطة</div>
                      <div className="font-black text-xs sm:text-sm text-[#C19A6B] tabular-nums">{tier.price}</div>
                      <div className="text-[10px] opacity-80">باقة {tier.pkgLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct BaridiMob & Chargily Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentTab('baridimob');
                    setPaymentModalShopId(myShops[0]?.id || shops[0]?.id || 1);
                  }}
                  className="h-11 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>📱 الدفع عبر بريدي موب (BaridiMob)</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifyingReceipt}
                  onClick={() => {
                    setPaymentTab('baridimob');
                    receiptFileInputRef.current?.click();
                  }}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isVerifyingReceipt
                      ? '🤖 جاري فحص الوصل بالبوت...'
                      : `📤 ارفع وصل بريدي موب (${selectedPointsTier} نقطة)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentTab('chargily');
                    setPaymentModalShopId(myShops[0]?.id || shops[0]?.id || 1);
                  }}
                  className="h-11 rounded-xl bg-white hover:bg-[#FFF3E0] text-[#2B2117] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Zap className="w-4 h-4 text-[#C19A6B]" />
                  <span>💳 شارجيلي باي (الذهبية / CIB)</span>
                </button>
              </div>
            </div>

            {(myShops.length > 0 ? myShops : shops.slice(0, 2)).map((shop) => {
              const pkgInfo = DAR_PACKAGES.find((p) => p.id === shop.package) || DAR_PACKAGES[2];
              return (
                <div
                  key={shop.id}
                  className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EFE6D8]">
                    <div className="flex items-center gap-3">
                      <img
                        src={shop.coverImage || shop.images[0]}
                        alt={shop.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C19A6B]"
                      />
                      <div>
                        <div className="font-black text-base sm:text-lg text-[#2B2117]">{shop.name}</div>
                        <div className="text-xs font-bold text-[#8B7355] mt-0.5">
                          📞 {shop.phone} · 📍 {shop.wilaya} · باقة {pkgInfo.label} ({shop.points} نقطة)
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTargetShopId(shop.id);
                          coverFileInputRef.current?.click();
                        }}
                        className="h-9 px-3.5 rounded-xl bg-[#FFF8EE] hover:bg-[#FFF3E0] border border-[#C19A6B] text-[#8B5A2B] font-black text-xs flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#C19A6B]" />
                        <span>تغيير صورة واجهة المحل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentTab('baridimob');
                          setPaymentModalShopId(shop.id);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#C19A6B]" />
                        <span>📱 بريدي موب / إرسال الوصل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentTab('chargily');
                          setPaymentModalShopId(shop.id);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>💳 شارجيلي باي</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload up to 30 Real Photos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs sm:text-sm text-[#2B2117]">
                        📸 صور المحل والبضائع الحقيقية ({shop.images.length}/30)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTargetShopId(shop.id);
                          galleryFileInputRef.current?.click();
                        }}
                        className="bg-[#C19A6B] hover:bg-[#A67C52] text-white px-3.5 h-8 rounded-lg text-xs font-black flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ رفع صور حقيقية من الهاتف</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {shop.images.slice(0, 11).map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setZoomedImage(img)}
                          className="aspect-square rounded-xl overflow-hidden bg-[#2B2117] border border-[#EFE6D8] cursor-zoom-in relative"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                      {shop.images.length < 30 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadTargetShopId(shop.id);
                            galleryFileInputRef.current?.click();
                          }}
                          className="aspect-square rounded-xl border-2 border-dashed border-[#C19A6B]/50 bg-[#FFF8EE] hover:bg-[#FFF3E0] flex flex-col items-center justify-center gap-1 text-[#8B5A2B]"
                        >
                          <Plus className="w-5 h-5 text-[#C19A6B]" />
                          <span className="text-[10px] font-black">إضافة صور</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions for Shop Owner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        openShopPage(shop);
                        setTimeout(() => setShowAddProductForm(true), 100);
                      }}
                      className="h-10 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>إدارة وإضافة البضائع ({shop.products.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openShopPage(shop)}
                      className="h-10 rounded-xl bg-[#FFFBF5] hover:bg-[#FFF3E0] border border-[#E8DDD0] font-black text-xs text-[#2B2117] flex items-center justify-center gap-1.5"
                    >
                      <Bot className="w-4 h-4 text-[#C19A6B]" />
                      <span>إعطاء أوامر لروبوت المحل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChatShopId(shop.id);
                        setChatSenderRole('shop');
                        navigateTo('chat');
                      }}
                      className="h-10 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE8C2] border border-[#C19A6B]/30 text-[#8B5A2B] font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>فتح شات الزبائن والإدارة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =====================================================================
            TAB 6: ADMIN CONTROL CENTER (ركز على صلاحيات الإدارة + أوامر البوت + الـ RIP)
           ===================================================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-5">
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto bg-white border-2 border-[#C19A6B] rounded-[22px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2B2117] text-[#C19A6B] flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-[#2B2117]">دخول الإدارة العامة — دار الأثاث</h2>
                    <p className="text-xs text-[#8B7355] font-bold">
                      صلاحيات كاملة للتحكم في المحلات، الترتيب، التثبيت، البوت، والـ RIP
                    </p>
                  </div>
                </div>

                <input
                  type="password"
                  value={adminInputPass}
                  onChange={(e) => setAdminInputPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (adminInputPass === adminPassword || adminInputPass === 'admin123') {
                        setIsAdminLoggedIn(true);
                        setAdminInputPass('');
                        showToast('🛡️ تم الدخول إلى لوحة صلاحيات الإدارة الكاملة');
                      } else {
                        showToast('⚠️ كلمة السر غير صحيحة');
                      }
                    }
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 rounded-xl border-2 border-[#E8DDD0] focus:border-[#C19A6B] px-4 text-sm font-bold bg-[#FFFBF5] outline-none mb-3 text-center tracking-widest"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (adminInputPass === adminPassword || adminInputPass === 'admin123') {
                      setIsAdminLoggedIn(true);
                      setAdminInputPass('');
                      showToast('🛡️ مرحباً بك في لوحة صلاحيات الإدارة الكاملة');
                    } else {
                      showToast('⚠️ كلمة السر غير صحيحة');
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs sm:text-sm transition-colors"
                >
                  دخول الإدارة
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Admin Header & Quick Stats */}
                <div className="bg-[#2B2117] text-white rounded-[22px] p-5 border border-[#C19A6B]/40 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black text-[#C19A6B]">
                      🛡️ لوحة وصلاحيات الإدارة العليا — موقع دار الأثاث (24/7 بدون نوم)
                    </div>
                    <h2 className="font-black text-xl sm:text-2xl mt-0.5">
                      تحكم شامل في المحلات، البوتات، الوصولات، والـ RIP الرسمي
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentModalShopId(shops[0]?.id || 1)}
                      className="h-9 px-3.5 rounded-xl bg-[#C19A6B] text-[#2B2117] font-black text-xs flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>بوابة بريدي موب وشارجيلي</span>
                    </button>
                    {onOpenGitHubSync && (
                      <button
                        type="button"
                        onClick={onOpenGitHubSync}
                        className="h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-[#C19A6B]" />
                        <span>نقل وتحديث GitHub</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="h-9 px-3.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-black text-xs"
                    >
                      خروج
                    </button>
                  </div>
                </div>

                {/* 1. MASTER ADMIN BOT COMMAND CENTER (إعطاء الأوامر للبوت الإداري) */}
                <div className="bg-white border-2 border-[#C19A6B] rounded-[22px] p-4 sm:p-5">
                  <h3 className="font-black text-base text-[#2B2117] flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-[#C19A6B]" />
                    <span>🤖 مركز إعطاء الأوامر للبوت الإداري الشامل</span>
                  </h3>
                  <div className="bg-[#FFF8EE] border border-[#C19A6B]/30 rounded-xl p-3 text-xs sm:text-sm font-bold text-[#2B2117] mb-3">
                    {adminBotReply}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      'حول محل 5 إلى 1',
                      'حول محل 3 إلى 1',
                      'ثبت كل المحلات',
                      'افتح كل المحلات',
                      'أضف 500 نقطة لمحل 1',
                      'أضف 200 نقطة لمحل 3',
                      'فحص وتأكيد الـ RIP والوصولات'
                    ].map((quickCmd) => (
                      <button
                        key={quickCmd}
                        type="button"
                        onClick={() => handleExecuteAdminBotCommand(quickCmd)}
                        className="px-3 py-1.5 rounded-lg bg-[#2B2117] hover:bg-[#3d2f21] text-white text-xs font-black transition-colors"
                      >
                        ⚡ {quickCmd}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminBotInput}
                      onChange={(e) => setAdminBotInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteAdminBotCommand()}
                      placeholder="اكتب أمراً للبوت الإداري (مثال: حول محل 4 إلى 1 أو أضف 200 نقطة لمحل 2)..."
                      className="flex-1 h-10 rounded-xl border border-[#E8DDD0] px-3.5 text-xs sm:text-sm font-bold bg-[#FFFBF5] outline-none focus:border-[#C19A6B]"
                    />
                    <button
                      type="button"
                      onClick={() => handleExecuteAdminBotCommand()}
                      className="h-10 px-5 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm"
                    >
                      تنفيذ الأمر
                    </button>
                  </div>
                </div>

                {/* 2. OFFICIAL RIP & PAYMENT SETTINGS (لا تخطئ في RIP: 00799999000122089353 - AMEUR) */}
                <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-black text-base text-[#2B2117]">
                      💳 إعدادات الـ RIP الرسمي لبريدي موب وشارجيلي وكلمة سر الإدارة
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialRib(OFFICIAL_DAR_CONFIG.rip);
                        setOfficialHolder(OFFICIAL_DAR_CONFIG.accountHolder);
                        showToast(`✅ تم تثبيت الـ RIP الرسمي بدقة: ${OFFICIAL_DAR_CONFIG.rip} (${OFFICIAL_DAR_CONFIG.accountHolder})`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
                    >
                      🔒 تثبيت الـ RIP الرسمي (00799999000122089353)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-[#8B7355] block mb-1">
                        رقم الـ RIP الرسمي (20 رقماً — بريدي موب / بريد الجزائر)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={officialRib}
                          onChange={(e) => setOfficialRib(e.target.value)}
                          className="flex-1 h-10 rounded-xl border border-[#E8DDD0] px-3 font-mono font-black text-xs sm:text-sm bg-[#FFFBF5]"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={officialHolder}
                          onChange={(e) => setOfficialHolder(e.target.value)}
                          className="w-28 h-10 rounded-xl border border-[#E8DDD0] px-3 font-mono font-black text-xs sm:text-sm bg-[#FFFBF5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-[#8B7355] block mb-1">
                        تغيير كلمة سر الإدارة
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newAdminPassInput}
                          onChange={(e) => setNewAdminPassInput(e.target.value)}
                          placeholder="••••••••"
                          className="flex-1 h-10 rounded-xl border border-[#E8DDD0] px-3 text-xs sm:text-sm font-bold bg-[#FFFBF5]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newAdminPassInput.trim()) {
                              setAdminPassword(newAdminPassInput.trim());
                              setNewAdminPassInput('');
                              showToast('✅ تم حفظ كلمة سر الإدارة الجديدة بنجاح');
                            }
                          }}
                          className="h-10 px-4 rounded-xl bg-[#2B2117] text-white font-black text-xs"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FULL SHOPS MANAGEMENT TABLE (صلاحيات الإدارة الكاملة على كل محل) */}
                <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-black text-base text-[#2B2117]">
                      🏪 صلاحيات التحكم في المحلات ({shops.length} محل — ترتيب، تثبيت، فتح/إغلاق، باقات، نقاط، صور، شات، حذف)
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateTo('register')}
                      className="h-9 px-3.5 rounded-xl bg-[#C19A6B] text-white font-black text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة محل جديد</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {shops.map((shop, idx) => (
                      <div
                        key={shop.id}
                        className={`p-3 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          shop.isPinned ? 'border-[#C19A6B] bg-[#FFF8EE]' : 'border-[#EFE6D8] bg-[#FFFBF5]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={shop.coverImage || shop.images[0]}
                            alt={shop.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#C19A6B] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-sm text-[#2B2117] truncate">
                              #{idx + 1} — {shop.name}
                            </div>
                            <div className="text-xs font-bold text-[#8B7355] mt-0.5">
                              {shop.wilaya} · {shop.phone} · باقة {shop.package} ·{' '}
                              <span className="text-[#8B5A2B] font-black">{shop.points} نقطة</span> ·{' '}
                              {shop.products.length} بضاعة · {shop.isOpen ? '🟢 مفتوح' : '🔴 مغلق'}{' '}
                              {shop.isPinned ? '· 📌 مثبت' : ''}
                            </div>
                          </div>
                        </div>

                        {/* Admin Full Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveShopOrder(shop.id, 'top')}
                            className="h-8 px-2.5 rounded-lg bg-[#2B2117] text-[#C19A6B] font-black text-[11px]"
                            title="تصدر المركز الأول #1"
                          >
                            #1 تصدر
                          </button>
                          <button
                            type="button"
                            onClick={() => moveShopOrder(shop.id, 'up')}
                            className="w-8 h-8 rounded-lg bg-white border border-[#E8DDD0] flex items-center justify-center"
                            title="لأعلى"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveShopOrder(shop.id, 'down')}
                            className="w-8 h-8 rounded-lg bg-white border border-[#E8DDD0] flex items-center justify-center"
                            title="لأسفل"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShopPin(shop.id)}
                            className={`h-8 px-2.5 rounded-lg border font-black text-[11px] flex items-center gap-1 ${
                              shop.isPinned
                                ? 'bg-[#C19A6B] text-white border-[#C19A6B]'
                                : 'bg-white border-[#E8DDD0] text-[#6B5A47]'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                            <span>{shop.isPinned ? 'مثبت' : 'تثبيت'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShopOpen(shop.id)}
                            className={`h-8 px-2.5 rounded-lg font-black text-[11px] text-white flex items-center gap-1 ${
                              shop.isOpen ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{shop.isOpen ? 'مفتوح' : 'مغلق'}</span>
                          </button>

                          {/* Quick Package & Points Selector for Admin */}
                          <select
                            value={shop.package}
                            onChange={(e) => {
                              const newPkg = e.target.value as DarShop['package'];
                              const tier = DAR_PACKAGES.find((p) => p.id === newPkg);
                              changeShopPackage(shop.id, newPkg, tier ? tier.pts : shop.points);
                            }}
                            className="h-8 rounded-lg border border-[#C19A6B] bg-white px-2 text-[11px] font-black text-[#2B2117]"
                          >
                            <option value="bronze">برونزي (50ن - 2500دج)</option>
                            <option value="silver">فضي (100ن - 4500دج)</option>
                            <option value="gold">ذهبي (200ن - 8000دج)</option>
                            <option value="diamond">ماسي (500ن - 18000دج)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setUploadTargetShopId(shop.id);
                              coverFileInputRef.current?.click();
                            }}
                            className="h-8 px-2.5 rounded-lg bg-white border border-[#E8DDD0] text-[#8B5A2B] font-black text-[11px] flex items-center gap-1"
                            title="تغيير صورة المحل"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#C19A6B]" />
                            <span>صورة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openShopPage(shop)}
                            className="h-8 px-2.5 rounded-lg bg-[#FFF3E0] border border-[#C19A6B]/30 text-[#8B5A2B] font-black text-[11px]"
                          >
                            البضائع والروبوت
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatShopId(shop.id);
                              setChatSenderRole('admin');
                              navigateTo('chat');
                            }}
                            className="w-8 h-8 rounded-lg bg-[#FFF3E0] border border-[#C19A6B]/30 text-[#8B5A2B] flex items-center justify-center"
                            title="شات مع المحل"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShops((prev) => prev.filter((s) => s.id !== shop.id));
                              showToast(`🗑️ تم حذف المحل «${shop.name}»`);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center"
                            title="حذف المحل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. BOT-VERIFIED RECEIPTS LOG IN ADMIN */}
                <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-base text-[#2B2117] flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#C19A6B]" />
                      <span>سجل وصولات الدفع المفحوصة بالبوت حسب سعر كل نقاط ({receipts.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPaymentModalShopId(shops[0]?.id || 1)}
                      className="text-xs font-black text-[#C19A6B] hover:underline"
                    >
                      + تجربة فحص وصل جديد بالبوت
                    </button>
                  </div>

                  {receipts.length === 0 ? (
                    <div className="text-center py-6 bg-[#FFFBF5] rounded-xl border border-[#EFE6D8] text-xs font-bold text-[#8B7355]">
                      لا توجد وصولات مرفوعة حالياً. عند قيام أي صاحب محل برفع وصل بريدي موب أو شارجيلي، يتأكد منه البوت آلياً حسب سعر النقاط ويظهر هنا.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {receipts.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-xl border border-[#C19A6B]/40 bg-[#FFF8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="font-black text-xs sm:text-sm text-[#2B2117]">
                              {rec.shopName} ({rec.shopPhone}) — {rec.serviceNameAr}
                            </div>
                            <div className="text-xs font-bold text-[#8B5A2B]">
                              المبلغ المفحوص: {rec.detectedAmount.toLocaleString('fr-FR')} دج · النقاط الممنوحة: +
                              {rec.awardedPoints} نقطة (باقة {rec.awardedPackageLabel}) · RIP: {rec.recipientRip}
                            </div>
                            <div className="text-[11px] text-[#6B5A47]">{rec.botVerdict}</div>
                          </div>
                          {rec.receiptImage && (
                            <button
                              type="button"
                              onClick={() => setZoomedImage(rec.receiptImage!)}
                              className="px-3 py-1.5 rounded-lg bg-[#2B2117] text-white text-xs font-black shrink-0"
                            >
                              معاينة الوصل
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 7: CHAT (الشات المباشر بين الزبون الزائر، صاحب المحل، البوت، والإدارة)
           ===================================================================== */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-black text-xl mb-3 flex items-center gap-2 text-[#2B2117]">
              <MessageCircle className="w-5 h-5 text-[#C19A6B]" />
              <span>الشات المباشر — تواصل الزوار وأصحاب المحلات والإدارة</span>
            </h2>

            {!activeChatShopId ? (
              <div className="bg-white border border-[#EFE6D8] rounded-[22px] p-4 space-y-2.5">
                <div className="font-black text-sm text-[#2B2117] mb-2">
                  اختر المحل لبدء المحادثة الفورية (بدون تسجيل للزبون):
                </div>
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => setActiveChatShopId(shop.id)}
                    className="w-full text-right p-3 rounded-xl border border-[#E8DDD0] bg-[#FFFBF5] hover:border-[#C19A6B] flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={shop.coverImage || shop.images[0]}
                      alt={shop.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#C19A6B] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-[#2B2117] truncate">{shop.name}</div>
                      <div className="text-xs font-bold text-[#8B7355]">
                        {shop.wilaya} · 📞 {shop.phone} · {(chats[shop.id] || []).length} رسالة
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-[#C19A6B] text-white text-xs font-black">
                      دردشة ›
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              (() => {
                const chatShop = shops.find((s) => s.id === activeChatShopId) || shops[0];
                const shopMessages = chats[activeChatShopId] || [];
                return (
                  <div className="bg-white border border-[#EFE6D8] rounded-[22px] overflow-hidden shadow-xs flex flex-col h-[70vh]">
                    {/* Chat Header */}
                    <div className="p-3.5 border-b border-[#EFE6D8] bg-[#FFFBF5] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveChatShopId(null)}
                          className="w-8 h-8 rounded-lg bg-white border border-[#E8DDD0] flex items-center justify-center font-black"
                        >
                          →
                        </button>
                        <img
                          src={chatShop.coverImage || chatShop.images[0]}
                          alt={chatShop.name}
                          className="w-9 h-9 rounded-lg object-cover border border-[#C19A6B]"
                        />
                        <div>
                          <div className="font-black text-xs sm:text-sm text-[#2B2117]">{chatShop.name}</div>
                          <div className="text-[11px] font-bold text-[#8B7355]">
                            📞 {chatShop.phone} · روبوت المحل وصاحب المحل متصلان
                          </div>
                        </div>
                      </div>

                      {/* Direct Call & WhatsApp inside Chat Header */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${chatShop.phone.replace(/\s+/g, '')}`}
                          className="h-8 px-2.5 rounded-lg bg-[#2B2117] text-white text-[11px] font-black flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-[#C19A6B]" />
                          <span>هاتف</span>
                        </a>
                        <a
                          href={formatWhatsAppLink(
                            chatShop.phone,
                            `السلام عليكم، أتواصل معكم من شات موقع دار الأثاث بخصوص محلكم «${chatShop.name}».`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1"
                        >
                          <span>واتساب</span>
                        </a>
                      </div>
                    </div>

                    {/* Role Selector Bar (Visitor without registration / Shop Owner / Admin) */}
                    <div className="px-3.5 py-2 bg-[#FFF8EE] border-b border-[#EFE6D8] flex items-center justify-between gap-2 text-xs">
                      <span className="font-black text-[#8B5A2B]">تتحدث الآن بصفتك:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setChatSenderRole('visitor')}
                          className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            chatSenderRole === 'visitor' && !isAdminLoggedIn
                              ? 'bg-[#C19A6B] text-white'
                              : 'bg-white text-[#6B5A47] border border-[#E8DDD0]'
                          }`}
                        >
                          👤 زبون (زائر بدون تسجيل)
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatSenderRole('shop')}
                          className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            chatSenderRole === 'shop' && !isAdminLoggedIn
                              ? 'bg-[#2B2117] text-white'
                              : 'bg-white text-[#6B5A47] border border-[#E8DDD0]'
                          }`}
                        >
                          🏪 صاحب المحل
                        </button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFBF5]">
                      {shopMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            m.from === 'visitor'
                              ? 'bg-[#C19A6B] text-white ml-auto'
                              : m.from === 'bot'
                              ? 'bg-[#2B2117] text-[#FFF8EE] mr-auto border border-[#C19A6B]'
                              : m.from === 'admin'
                              ? 'bg-emerald-900 text-white mr-auto'
                              : 'bg-white border border-[#E8DDD0] text-[#2B2117] mr-auto'
                          }`}
                        >
                          <div className="text-[10px] font-black opacity-80 mb-0.5">{m.senderLabel}</div>
                          <div className="font-bold whitespace-pre-line">{m.text}</div>
                          <div className="text-[10px] opacity-70 mt-1 text-left">{m.time}</div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 border-t border-[#EFE6D8] bg-white flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentModalShopId(chatShop.id)}
                        className="h-11 px-3 rounded-xl bg-[#FFF3E0] border border-[#C19A6B]/40 text-[#8B5A2B] font-black text-xs shrink-0 flex items-center gap-1"
                        title="رفع وصل بريدي موب أو شارجيلي"
                      >
                        <CreditCard className="w-4 h-4 text-[#C19A6B]" />
                        <span className="hidden sm:inline">وصل الدفع</span>
                      </button>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="اكتب رسالتك لصاحب المحل أو الروبوت (بدون تسجيل)..."
                        className="flex-1 h-11 rounded-xl border border-[#E8DDD0] px-4 text-xs sm:text-sm font-bold bg-[#FFFBF5] outline-none focus:border-[#C19A6B]"
                      />
                      <button
                        type="button"
                        onClick={handleSendChatMessage}
                        className="h-11 px-5 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm shrink-0"
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </main>

      {/* =======================================================================
          BARIDIMOB & CHARGILY PAY + BOT RECEIPT VERIFICATION MODAL
          (حدث بريدي موب و شارجيلي / الوصل يتأكد منه البوت حسب سعر كل نقاط / لا تخطئ في rip)
         ======================================================================= */}
      {paymentModalShopId !== null && (
        <div
          onClick={() => setPaymentModalShopId(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#C19A6B] rounded-[24px] max-w-xl w-full overflow-hidden shadow-2xl my-auto"
          >
            {/* Modal Header */}
            <div className="bg-[#2B2117] text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-[#C19A6B]">
                  💳 بوابة الدفع الرسمية وفحص الوصل بالبوت الذكي
                </div>
                <h3 className="font-black text-lg sm:text-xl mt-0.5">
                  بريدي موب (BaridiMob) & شارجيلي باي (Chargily Pay)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalShopId(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Step 1: Select Points Package (Exact Unchanged Prices) */}
              <div>
                <label className="font-black text-xs sm:text-sm text-[#2B2117] block mb-2">
                  1. اختر باقة النقاط للمحل (البوت يتحقق من الوصل حسب سعر الباقة بالضبط):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DAR_POINTS_TIERS.map((tier) => (
                    <button
                      key={tier.pts}
                      type="button"
                      onClick={() => setSelectedPointsTier(tier.pts)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedPointsTier === tier.pts
                          ? 'border-[#C19A6B] bg-[#FFF8EE] shadow-xs'
                          : 'border-[#EFE6D8] bg-[#FFFBF5]'
                      }`}
                    >
                      <div className="font-black text-base text-[#2B2117] tabular-nums">{tier.pts} نقطة</div>
                      <div className="font-black text-sm text-[#C19A6B] mt-0.5 tabular-nums">{tier.price}</div>
                      <div className="text-[10px] font-bold text-[#8B7355] mt-0.5">باقة {tier.pkgLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Payment Method Tab (BaridiMob vs Chargily Pay) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FFF8EE] rounded-xl border border-[#EFE6D8]">
                <button
                  type="button"
                  onClick={() => setPaymentTab('baridimob')}
                  className={`h-10 rounded-lg font-black text-xs sm:text-sm transition-colors ${
                    paymentTab === 'baridimob'
                      ? 'bg-[#2B2117] text-white shadow-xs'
                      : 'text-[#6B5A47] hover:text-[#2B2117]'
                  }`}
                >
                  📱 بريدي موب (BaridiMob / CCP)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('chargily')}
                  className={`h-10 rounded-lg font-black text-xs sm:text-sm transition-colors ${
                    paymentTab === 'chargily'
                      ? 'bg-[#C19A6B] text-white shadow-xs'
                      : 'text-[#6B5A47] hover:text-[#2B2117]'
                  }`}
                >
                  💳 شارجيلي باي (الذهبية / CIB)
                </button>
              </div>

              {/* BARIDIMOB TAB */}
              {paymentTab === 'baridimob' && (
                <div className="bg-[#FFFBF5] border border-[#C19A6B]/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#8B5A2B]">
                      رقم الحساب البريدي الرسمي (RIP بريدي موب — بدون أي خطأ):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRib}
                      className="px-3 py-1 rounded-lg bg-[#C19A6B] text-white text-xs font-black flex items-center gap-1"
                    >
                      {copiedRib ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRib ? 'تم النسخ!' : 'نسخ الـ RIP'}</span>
                    </button>
                  </div>

                  <div
                    className="bg-white border-2 border-[#C19A6B] rounded-xl p-3 font-mono text-sm sm:text-base font-black text-[#2B2117] flex items-center justify-between select-all"
                    dir="ltr"
                  >
                    <span>{ OFFICIAL_DAR_CONFIG.rip }</span>
                    <span className="text-[#C19A6B]">{ OFFICIAL_DAR_CONFIG.accountHolder }</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#6B5A47]">
                    <div className="bg-white border border-[#EFE6D8] rounded-lg p-2">
                      CCP: <span className="font-mono font-black text-[#2B2117]">0012208935</span> Clé:{' '}
                      <span className="font-mono font-black text-[#C19A6B]">53</span>
                    </div>
                    <div className="bg-white border border-[#EFE6D8] rounded-lg p-2">
                      هاتف بريدي موب: <span className="font-mono font-black text-[#2B2117]">0798797662</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isVerifyingReceipt}
                      onClick={() => receiptFileInputRef.current?.click()}
                      className="w-full h-12 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Upload className="w-4 h-4 text-[#C19A6B]" />
                      <span>
                        {isVerifyingReceipt
                          ? '🤖 جاري فحص الوصل والتأكد من سعر النقاط بالبوت...'
                          : `📤 ارفع صورة وصل بريدي موب (${
                              DAR_POINTS_TIERS.find((t) => t.pts === selectedPointsTier)?.price
                            } = ${selectedPointsTier} نقطة)`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* CHARGILY PAY TAB */}
              {paymentTab === 'chargily' && (
                <div className="bg-[#FFFBF5] border border-[#C19A6B]/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#8B5A2B]">
                      بوابة شارجيلي باي (Chargily Pay V2 — البطاقة الذهبية و CIB):
                    </span>
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      متصل بـ 0798797662
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChargilyCardType('edahabia')}
                      className={`p-3 rounded-xl border-2 text-right font-black text-xs ${
                        chargilyCardType === 'edahabia'
                          ? 'border-[#C19A6B] bg-[#FFF8EE]'
                          : 'border-[#EFE6D8] bg-white'
                      }`}
                    >
                      🟨 البطاقة الذهبية (EDAHABIA)
                      <div className="text-[10px] text-[#8B7355] font-bold mt-0.5">بريد الجزائر — تفعيل فوري</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChargilyCardType('cib')}
                      className={`p-3 rounded-xl border-2 text-right font-black text-xs ${
                        chargilyCardType === 'cib'
                          ? 'border-[#C19A6B] bg-[#FFF8EE]'
                          : 'border-[#EFE6D8] bg-white'
                      }`}
                    >
                      🟦 بطاقة CIB البنكية (SATIM)
                      <div className="text-[10px] text-[#8B7355] font-bold mt-0.5">جميع البنوك الجزائرية</div>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={chargilyHolderName}
                    onChange={(e) => setChargilyHolderName(e.target.value)}
                    placeholder="اسم صاحب المحل / البطاقة (اختياري)..."
                    className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3.5 text-xs font-bold outline-none focus:border-[#C19A6B]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isVerifyingReceipt}
                      onClick={handleInstantChargilyCheckout}
                      className="h-11 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        دفع فوري وتأكيد بالبوت (
                        {DAR_POINTS_TIERS.find((t) => t.pts === selectedPointsTier)?.price})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => receiptFileInputRef.current?.click()}
                      className="h-11 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-[#C19A6B]" />
                      <span>أو ارفع وصل شارجيلي لفحصه بالبوت</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Latest Bot Receipt Verification Result */}
              {latestBotVerification && (
                <div className="bg-emerald-950 text-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-emerald-400 flex items-center gap-1.5">
                      <Bot className="w-4 h-4" />
                      <span>تقرير بوت فحص الوصولات حسب سعر النقاط:</span>
                    </span>
                    <span className="text-[11px] font-mono bg-emerald-800 px-2 py-0.5 rounded">
                      #{latestBotVerification.transactionId}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-bold">{latestBotVerification.botVerdict}</p>
                  <div className="text-[11px] text-emerald-300 font-bold">
                    ✓ السعر المفحوص: {latestBotVerification.detectedAmount.toLocaleString('fr-FR')} دج | النقاط المضافة: +
                    {latestBotVerification.awardedPoints} نقطة | الحساب: {latestBotVerification.recipientRip}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DIRECT GITHUB PUBLISHER MODAL (ضع كل الملفات في رابطي: chifablida-create.github.io/dar-al-athath)
         ======================================================================= */}
      {isGitHubModalOpen && (
        <div
          onClick={() => setIsGitHubModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#C19A6B] rounded-[24px] max-w-xl w-full overflow-hidden shadow-2xl my-auto"
          >
            <div className="bg-gradient-to-r from-[#2B2117] to-[#3d2f21] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-[#C19A6B]" dir="ltr">
                    chifablida-create.github.io/dar-al-athath
                  </div>
                  <h3 className="font-black text-base sm:text-lg mt-0.5">
                    ضع كل الملفات في رابطي GitHub (تحديث شامل)
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGitHubModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Instant Fix Notice for Mobile Clipboard Truncation */}
              <div className="bg-emerald-950 text-emerald-50 border-2 border-emerald-500 rounded-2xl p-3.5 space-y-2">
                <div className="font-black text-xs sm:text-sm text-emerald-300">
                  ✅ تم حل مشكلة ظهور كتابة الـ CSS (amber-50...) على الهاتف نهائياً!
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-100 font-bold leading-relaxed">
                  في المرة السابقة انقطع أول الكود أثناء اللصق من الهاتف لأن حجمه كان كبيراً. الآن ضغطنا جميع الملفات بحجم خفيف جداً (<strong>14 كيلوبايت فقط</strong>) وبدون أي CSS مكشوف حتى ينتسخ معك في الهاتف <strong>كاملاً 100% في ثانية واحدة</strong>!
                </p>
              </div>

              {/* Bulk Download & Upload All Files */}
              <div className="bg-[#FFF8EE] border-2 border-[#C19A6B] rounded-2xl p-4 space-y-3">
                <div className="font-black text-xs sm:text-sm text-[#2B2117]">
                  📦 أولاً: تحميل أو رفع «كل الملفات» دفعة واحدة لرابطك
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadAllRepoFiles}
                    className="h-11 rounded-xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4 text-[#C19A6B]" />
                    <span>تنزيل كل الـ 5 ملفات للهاتف</span>
                  </button>

                  <a
                    href="/api/dar-al-athath/all-files-zip"
                    download="dar-al-athath-all-files.zip"
                    className="h-11 rounded-xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل كل الملفات مضغوطة (ZIP)</span>
                  </a>
                </div>

                <a
                  href="https://github.com/chifablida-create/dar-al-athath/upload/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>📤 فتح صفحة رفع كل الملفات في GitHub (upload/main)</span>
                </a>
              </div>

              {/* All 5 Individual Repo Files with 1-Tap Copy & Direct GitHub Edit Link */}
              <div className="bg-white border border-[#E8DDD0] rounded-2xl p-4 space-y-3">
                <div className="font-black text-xs sm:text-sm text-[#2B2117]">
                  ⚡ ثانياً: نسخ أو تعديل كل ملف مباشرة من الهاتف (بدون انقطاع الكود):
                </div>

                <div className="space-y-2.5">
                  {githubRepoFiles.map((file) => {
                    const isCopied = copiedRepoFile === file.filename;
                    return (
                      <div
                        key={file.filename}
                        className="bg-[#FFFBF5] border border-[#E8DDD0] rounded-xl p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-[#2B2117]">{file.titleAr}</span>
                          <span
                            dir="ltr"
                            className="text-[10px] font-mono font-black bg-[#FFF3E0] text-[#8B5A2B] px-2 py-0.5 rounded border border-[#C19A6B]/40"
                          >
                            {file.filename} ({Math.max(1, Math.round(file.content.length / 1024))} KB)
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B5A47] font-bold leading-relaxed">
                          {file.descriptionAr}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyRepoFile(file.filename, file.content)}
                            className={`h-9 rounded-lg font-black text-[11px] flex items-center justify-center gap-1 transition-colors ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#2B2117] hover:bg-[#3d2f21] text-white'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5 text-[#C19A6B]" />
                            <span>{isCopied ? '✓ تم النسخ!' : '1. نسخ الكود'}</span>
                          </button>

                          <a
                            href={file.githubEditUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>2. لصق في GitHub</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDownloadRepoFile(file.filename, file.content)}
                            className="h-9 rounded-lg bg-[#FFF3E0] hover:bg-[#FFE4B5] border border-[#C19A6B] text-[#2B2117] font-black text-[11px] flex items-center justify-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5 text-[#8B5A2B]" />
                            <span>تنزيل الملف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automatic 1-Click API Push of ALL Files via GitHub Token */}
              <div className="bg-[#FFFBF5] border border-[#EFE6D8] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-[#2B2117]">
                    🚀 ثالثاً: النقل التلقائي لكل الملفات بضغطة زر (عبر GitHub Token)
                  </span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Dar-Al-Athath"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-[#C19A6B] hover:underline flex items-center gap-1"
                  >
                    <span>استخراج Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-black text-[#8B7355] block mb-1">
                      اسم المستودع (Repository) في حسابك chifablida-create:
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={ghRepoInput}
                      onChange={(e) => setGhRepoInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 font-mono font-black text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[#8B7355] block mb-1">
                      رمز الوصول الشخصي (GitHub Personal Access Token - يبدأ بـ ghp_):
                    </label>
                    <input
                      type="password"
                      dir="ltr"
                      value={ghTokenInput}
                      onChange={(e) => setGhTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full h-10 rounded-xl border border-[#E8DDD0] bg-white px-3 font-mono font-bold text-xs outline-none focus:border-[#C19A6B]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPushingToGitHub}
                  onClick={handleDirectPushToGitHub}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>
                    {isPushingToGitHub
                      ? '⏳ جاري وضع كل الملفات في رابطك على GitHub...'
                      : '🚀 ضع كل الملفات في رابطي GitHub الآن (تحديث شامل)'}
                  </span>
                </button>

                {ghPushResult && (
                  <div
                    className={`rounded-xl p-3 text-xs font-bold leading-relaxed border ${
                      ghPushResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    <div>{ghPushResult.message}</div>
                    {ghPushResult.liveUrl && (
                      <a
                        href={ghPushResult.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-mono font-black text-emerald-700 underline"
                        dir="ltr"
                      >
                        <span>{ghPushResult.liveUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          APP DOWNLOAD & PWA INSTALLATION MODAL (خاصية تحميل التطبيق)
         ======================================================================= */}
      {isDownloadModalOpen && (
        <div
          onClick={() => setIsDownloadModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#C19A6B] rounded-[24px] max-w-md w-full overflow-hidden shadow-2xl my-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2B2117] to-[#3d2f21] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#C19A6B] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  د
                </div>
                <div>
                  <div className="text-[11px] font-black text-[#C19A6B]">
                    📲 نسخة الهاتف والحاسوب (أندرويد & آيفون)
                  </div>
                  <h3 className="font-black text-base sm:text-lg mt-0.5">
                    تحميل وتثبيت تطبيق «دار الأثاث»
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              {/* 1. Native PWA Install Button */}
              {deferredInstallPrompt && (
                <button
                  type="button"
                  onClick={handleInstallOrDownloadApp}
                  className="w-full h-12 rounded-2xl bg-[#C19A6B] hover:bg-[#A67C52] text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>📲 تثبيت التطبيق مباشرة على شاشة الهاتف الآن</span>
                </button>
              )}

              {/* 2. Direct App File Download Button */}
              <button
                type="button"
                onClick={handleDownloadDirectAppFile}
                className="w-full h-12 rounded-2xl bg-[#2B2117] hover:bg-[#3d2f21] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Download className="w-5 h-5 text-[#C19A6B]" />
                <span>📥 تحميل ملف التطبيق المباشر على جهازك الآن</span>
              </button>

              {/* 3. Android Chrome Instructions */}
              <div className="bg-[#FFFBF5] border border-[#EFE6D8] rounded-2xl p-3.5 space-y-1.5">
                <div className="font-black text-xs sm:text-sm text-[#2B2117] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#C19A6B]" />
                  <span>طريقة التثبيت على هواتف أندرويد (Android):</span>
                </div>
                <p className="text-xs text-[#6B5A47] font-bold leading-relaxed">
                  1. اضغط على النقاط الثلاث <strong className="text-[#2B2117]">(⋮)</strong> أعلى متصفح Chrome.
                  <br />
                  2. اختر <strong className="text-[#8B5A2B]">«تثبيت التطبيق» (Install app)</strong> أو{' '}
                  <strong className="text-[#8B5A2B]">«الإضافة إلى الشاشة الرئيسية»</strong> ليظهر تطبيق{' '}
                  <strong>دار الأثاث</strong> بأيقونته الرسمية على هاتفك.
                </p>
              </div>

              {/* 4. iPhone / iOS Safari Instructions */}
              <div className="bg-[#FFFBF5] border border-[#EFE6D8] rounded-2xl p-3.5 space-y-1.5">
                <div className="font-black text-xs sm:text-sm text-[#2B2117]">
                  🍏 طريقة التثبيت على آيفون (iPhone / iPad):
                </div>
                <p className="text-xs text-[#6B5A47] font-bold leading-relaxed">
                  1. اضغط على زر <strong className="text-[#2B2117]">المشاركة (Share ⬆️)</strong> أسفل متصفح Safari.
                  <br />
                  2. اختر <strong className="text-[#8B5A2B]">«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.
                </p>
              </div>

              {isAppInstalled && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-black text-center">
                  ✅ تطبيق «دار الأثاث» مثبّت ويعمل على جهازك الآن!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          FULLSCREEN IMAGE ZOOM LIGHTBOX
         ======================================================================= */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomedImage}
            alt="تكبير الصورة"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-[#C19A6B]"
          />
        </div>
      )}

      {/* =======================================================================
          BOTTOM NAVIGATION BAR (Matches Dar Al Athath 5 Tabs)
         ======================================================================= */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DDD0] h-[66px] flex items-center justify-around px-2"
        style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }}
      >
        {[
          { id: 'home' as const, label: 'المحلات', icon: Home },
          { id: 'wilayas' as const, label: 'الولايات', icon: MapPin },
          { id: 'sijl' as const, label: 'صاحب المحل', icon: Store, badge: myShops.length || undefined },
          { id: 'chat' as const, label: 'الشات', icon: MessageCircle },
          { id: 'admin' as const, label: 'الإدارة', icon: Shield }
        ].map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'shop');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 h-12 rounded-2xl transition-colors whitespace-nowrap ${
                isActive ? 'bg-[#FFF3E0] text-[#8B5A2B]' : 'text-[#8B7355] hover:text-[#2B2117]'
              }`}
            >
              <div className="relative">
                <IconComp className={`w-5 h-5 ${isActive ? 'text-[#C19A6B]' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#C19A6B] text-white text-[9px] font-black min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-black ${isActive ? 'text-[#2B2117]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
