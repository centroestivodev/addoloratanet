import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { urlFor } from '../sanity/lib/image';

function youtubeId(url?: string): string | undefined {
	if (!url) return undefined;
	const match = url.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/);
	return match?.[1];
}

const components: PortableTextComponents = {
	block: {
		h2: ({ children }) => <h2 className="pt-h2">{children}</h2>,
		h3: ({ children }) => <h3 className="pt-h3">{children}</h3>,
		normal: ({ children }) => <p className="pt-p">{children}</p>,
		blockquote: ({ children }) => (
			<blockquote className="pt-quote">
				<span aria-hidden="true" className="pt-quote__mark">“</span>
				<p>{children}</p>
			</blockquote>
		),
	},
	list: {
		bullet: ({ children }) => <ul className="pt-list">{children}</ul>,
		number: ({ children }) => <ol className="pt-list">{children}</ol>,
	},
	marks: {
		strong: ({ children }) => <strong className="pt-strong">{children}</strong>,
		em: ({ children }) => <em>{children}</em>,
		link: ({ value, children }) => (
			<a href={value?.href} target="_blank" rel="noopener noreferrer">
				{children}
			</a>
		),
	},
	types: {
		image: ({ value }) => (
			<img
				src={urlFor(value).width(1440).height(960).auto('format').url()}
				alt={value.alt ?? ''}
				className="pt-image"
				loading="lazy"
				decoding="async"
			/>
		),
		youtube: ({ value }) => {
			const id = youtubeId(value?.url);
			if (!id) return null;
			return (
				<div className="pt-video">
					<iframe
						src={`https://www.youtube-nocookie.com/embed/${id}`}
						title="Video YouTube"
						loading="lazy"
						allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			);
		},
	},
};

export default function PortableTextBody({ value }: { value: any }) {
	return (
		<div className="pt-body">
			<PortableText value={value} components={components} />
		</div>
	);
}
