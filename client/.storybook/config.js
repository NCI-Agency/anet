import { configure, addParameters } from '@storybook/react'

addParameters({
	options: {
		name: 'ANET component library',
		goFullScreen: false,
		showAddonsPanel: true,
		showSearchBox: false,
		addonPanelInRight: true,
		sortStoriesByKind: false,
		hierarchySeparator: /\./,
		hierarchyRootSeparator: /\|/,
		enableShortcuts: true,
	},
});

/**
 * Automatically import all story js files that end with *.stories.js
 */
function loadStories() {
	const req = require.context('../stories', true, /\.stories\.js$/)
	req.keys().forEach(filename => req(filename));
}

configure(loadStories, module)
