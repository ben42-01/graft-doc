// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://ben42-01.github.io',
	base: '/graft-doc',
	integrations: [
		starlight({
			title: 'Graft Docs',
			description: 'How Graft works, how to configure it, and how to build on its API.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ben42-01/graft-doc' }],
			sidebar: [
				{
					label: 'Getting started',
					items: [
						{ label: 'What is Graft?', slug: 'getting-started/what-is-graft' },
						{ label: 'Core concepts', slug: 'getting-started/concepts' },
					],
				},
				{
					label: 'User guide',
					items: [
						{ label: 'Entities', slug: 'guide/entities' },
						{ label: 'Forms', slug: 'guide/forms' },
						{ label: 'Payments', slug: 'guide/payments' },
						{ label: 'Team and seats', slug: 'guide/team' },
					],
				},
				{
					label: 'Developers',
					items: [
						{ label: 'API overview', slug: 'developers/overview' },
						{ label: 'Authentication', slug: 'developers/authentication' },
					],
				},
			],
		}),
	],
});
