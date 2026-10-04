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
						{ label: 'Your first workspace', slug: 'getting-started/first-workspace' },
					],
				},
				{
					label: 'User guide',
					items: [
						{ label: 'Workspace templates', slug: 'guide/templates' },
						{ label: 'Entities', slug: 'guide/entities' },
						{ label: 'Records', slug: 'guide/records' },
						{ label: 'Forms', slug: 'guide/forms' },
						{ label: 'Bookings', slug: 'guide/bookings' },
						{ label: 'Orders, customers and invoices', slug: 'guide/orders' },
						{ label: 'Payments', slug: 'guide/payments' },
						{ label: 'Operations and dashboards', slug: 'guide/operations' },
						{ label: 'Plugins', slug: 'guide/plugins' },
						{ label: 'Team and seats', slug: 'guide/team' },
						{ label: 'Plans and limits', slug: 'guide/plans' },
					],
				},
				{
					label: 'Developers',
					items: [
						{ label: 'API overview', slug: 'developers/overview' },
						{ label: 'Quickstart', slug: 'developers/quickstart' },
						{ label: 'Authentication', slug: 'developers/authentication' },
						{ label: 'Conventions', slug: 'developers/conventions' },
						{ label: 'Public forms', slug: 'developers/public-forms' },
						{
							label: 'Endpoint reference',
							collapsed: true,
							items: [{ autogenerate: { directory: 'developers/api' } }],
						},
					],
				},
			],
		}),
	],
});
