import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { join } from 'path';


const config: ForgeConfig = {
  packagerConfig: {
    name: '烟熏三文鱼的阅读神器',
    executableName: 'rss-reader',
    asar: true,
    icon: join(__dirname, './public/icon'),
    appBundleId: 'com.w4vo.app',
    extraResource: [
      './dist/web-dist'
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({}),
    new MakerDeb({}),
  ],
};

export default config;
