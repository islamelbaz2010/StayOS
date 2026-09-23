type BlockContent = Record<string, unknown>;

interface CmsBlockData {
  id: string;
  block_type: string;
  content: BlockContent;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function Hero({ content }: { content: BlockContent }) {
  return (
    <section className="rounded-2xl bg-brand-50 px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-brand-900 sm:text-4xl">
        {str(content.heading)}
      </h1>
      {str(content.subheading) && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          {str(content.subheading)}
        </p>
      )}
      {str(content.cta_label) && str(content.cta_href) && (
        <a
          href={str(content.cta_href)}
          className="mt-8 inline-block rounded-md bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
        >
          {str(content.cta_label)}
        </a>
      )}
    </section>
  );
}

function HeadingText({ content }: { content: BlockContent }) {
  return (
    <section>
      {str(content.heading) && (
        <h2 className="text-2xl font-bold text-brand-900">
          {str(content.heading)}
        </h2>
      )}
      {str(content.body) && (
        <p className="mt-3 whitespace-pre-line text-neutral-700">
          {str(content.body)}
        </p>
      )}
    </section>
  );
}

function ImageText({ content }: { content: BlockContent }) {
  return (
    <section className="grid items-center gap-6 sm:grid-cols-2">
      {str(content.image_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={str(content.image_url)}
          alt={str(content.alt)}
          className="w-full rounded-xl object-cover"
        />
      )}
      <div>
        {str(content.heading) && (
          <h2 className="text-2xl font-bold text-brand-900">
            {str(content.heading)}
          </h2>
        )}
        {str(content.body) && (
          <p className="mt-3 whitespace-pre-line text-neutral-700">
            {str(content.body)}
          </p>
        )}
      </div>
    </section>
  );
}

function FeatureCards({ content }: { content: BlockContent }) {
  const cards = list<Record<string, unknown>>(content.cards);
  return (
    <section>
      {str(content.heading) && (
        <h2 className="text-2xl font-bold text-brand-900">
          {str(content.heading)}
        </h2>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-5"
          >
            <h3 className="font-semibold text-brand-900">
              {str(card.title)}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              {str(card.body)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta({ content }: { content: BlockContent }) {
  return (
    <section className="rounded-2xl bg-brand-900 px-6 py-12 text-center">
      <h2 className="text-2xl font-bold text-white">
        {str(content.heading)}
      </h2>
      {str(content.cta_label) && str(content.cta_href) && (
        <a
          href={str(content.cta_href)}
          className="mt-6 inline-block rounded-md bg-white px-6 py-3 font-medium text-brand-900 hover:bg-neutral-100"
        >
          {str(content.cta_label)}
        </a>
      )}
    </section>
  );
}

function Faq({ content }: { content: BlockContent }) {
  const items = list<Record<string, unknown>>(content.items);
  return (
    <section>
      {str(content.heading) && (
        <h2 className="text-2xl font-bold text-brand-900">
          {str(content.heading)}
        </h2>
      )}
      <div className="mt-6 space-y-4">
        {items.map((item, i) => (
          <details
            key={i}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <summary className="cursor-pointer font-medium text-neutral-800">
              {str(item.question)}
            </summary>
            <p className="mt-2 text-sm text-neutral-600">
              {str(item.answer)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Testimonial({ content }: { content: BlockContent }) {
  const items = list<Record<string, unknown>>(content.items);
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <figure
          key={i}
          className="rounded-xl border border-neutral-200 bg-white p-5"
        >
          <blockquote className="text-neutral-700">
            “{str(item.quote)}”
          </blockquote>
          <figcaption className="mt-3 text-sm font-medium text-neutral-500">
            {str(item.author)}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

function Banner({ content }: { content: BlockContent }) {
  return (
    <section className="rounded-xl bg-accent-50 px-6 py-4 text-center text-sm font-medium text-accent-800">
      {str(content.text)}
      {str(content.link_label) && str(content.link_href) && (
        <a
          href={str(content.link_href)}
          className="ms-2 underline"
        >
          {str(content.link_label)}
        </a>
      )}
    </section>
  );
}

function Gallery({ content }: { content: BlockContent }) {
  const images = list<Record<string, unknown>>(content.images);
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {images.map((image, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={str(image.url)}
          alt={str(image.alt)}
          className="w-full rounded-xl object-cover"
        />
      ))}
    </section>
  );
}

function RichText({ content }: { content: BlockContent }) {
  return (
    <section className="prose max-w-none whitespace-pre-line text-neutral-700">
      {str(content.body)}
    </section>
  );
}

const RENDERERS: Record<
  string,
  (props: { content: BlockContent }) => React.ReactElement
> = {
  hero: Hero,
  heading_text: HeadingText,
  image_text: ImageText,
  feature_cards: FeatureCards,
  cta: Cta,
  faq: Faq,
  testimonial: Testimonial,
  banner: Banner,
  announcement: Banner,
  gallery: Gallery,
  rich_text: RichText,
};

export function BlockRenderer({ blocks }: { blocks: CmsBlockData[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block) => {
        const Renderer = RENDERERS[block.block_type];
        if (!Renderer) return null;
        return <Renderer key={block.id} content={block.content} />;
      })}
    </div>
  );
}
