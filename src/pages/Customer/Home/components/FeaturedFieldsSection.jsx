export default function FeaturedFieldsSection({ featured, onViewAll }) {
  return (
    <section id="field" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-24 md:px-8">
      <div className="mb-16 flex items-end justify-between gap-6">
        <div>
          <span className="mb-2 block font-label text-sm uppercase tracking-widest text-[#88f6ff]">Top Rated</span>
          <h2 className="font-headline text-4xl font-black italic md:text-5xl">FEATURED FIELDS</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-2 font-label text-sm uppercase tracking-widest text-[#8eff71] transition-all hover:gap-4"
        >
          View all <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="group relative overflow-hidden rounded-xl bg-[#181a16] md:col-span-8 min-h-[400px]">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-80"
            src={featured.large.image}
            alt={featured.large.alt}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181a16] via-transparent to-transparent" />
          <div className="absolute bottom-0 w-full p-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <span className="mb-3 inline-block rounded-sm bg-[#8eff71] px-2 py-1 text-[10px] font-black uppercase text-[#0d6100]">
                  {featured.large.tag}
                </span>
                <h3 className="mb-2 font-headline text-3xl font-bold md:text-4xl">{featured.large.title}</h3>
                <p className="flex items-center gap-2 text-[#abaca5]">
                  <span className="material-symbols-outlined text-sm text-[#8eff71]">location_on</span>
                  {featured.large.address}
                </p>
              </div>

              <div className="text-right">
                <div className="font-headline text-2xl font-black text-[#88f6ff]">{featured.large.price}</div>
                <div className="text-[10px] uppercase tracking-tighter text-[#abaca5]">{featured.large.priceUnit}</div>
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-[#fdfdf6] px-6 py-3 text-xs font-black uppercase text-[#0d0f0b] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
                >
                  Book now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="group flex flex-col overflow-hidden rounded-xl bg-[#181a16] md:col-span-4">
          <div className="relative h-48 overflow-hidden">
            <img
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              src={featured.small1.image}
              alt={featured.small1.alt}
              loading="lazy"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <h3 className="mb-1 font-headline text-xl font-bold">{featured.small1.title}</h3>
              <p className="mb-4 text-sm text-[#abaca5]">{featured.small1.address}</p>
            </div>
            <div className="flex items-center justify-between border-t border-[#474944]/20 pt-4">
              <span className="font-headline font-bold text-[#8eff71]">{featured.small1.price}</span>
              <button
                type="button"
                className="material-symbols-outlined rounded-lg bg-[#242721] p-2 transition-colors hover:text-[#8eff71]"
                aria-label="Add to cart"
              >
                add_shopping_cart
              </button>
            </div>
          </div>
        </div>

        <div className="group flex flex-col overflow-hidden rounded-xl bg-[#181a16] md:col-span-4">
          <div className="relative h-48 overflow-hidden">
            <img
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              src={featured.small2.image}
              alt={featured.small2.alt}
              loading="lazy"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <h3 className="mb-1 font-headline text-xl font-bold">{featured.small2.title}</h3>
              <p className="mb-4 text-sm text-[#abaca5]">{featured.small2.address}</p>
            </div>
            <div className="flex items-center justify-between border-t border-[#474944]/20 pt-4">
              <span className="font-headline font-bold text-[#8eff71]">{featured.small2.price}</span>
              <button
                type="button"
                className="material-symbols-outlined rounded-lg bg-[#242721] p-2 transition-colors hover:text-[#8eff71]"
                aria-label="Add to cart"
              >
                add_shopping_cart
              </button>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-[#121410] md:col-span-8 min-h-[300px]">
          <div className="grid h-full grid-cols-1 md:grid-cols-2">
            <div className="relative overflow-hidden">
              <img
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={featured.medium.image}
                alt={featured.medium.alt}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center p-8">
              <span className="mb-2 font-label text-[10px] uppercase tracking-widest text-[#88f6ff]">
                {featured.medium.badge}
              </span>
              <h3 className="mb-4 font-headline text-3xl font-bold">{featured.medium.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-[#abaca5]">{featured.medium.desc}</p>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#242721] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6] transition-colors hover:bg-[#8eff71] hover:text-[#0d6100]"
              >
                {featured.medium.cta}
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
