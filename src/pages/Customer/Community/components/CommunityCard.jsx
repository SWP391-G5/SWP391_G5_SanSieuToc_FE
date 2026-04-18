import { Link } from 'react-router-dom';
import DEFAULT_FIELD_IMAGE_URL from '../../../../utils/defaultFieldImage';

export default function CommunityCard({ item }) {
  return (
    <Link to={`/community/${item.id}`} state={{ item }} className="block">
      <article className="group overflow-hidden rounded-xl border border-[#474944]/20 bg-[#121410] transition-all duration-300 hover:scale-[1.01]">
      <div className="relative h-40 overflow-hidden">
        <img
          alt={item.imageAlt}
          src={item.image || DEFAULT_FIELD_IMAGE_URL}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_FIELD_IMAGE_URL;
          }}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#0d0f0b]/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71] backdrop-blur-md">
          <span className="material-symbols-outlined text-sm">forum</span>
          {item.tag}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h3 className="font-headline line-clamp-2 text-xl font-black text-[#fdfdf6] transition-colors group-hover:text-[#8eff71]">
          {item.title}
        </h3>
        <p className="line-clamp-2 text-sm text-[#abaca5]">{item.excerpt}</p>

        <div className="mt-2 flex items-center justify-between border-t border-[#474944]/20 pt-4 text-xs text-[#abaca5]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">account_circle</span>
            <span className="font-medium text-[#fdfdf6]/80">{item.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>{item.time}</span>
          </div>
        </div>
      </div>
      </article>
    </Link>
  );
}
