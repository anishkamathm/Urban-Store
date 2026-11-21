import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, MapPin, Phone, Mail, ShieldCheck, RotateCcw, Zap, Leaf } from 'lucide-react';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-pink-400 shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isKn ? '30-ನಿಮಿಷಗಳ ಇನ್‌ಸ್ಟಂಟ್ ಡೆಲಿವರಿ' : '30-Min Instant Delivery'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isKn
                  ? 'ನಿಮ್ಮ ಸಮೀಪದ ಅರ್ಬನ್ ಸ್ಟೋರ್‌ನಿಂದ ತಕ್ಷಣ ಮನೆಬಾಗಿಲಿಗೆ ಡೆಲಿವರಿ.'
                  : 'Direct dispatch from our nearest flagship store hub.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-pink-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isKn ? '7 ದಿನಗಳ ಸುಲಭ ರಿಟರ್ನ್' : '7-Day Clothes Returns'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isKn
                  ? 'ಉಡುಪುಗಳಿಗೆ 7 ದಿನಗಳೊಳಗೆ ಸುಲಭ ರಿಟರ್ನ್ ಮತ್ತು ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಮರುಪಾವತಿ.'
                  : 'Hassle-free pickups for clothes with instant refunds to original payment method.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-emerald-400 shrink-0">
              <Leaf className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isKn ? 'ಪರಿಸರ ಸ್ನೇಹಿ ಇಕೋ ಡೆಲಿವರಿ' : 'Eco-Impact Optimized'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isKn
                  ? 'ಕರ್ನಾಟಕದಾದ್ಯಂತ ಎಲೆಕ್ಟ್ರಿಕ್ ದ್ವಿಚಕ್ರ ವಾಹನಗಳ ಮೂಲಕ ಹಸಿರು ವಿತರಣೆ.'
                  : 'Local fulfillment saving kg of carbon emissions on every order.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-purple-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isKn ? '100% ಅಸಲಿ ಫ್ಯಾಷನ್' : '100% Certified Authentic'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isKn
                  ? 'ಅಧಿಕೃತ ರೋಸ್ ಗೋಲ್ಡ್ ವಾಚ್‌ಗಳು, ಇಟಾಲಿಯನ್ ಶೂಗಳು ಮತ್ತು ಕ್ಯಾಶ್ಮಿಯರ್ ಬಟ್ಟೆಗಳು.'
                  : 'Luxury chronographs, handcrafted leather boots, and designer handbags.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Navigation & Info Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Brand story */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 fill-pink-300 text-pink-300" />
              </div>
              <span className="text-xl font-bold text-white font-serif tracking-wider uppercase">
                URBAN <span className="text-pink-400">STORE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKn
                ? 'ಕರ್ನಾಟಕದಾದ್ಯಂತ ಪ್ರೀಮಿಯಂ ಫ್ಯಾಷನ್, ವಾಚ್‌ಗಳು, ಶೂಗಳು ಮತ್ತು ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್‌ಗಳ ಆಧುನಿಕ ಚಿಲ್ಲರೆ ಮಳಿಗೆ. ಆನ್‌ಲೈನ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಮಳಿಗೆಯ ಸಮನ್ವಯ.'
                : 'Karnataka’s premier fashion and lifestyle destination. Merging luxury offline retail boutiques with instant 30-minute online delivery.'}
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>Flagship: 100ft Rd, Indiranagar, Bengaluru</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>+91 80 4920 1800 (Store Concierge)</span>
              </p>
            </div>
          </div>

          {/* Column 2: Wardrobe Collections */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-100">
              {isKn ? 'ಫ್ಯಾಷನ್ ಸಂಗ್ರಹ' : 'Fashion Collections'}
            </h5>
            <ul className="text-xs text-slate-400 space-y-2">
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ರೋಸ್ ಗೋಲ್ಡ್ & ಕ್ರೋನೋಗ್ರಾಫ್ ವಾಚ್‌ಗಳು' : 'Luxury Rose Gold Watches'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಇಟಾಲಿಯನ್ ಲೆದರ್ ಚೆಲ್ಸಿಯಾ ಬೂಟ್ಸ್' : 'Italian Leather Chelsea Boots'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಕ್ಯಾಶ್ಮಿಯರ್ ಉಡುಪುಗಳು & ಬ್ಲೇಜರ್ಸ್' : 'Tailored Blazers & Outerwear'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಡಿಸೈನರ್ ಲೆದರ್ ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್‌ಗಳು' : 'Designer Leather Handbags'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಸ್ಲಿಮ್ ಬೈ-ಫೋಲ್ಡ್ ವಾಲೆಟ್‌ಗಳು' : 'RFID Protected Wallets'}</span></li>
            </ul>
          </div>

          {/* Column 3: Retail Network */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-100">
              {isKn ? 'ಮಳಿಗೆಗಳ ಜಾಲ (ಕರ್ನಾಟಕ)' : 'Store Locations'}
            </h5>
            <ul className="text-xs text-slate-400 space-y-2">
              <li><span>Indiranagar 100ft Road, Bengaluru</span></li>
              <li><span>Brigade Road Lifestyle Center, Bengaluru</span></li>
              <li><span>Koramangala 5th Block Boutique, Bengaluru</span></li>
              <li><span>Jayanagar 4th Block Galleria, Bengaluru</span></li>
              <li><span>Malleshwaram 8th Cross, Bengaluru</span></li>
              <li><span>D. Devaraj Urs Road, Mysuru</span></li>
              <li><span>Coen Road Retail Hub, Hubballi</span></li>
            </ul>
          </div>

          {/* Column 4: Customer Care & Policies */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-100">
              {isKn ? 'ಗ್ರಾಹಕ ಸೇವೆ' : 'Customer Care'}
            </h5>
            <ul className="text-xs text-slate-400 space-y-2">
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? '7-ದಿನಗಳ ರಿಟರ್ನ್ ನಿಯಮಾವಳಿ' : '7-Day Return Policy'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? '30-ನಿಮಿಷಗಳ ವಿತರಣಾ ಹಬ್‌ಗಳು' : '30-Min Delivery Eligibility'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಅಳತೆ ಗೈಡ್ (Size Chart)' : 'Size & Measurement Chart'}</span></li>
              <li><span className="hover:text-pink-300 transition cursor-pointer">{isKn ? 'ಗೌಪ್ಯತೆ ಮತ್ತು ಸೇವಾ ನಿಯಮಗಳು' : 'Privacy & Purchase Terms'}</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Security */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Urban Store Retail Ltd. {isKn ? 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-[11px] font-semibold text-slate-400">100% Secure Checkout:</span>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold text-slate-300">UPI / QR</span>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold text-slate-300">RuPay</span>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold text-slate-300">Visa / Master</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
