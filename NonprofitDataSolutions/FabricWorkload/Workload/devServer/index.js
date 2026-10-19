/**
 * DevServer APIs index file
 * Exports all API routers for the dev server
 */

const manifestApi = require('./manifestApi');

/**
 * Register all dev server APIs with an Express application
 * @param {object} app Express application
 */
function registerDevServerApis(app) {
	console.log('*** Mounting Manifest API ***');
	app.use('/', manifestApi);
}

module.exports = {
	manifestApi,
	registerDevServerApis,
};
