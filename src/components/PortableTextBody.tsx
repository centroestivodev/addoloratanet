import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { urlFor } from '../sanity/lib/image';

const components: PortableTextComponents = {
	block: {
		h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-3">{children}</h2>,
		h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-2">{children}</h3>,
		normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
		blockquote: ({ children }) => (
			<blockquote className="border-l-4 border-primary pl-4 italic my-4 text-base-content/80">{children}</blockquote>
		),
	},
	list: {
		bullet: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
		number: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
	},
	marks: {
		strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
		em: ({ children }) => <em className="italic">{children}</em>,
		link: ({ value, children }) => (
			<a
				href={value?.href}
				className="link link-primary"
				target="_blank"
				rel="noopener noreferrer"
			>
				{children}
			</a>
		),
	},
	types: {
		image: ({ value }) => (
			<img
				src={urlFor(value).width(1200).auto('format').url()}
				alt={value.alt ?? ''}
				className="rounded-box my-6"
			/>
		),
	},
};

export default function PortableTextBody({ value }: { value: any }) {
	return <PortableText value={value} components={components} />;
}
