import { Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const zaloPhone = import.meta.env.VITE_ZALO_PHONE || import.meta.env.VITE_CONTACT_PHONE || '0866426854';
const contactPhone = import.meta.env.VITE_CONTACT_PHONE || zaloPhone;

export default function FloatingContact() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <div className="floating-contact" aria-label="Liên hệ nhanh">
      <a
        href={`https://zalo.me/${zaloPhone.replace(/\D/g, '')}`}
        target="_blank"
        rel="noreferrer"
        className="floating-contact__button floating-contact__button--zalo"
        aria-label="Liên hệ Zalo"
      >
        <img src="/zalo-contact.png" alt="" className="floating-contact__zalo-icon" />
        <span>Zalo</span>
      </a>
      <a
        href={`tel:${contactPhone.replace(/\s/g, '')}`}
        className="floating-contact__button floating-contact__button--phone"
        aria-label="Gọi điện"
      >
        <Phone size={23} />
        <span>Gọi ngay</span>
      </a>
    </div>
  );
}
