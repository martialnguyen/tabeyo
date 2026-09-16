import { BadgeCheck, MapPin, Phone, Send, Sparkles } from 'lucide-react';

const phoneNumber = '0866426854';
const zaloUrl = `https://zalo.me/${phoneNumber}`;

export default function ShopFooter() {
  return (
    <footer className="shop-footer mt-6">
      <div className="shop-footer__inner mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div className="animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-sky-100">
              <Sparkles size={14} className="text-cyan-300" />
              Anipad Premium Store
            </div>
            <div className="mb-3 flex items-center gap-3 text-2xl font-extrabold text-white">
              <span className="shop-footer__logo-wrap">
                <img src="/anipad-logo.jpeg" alt="Anipad" className="h-12 w-12 rounded-full object-cover" />
              </span>
              <span>Anipad</span>
            </div>
            <p className="m-0 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Cửa hàng iPad, laptop, điện thoại với tư vấn nhanh, ảnh thật, cấu hình rõ ràng và hỗ trợ đặt hàng toàn quốc.
            </p>
            <div className="mt-5 grid max-w-xl grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-200 sm:text-sm">
              <div className="shop-footer__mini-card">Ảnh thật</div>
              <div className="shop-footer__mini-card">Tư vấn nhanh</div>
              <div className="shop-footer__mini-card">Bảo hành rõ</div>
            </div>
          </div>

          <div className="shop-footer__contact animate-fade-up">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-cyan-100">
              <BadgeCheck size={16} className="text-emerald-300" />
              Liên hệ cửa hàng
            </div>
            <div className="space-y-2">
              <a
                href="https://maps.google.com/?q=S2.17%20Vinhome%20Ocean%20park%20Gia%20L%C3%A2m%20H%C3%A0%20N%E1%BB%99i"
                target="_blank"
                rel="noreferrer"
                className="shop-footer__link"
              >
                <span className="shop-footer__icon">
                  <MapPin size={18} />
                </span>
                <span>S2.17 Vinhome Ocean Park, Gia Lâm, Hà Nội</span>
              </a>
              <a href={`tel:${phoneNumber}`} className="shop-footer__link">
                <span className="shop-footer__icon">
                  <Phone size={18} />
                </span>
                <span>{phoneNumber}</span>
              </a>
              <a href={zaloUrl} target="_blank" rel="noreferrer" className="shop-footer__link">
                <span className="shop-footer__icon">
                  <Send size={18} />
                </span>
                <span>Zalo: {phoneNumber}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="shop-footer__bottom mt-7 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Anipad. Thiết bị đẹp, giá tốt cho người mua nhanh.</span>
          <span>iPad • Laptop • Điện thoại • Phụ kiện</span>
        </div>
      </div>
    </footer>
  );
}
