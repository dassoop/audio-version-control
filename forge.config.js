const path = require("path")
require('dotenv').config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

module.exports = {
  packagerConfig: 
  {
    icon: path.join(__dirname, 'assets/Logo'),

    osxSign: 
    {
      indentifier: process.env.APPLE_CERT
    },

    osxNotarize: 
    {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }
  },
  rebuildConfig: {},

  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },

    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },

    {
      name: '@electron-forge/maker-deb',
      config: {},
    },

    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],

  publishers: [
    {
      name: '@electron-forge/publisher-github',

      config: {
        repository: {
          owner: 'dassoop',
          name: 'audio-version-control'
        },

        prerelease: false
      }
    }
  ]
};
