import { Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const zaloPhone = import.meta.env.VITE_ZALO_PHONE || import.meta.env.VITE_CONTACT_PHONE || '0866426854';
const contactPhone = import.meta.env.VITE_CONTACT_PHONE || zaloPhone;

function ZaloIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-6 w-6">
      <circle cx="24" cy="24" r="24" fill="#0068ff" />
      <path
        fill="#fff"
        d="M14.4 31.4h13.3v-3.1h-7.9l7.6-9.3v-2.4H15.2v3.1h6.7l-7.5 9.2v2.5Zm16.5 0h3.4v-6.5c0-1.7.9-2.8 2.4-2.8 1.3 0 2.1.9 2.1 2.5v6.8h3.4v-7.4c0-3-1.8-4.9-4.6-4.9-1.5 0-2.6.6-3.3 1.6v-1.3h-3.4v12Z"
      />
    </svg>
  );
}

export default function FloatingContact() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <div className="floating-contact" aria-label="Lien he nhanh">
      <a
        href={`https://zalo.me/${zaloPhone.replace(/\D/g, '')}`}
        target="_blank"
        rel="noreferrer"
        className="floating-contact__button floating-contact__button--zalo"
        aria-label="Lien he Zalo"
      >
        <ZaloIcon />
        <span>Zalo</span>
      </a>
      <a
        href={`tel:${contactPhone.replace(/\s/g, '')}`}
        className="floating-contact__button floating-contact__button--phone"
        aria-label="Goi dien"
      >
        <Phone size={23} />
        <span>Goi ngay</span>
      </a>
    </div>
  );
}
